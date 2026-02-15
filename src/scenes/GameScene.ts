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
      // Generate rooms
      this.roomGenerator = new RoomGenerator();
      const rooms = this.roomGenerator.generateRooms(GameConfig.maxRooms);

      if (rooms.length === 0) {
        console.error('No rooms generated!');
        return;
      }

      // Draw walls
      this.drawWalls();

      // Create player in first room
      const firstRoom = rooms[0];
      const playerPos = this.roomGenerator.getRandomPositionInRoom(firstRoom);
      this.player = new Player(this, playerPos.x, playerPos.y);

      // Create fragments in random rooms
      for (let i = 0; i < GameConfig.fragmentsRequired; i++) {
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const pos = this.roomGenerator.getRandomPositionInRoom(room);
        const fragment = new Fragment(this, pos.x, pos.y);
        this.fragments.push(fragment);
      }

      // Create treasure in a random room (not the first)
      const treasureRoom = rooms[Math.min(1, rooms.length - 1)];
      const treasurePos = this.roomGenerator.getRandomPositionInRoom(treasureRoom);
      this.treasure = new Treasure(this, treasurePos.x, treasurePos.y);

      // Create enemies in rooms (skip first room where player starts)
      for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        for (let j = 0; j < GameConfig.enemiesPerRoom; j++) {
          let enemyPos;
          let attempts = 0;
          const maxAttempts = 10;

          // Try to find a position far from the player
          do {
            enemyPos = this.roomGenerator.getRandomPositionInRoom(room);
            const distanceToPlayer = Phaser.Math.Distance.Between(
              playerPos.x,
              playerPos.y,
              enemyPos.x,
              enemyPos.y
            );

            // Ensure enemy is at least 200 pixels away from player
            if (distanceToPlayer > 200) {
              break;
            }
            attempts++;
          } while (attempts < maxAttempts);

          const enemy = new Enemy(this, enemyPos.x, enemyPos.y);
          this.enemies.push(enemy);
        }
      }

      // Setup input
      this.cursors = this.input.keyboard!.createCursorKeys();

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
      // Win!
      this.progressManager.recordGameWon(this.fragmentsCollected);
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { won: true, fragments: this.fragmentsCollected });
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
        // Game over
        this.progressManager.recordGameLost(this.fragmentsCollected);
        this.scene.stop('UIScene');
        this.scene.start('GameOverScene', {
          won: false,
          fragments: this.fragmentsCollected,
        });
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
