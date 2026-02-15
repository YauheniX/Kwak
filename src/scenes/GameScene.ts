import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Fragment, Treasure } from '../entities/Collectible';
import { RoomGenerator } from '../systems/roomGenerator';
import { GameConfig } from '../config/gameConfig';
import { ProgressManager } from '../utils/progressManager';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private fragments: Fragment[] = [];
  private treasure!: Treasure;
  private roomGenerator!: RoomGenerator;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private fragmentsCollected: number = 0;
  private progressManager: ProgressManager;
  private wallGraphics!: Phaser.GameObjects.Graphics;
  private lastHitTime: number = 0;
  private hitCooldown: number = 2000; // 2 second cooldown between hits
  private collisionsEnabled: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
    this.progressManager = new ProgressManager();
  }

  create(): void {
    try {
      // Generate rooms with enhanced procedural dungeon generation
      this.roomGenerator = new RoomGenerator();
      const rooms = this.roomGenerator.generateRooms(GameConfig.maxRooms);

      if (rooms.length === 0) {
        console.error('No rooms generated!');
        return;
      }

      // Draw walls and corridors
      this.drawWalls();

      // Create player in first room
      const firstRoom = rooms[0];
      const playerPos = this.roomGenerator.getRandomPositionInRoom(firstRoom);
      this.player = new Player(this, playerPos.x, playerPos.y);

      // Ensure at least one fragment per dungeon (distribute across rooms)
      // Place fragments ensuring at least one fragment exists
      const fragmentCount = Math.max(1, GameConfig.fragmentsRequired);
      for (let i = 0; i < fragmentCount; i++) {
        // Distribute fragments across different rooms when possible
        const roomIndex = i % rooms.length;
        const room = rooms[roomIndex];
        const pos = this.roomGenerator.getRandomPositionInRoom(room);
        const fragment = new Fragment(this, pos.x, pos.y);
        this.fragments.push(fragment);
      }

      // Create treasure in a different room from player when possible
      const treasureRoomIndex =
        rooms.length > 1 ? Math.floor(Math.random() * (rooms.length - 1)) + 1 : 0;
      const treasureRoom = rooms[treasureRoomIndex];
      const treasurePos = this.roomGenerator.getRandomPositionInRoom(treasureRoom);
      this.treasure = new Treasure(this, treasurePos.x, treasurePos.y);

      // Create enemies with minimum distance from player spawn
      // Skip first room to give player breathing room
      for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        
        // Support multiple spawn points per room
        const enemyCount = GameConfig.enemiesPerRoom;
        const enemyPositions = this.roomGenerator.getMultiplePositionsInRoom(
          room,
          enemyCount,
          64 // Minimum 64 pixels between enemies
        );

        // Create enemies at calculated positions
        for (const enemyPos of enemyPositions) {
          // Ensure minimum distance from player spawn
          const distanceToPlayer = Phaser.Math.Distance.Between(
            playerPos.x,
            playerPos.y,
            enemyPos.x,
            enemyPos.y
          );

          // Only create enemy if far enough from player (200+ pixels)
          if (distanceToPlayer >= 200) {
            const enemy = new Enemy(this, enemyPos.x, enemyPos.y);
            this.enemies.push(enemy);
          }
        }
      }

      // If first room has multiple potential enemy positions, try spawning there too
      // but only if positions are far from player
      if (GameConfig.enemiesPerRoom > 0 && rooms.length === 1) {
        const farPos = this.roomGenerator.getPositionFarFrom(
          firstRoom,
          playerPos.x,
          playerPos.y,
          200
        );
        if (farPos) {
          const enemy = new Enemy(this, farPos.x, farPos.y);
          this.enemies.push(enemy);
        }
      }

      // Setup input
      this.cursors = this.input.keyboard!.createCursorKeys();

      // Setup pointer/touch input for mobile
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // Don't process clicks on UI elements or if game is over
        if (this.player && this.scene.isActive('GameScene')) {
          this.player.setTarget(pointer.worldX, pointer.worldY);
        }
      });

      // Setup collisions
      this.setupCollisions();

      // Give player initial invulnerability
      this.lastHitTime = this.time.now;

      // Enable collisions after a short delay
      this.time.delayedCall(500, () => {
        this.collisionsEnabled = true;
      });

      // Emit initial state to UI
      this.emitGameState();
    } catch (error) {
      console.error('Error creating game scene:', error);
    }
  }

  private drawWalls(): void {
    this.wallGraphics = this.add.graphics();
    this.wallGraphics.fillStyle(0x444444, 1);

    const { tileSize } = GameConfig;
    const rooms = this.roomGenerator.getRooms();
    const corridors = this.roomGenerator.getCorridors();

    // Draw room walls
    for (const room of rooms) {
      for (let x = room.x; x < room.x + room.width; x++) {
        for (let y = room.y; y < room.y + room.height; y++) {
          if (this.roomGenerator.isWall(x, y)) {
            this.wallGraphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          }
        }
      }
    }

    // Draw corridor walls
    // Corridors are included in the isWall check, but we need to draw their borders
    const corridorWidth = this.roomGenerator.getCorridorWidth();
    const halfWidth = Math.floor(corridorWidth / 2);
    
    for (const corridor of corridors) {
      const { x1, y1, x2, y2 } = corridor;

      // Horizontal corridor
      if (y1 === y2) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        
        // Draw top and bottom walls
        for (let x = minX; x <= maxX; x++) {
          // Top wall
          this.wallGraphics.fillRect(
            x * tileSize,
            (y1 - halfWidth - 1) * tileSize,
            tileSize,
            tileSize
          );
          // Bottom wall
          this.wallGraphics.fillRect(
            x * tileSize,
            (y1 + halfWidth + 1) * tileSize,
            tileSize,
            tileSize
          );
        }
      }
      // Vertical corridor
      else if (x1 === x2) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        
        // Draw left and right walls
        for (let y = minY; y <= maxY; y++) {
          // Left wall
          this.wallGraphics.fillRect(
            (x1 - halfWidth - 1) * tileSize,
            y * tileSize,
            tileSize,
            tileSize
          );
          // Right wall
          this.wallGraphics.fillRect(
            (x1 + halfWidth + 1) * tileSize,
            y * tileSize,
            tileSize,
            tileSize
          );
        }
      }
    }
  }

  private setupCollisions(): void {
    // Player collects fragments
    this.fragments.forEach((fragment) => {
      this.physics.add.overlap(
        this.player.sprite,
        fragment.sprite,
        () => this.collectFragment(fragment),
        undefined,
        this
      );
    });

    // Player collects treasure
    this.physics.add.overlap(
      this.player.sprite,
      this.treasure.sprite,
      () => this.collectTreasure(),
      undefined,
      this
    );

    // Don't setup enemy collisions here - we'll check manually in update
  }

  private collectFragment(fragment: Fragment): void {
    if (!fragment.collected) {
      fragment.collect();
      this.fragmentsCollected++;
      this.emitGameState();

      // Check if all fragments collected
      if (this.fragmentsCollected >= GameConfig.fragmentsRequired) {
        this.treasure.unlock();
      }
    }
  }

  private collectTreasure(): void {
    if (!this.treasure.isLocked()) {
      // Win! Lazy-load GameOverScene before transitioning
      this.progressManager.recordGameWon(this.fragmentsCollected);
      this.scene.stop('UIScene');
      
      // Ensure GameOverScene is loaded before starting it
      if (window.sceneManager) {
        window.sceneManager.loadScene('GameOverScene').then(() => {
          this.scene.start('GameOverScene', { won: true, fragments: this.fragmentsCollected });
        });
      } else {
        this.scene.start('GameOverScene', { won: true, fragments: this.fragmentsCollected });
      }
    }
  }

  private hitEnemy(): void {
    const currentTime = this.time.now;

    // Only take damage if cooldown has passed
    if (currentTime - this.lastHitTime > this.hitCooldown) {
      this.lastHitTime = currentTime;
      this.player.takeDamage(10); // Reduced from 20 to 10
      this.emitGameState();

      // Flash the player to show they were hit
      this.tweens.add({
        targets: this.player.sprite,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 2,
      });

      if (this.player.health <= 0) {
        // Game over - lazy-load GameOverScene before transitioning
        this.progressManager.recordGameLost(this.fragmentsCollected);
        this.scene.stop('UIScene');
        
        // Ensure GameOverScene is loaded before starting it
        if (window.sceneManager) {
          window.sceneManager.loadScene('GameOverScene').then(() => {
            this.scene.start('GameOverScene', {
              won: false,
              fragments: this.fragmentsCollected,
            });
          });
        } else {
          this.scene.start('GameOverScene', {
            won: false,
            fragments: this.fragmentsCollected,
          });
        }
      }
    }
  }

  private emitGameState(): void {
    this.events.emit('updateUI', {
      health: this.player.health,
      fragments: this.fragmentsCollected,
      fragmentsRequired: GameConfig.fragmentsRequired,
    });
  }

  override update(_time: number, delta: number): void {
    // Update player
    this.player.update(this.cursors);

    // Update enemies
    const playerPos = this.player.getPosition();
    this.enemies.forEach((enemy) => {
      enemy.update(delta, playerPos);

      // Check for collision with player manually (only if collisions enabled)
      if (this.collisionsEnabled) {
        const distance = Phaser.Math.Distance.Between(
          this.player.sprite.x,
          this.player.sprite.y,
          enemy.sprite.x,
          enemy.sprite.y
        );

        // Hit if within combined radius
        if (distance < GameConfig.playerSize + GameConfig.enemySize) {
          this.hitEnemy();
        }
      }
    });
  }
}
