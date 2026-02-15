import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Treasure } from '../entities/Collectible';
import { RoomGenerator } from '../systems/roomGenerator';
import { EnemySpawner } from '../systems/enemySpawner';
import { MapFragmentSystem, FragmentState, FragmentLocationType } from '../systems/mapFragment';
import { CurrencySystem } from '../systems/currency';
import { Merchant } from '../entities/Merchant';
import { GameConfig } from '../config/gameConfig';
import { ProgressManager } from '../utils/progressManager';
import { saveManager } from '../core/saveManager';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private treasure!: Treasure;
  private roomGenerator!: RoomGenerator;
  private enemySpawner!: EnemySpawner;
  private mapFragmentSystem!: MapFragmentSystem;
  private currencySystem!: CurrencySystem;
  private merchant?: Merchant;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
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
      // Reset run state for a new run
      saveManager.resetRun();
      
      // Generate dungeon with graph-based procedural generation
      this.roomGenerator = new RoomGenerator();
      const dungeon = this.roomGenerator.generateDungeon();

      if (dungeon.rooms.length === 0) {
        console.error('No rooms generated!');
        return;
      }

      // Draw walls and corridors
      this.drawWalls();

      // Get spawn room
      const spawnRoom = dungeon.rooms.find((r) => r.id === dungeon.spawnRoomId);
      if (!spawnRoom) {
        console.error('Spawn room not found!');
        return;
      }

      // Create player in spawn room
      const playerPos = this.roomGenerator.getRandomPositionInRoom(spawnRoom);
      this.player = new Player(this, playerPos.x, playerPos.y);

      // Initialize enemy spawner system
      this.enemySpawner = new EnemySpawner(this, this.roomGenerator);

      // Spawn enemies using the modular system
      this.enemies = this.enemySpawner.spawnEnemies(
        dungeon.rooms,
        playerPos,
        dungeon.spawnRoomId
      );

      // Initialize currency system from save state or default
      const runState = saveManager.getRunState();
      this.currencySystem = new CurrencySystem(runState.gold);

      // Initialize map fragment system
      this.mapFragmentSystem = new MapFragmentSystem({
        minFragments: 3,
        maxFragments: 5,
        merchantFragmentChance: 0.5,
        fragmentPurchaseCost: 100,
      });

      // Generate fragment data
      const fragmentData = this.mapFragmentSystem.generateFragments(
        dungeon.rooms,
        dungeon.shopRoomId
      );

      // Save total fragments to run state
      saveManager.updateRunState({
        totalFragmentsInRun: fragmentData.length,
      });

      // Place fragments in rooms
      for (const fragment of fragmentData) {
        if (fragment.locationType === FragmentLocationType.ROOM && fragment.roomId !== undefined) {
          const room = dungeon.rooms.find(r => r.id === fragment.roomId);
          if (room) {
            const pos = this.roomGenerator.getRandomPositionInRoom(room);
            this.mapFragmentSystem.updateFragmentPosition(fragment.id, pos.x, pos.y);
          }
        }
      }

      // Create merchant in shop room
      const shopRoom = dungeon.rooms.find(r => r.id === dungeon.shopRoomId);
      if (shopRoom) {
        const merchantPos = this.roomGenerator.getRandomPositionInRoom(shopRoom);
        this.merchant = new Merchant(this, merchantPos.x, merchantPos.y);

        // Update merchant fragment position
        const merchantFragments = this.mapFragmentSystem.getMerchantFragments();
        if (merchantFragments.length > 0) {
          // Place fragment near merchant
          this.mapFragmentSystem.updateFragmentPosition(
            merchantFragments[0].id,
            merchantPos.x + 40,
            merchantPos.y
          );
        }
      }

      // Create fragment sprites
      this.mapFragmentSystem.createFragmentSprites(this);

      // Create treasure in treasure room
      const treasureRoom = dungeon.rooms.find((r) => r.id === dungeon.treasureRoomId);
      if (treasureRoom) {
        const treasurePos = this.roomGenerator.getRandomPositionInRoom(treasureRoom);
        this.treasure = new Treasure(this, treasurePos.x, treasurePos.y);
      } else {
        // Fallback to random room
        const room = dungeon.rooms[Math.min(1, dungeon.rooms.length - 1)];
        const treasurePos = this.roomGenerator.getRandomPositionInRoom(room);
        this.treasure = new Treasure(this, treasurePos.x, treasurePos.y);
      }

      // Setup input
      this.cursors = this.input.keyboard!.createCursorKeys();
      this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

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
    const fragmentSprites = this.mapFragmentSystem.getFragments();
    fragmentSprites.forEach((fragmentData) => {
      const sprite = this.mapFragmentSystem.getFragmentSprite(fragmentData.id);
      if (sprite && fragmentData.state === FragmentState.UNCOLLECTED) {
        this.physics.add.overlap(
          this.player.sprite,
          sprite.sprite,
          () => this.collectFragment(fragmentData.id),
          undefined,
          this
        );
      }
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

  private collectFragment(fragmentId: number): void {
    if (this.mapFragmentSystem.collectFragment(fragmentId)) {
      // Save collected fragment to run state
      saveManager.collectFragment(fragmentId);
      
      this.emitGameState();

      // Check if all fragments collected
      if (this.mapFragmentSystem.areAllFragmentsCollected()) {
        this.treasure.unlock();
      }
    }
  }

  private purchaseFragment(): void {
    if (!this.merchant || !this.merchant.isPlayerInRange()) {
      return;
    }

    const merchantFragments = this.mapFragmentSystem.getMerchantFragments();
    if (merchantFragments.length === 0) {
      return;
    }

    const fragment = merchantFragments[0];
    if (fragment.state !== FragmentState.AVAILABLE_FOR_PURCHASE) {
      return;
    }

    const cost = fragment.cost ?? 100;
    if (!this.currencySystem.canAfford(cost)) {
      // Show "not enough gold" message
      const text = this.add.text(
        this.merchant.sprite.x,
        this.merchant.sprite.y - 50,
        'Not enough gold!',
        {
          fontSize: '14px',
          color: '#ff0000',
          backgroundColor: '#000000',
          padding: { x: 5, y: 3 },
        }
      );
      text.setOrigin(0.5);
      this.tweens.add({
        targets: text,
        y: text.y - 20,
        alpha: 0,
        duration: 1500,
        onComplete: () => text.destroy(),
      });
      return;
    }

    // Purchase the fragment
    const result = this.mapFragmentSystem.purchaseFragment(fragment.id);
    if (result.success) {
      // Remove gold from both systems
      this.currencySystem.removeGold(result.cost);
      saveManager.removeGold(result.cost);
      saveManager.collectFragment(fragment.id);
      
      this.emitGameState();

      // Show purchase confirmation
      const text = this.add.text(
        this.merchant.sprite.x,
        this.merchant.sprite.y - 50,
        `Fragment purchased! (-${result.cost} gold)`,
        {
          fontSize: '14px',
          color: '#00ff00',
          backgroundColor: '#000000',
          padding: { x: 5, y: 3 },
        }
      );
      text.setOrigin(0.5);
      this.tweens.add({
        targets: text,
        y: text.y - 20,
        alpha: 0,
        duration: 1500,
        onComplete: () => text.destroy(),
      });

      // Check if all fragments collected
      if (this.mapFragmentSystem.areAllFragmentsCollected()) {
        this.treasure.unlock();
      }
    }
  }

  private collectTreasure(): void {
    if (!this.treasure.isLocked()) {
      // Win! Lazy-load GameOverScene before transitioning
      const fragmentsCollected = this.mapFragmentSystem.getCollectedCount();
      this.progressManager.recordGameWon(fragmentsCollected);
      this.scene.stop('UIScene');
      
      // Ensure GameOverScene is loaded before starting it
      if (window.sceneManager) {
        window.sceneManager.loadScene('GameOverScene').then(() => {
          this.scene.start('GameOverScene', { won: true, fragments: fragmentsCollected });
        });
      } else {
        this.scene.start('GameOverScene', { won: true, fragments: fragmentsCollected });
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
        const fragmentsCollected = this.mapFragmentSystem.getCollectedCount();
        this.progressManager.recordGameLost(fragmentsCollected);
        this.scene.stop('UIScene');
        
        // Ensure GameOverScene is loaded before starting it
        if (window.sceneManager) {
          window.sceneManager.loadScene('GameOverScene').then(() => {
            this.scene.start('GameOverScene', {
              won: false,
              fragments: fragmentsCollected,
            });
          });
        } else {
          this.scene.start('GameOverScene', {
            won: false,
            fragments: fragmentsCollected,
          });
        }
      }
    }
  }

  private emitGameState(): void {
    this.events.emit('updateUI', {
      health: this.player.health,
      fragments: this.mapFragmentSystem.getCollectedCount(),
      fragmentsRequired: this.mapFragmentSystem.getTotalFragments(),
      gold: this.currencySystem.getGold(),
      fragmentData: this.mapFragmentSystem.getFragments(),
    });
  }

  override update(_time: number, delta: number): void {
    // Update player
    this.player.update(this.cursors);

    // Update merchant if exists
    if (this.merchant) {
      const playerPos = this.player.getPosition();
      this.merchant.update(playerPos.x, playerPos.y);

      // Handle interact key
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.purchaseFragment();
      }
    }

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
