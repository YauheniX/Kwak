import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Treasure, TreasureChest } from '../entities/Collectible';
import { RoomGenerator } from '../systems/roomGenerator';
import { EnemySpawner } from '../systems/enemySpawner';
import { MapFragmentSystem, FragmentState, FragmentLocationType } from '../systems/mapFragment';
import { CurrencySystem } from '../systems/currency';
import { DigSystem } from '../systems/digSystem';
import { Merchant } from '../entities/Merchant';
import { GameConfig } from '../config/gameConfig';
import { ProgressManager } from '../utils/progressManager';
import { saveManager } from '../core/saveManager';
import { VisualStyle } from '../config/visualStyle';
import { progressionSystem } from '../systems/progressionSystem';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private treasure!: Treasure;
  private treasureChest?: TreasureChest;
  private roomGenerator!: RoomGenerator;
  private enemySpawner!: EnemySpawner;
  private mapFragmentSystem!: MapFragmentSystem;
  private currencySystem!: CurrencySystem;
  private digSystem!: DigSystem;
  private merchant?: Merchant;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private digKeyAlt!: Phaser.Input.Keyboard.Key;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private progressManager: ProgressManager;
  private wallGraphics!: Phaser.GameObjects.Graphics;
  private wallBodies?: Phaser.Physics.Arcade.StaticGroup;
  private lastHitTime: number = 0;
  private hitCooldown: number = 2000; // 2 second cooldown between hits
  private lastAttackTime: number = 0;
  private attackCooldown: number = 300;
  private attackDamage: number = 25;
  private attackRange: number = 80;
  private digHoldTimer?: Phaser.Time.TimerEvent;
  private digHoldPointerId: number | null = null;
  private digHoldStartX: number = 0;
  private digHoldStartY: number = 0;
  private digHoldThresholdMs: number = 450;
  private digHoldMoveTolerance: number = 18;
  private digHoldIndicator?: Phaser.GameObjects.Graphics;
  private digHoldStartTime: number = 0;
  private digHoldFillDelayMs: number = 300;
  private shovelMode: boolean = false;
  private collisionsEnabled: boolean = false;
  private currentLevel: number = 1;

  constructor() {
    super({ key: 'GameScene' });
    this.progressManager = new ProgressManager();
  }

  create(): void {
    try {
      // Ensure UI scene is running (e.g. when starting GameScene directly / after restarts)
      if (!this.scene.isActive('UIScene')) {
        this.scene.launch('UIScene');
      }
      this.scene.bringToTop('UIScene');

      // Get current dungeon level from progression system
      this.currentLevel = progressionSystem.getCurrentLevel();
      
      // Reset run state for a new run
      saveManager.resetRun();
      
      // Generate dungeon with graph-based procedural generation
      // More complex labyrinth: more rooms + more loops
      this.roomGenerator = new RoomGenerator({
        roomCount: GameConfig.maxRooms * 2,
        loopEdgePercentage: 40,
        mapWidth: 120,
        mapHeight: 120,
      });
      const dungeon = this.roomGenerator.generateDungeon();

      // Setup camera/world bounds based on dungeon size
      const worldSize = this.roomGenerator.getWorldSizePixels();
      this.setupCamera(worldSize.width, worldSize.height);

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

      // Default tool state: combat
      this.setShovelMode(false);

      // Camera follows the player through the dungeon
      this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
      this.cameras.main.setRoundPixels(true);

      // Physics: collide player with walls
      if (this.wallBodies) {
        this.physics.add.collider(this.player.sprite, this.wallBodies);
      }

      // Initialize enemy spawner system with level-based configuration
      this.enemySpawner = new EnemySpawner(this, this.roomGenerator, {
        dungeonLevel: this.currentLevel,
      });

      // Spawn enemies using the modular system
      this.enemies = this.enemySpawner.spawnEnemies(
        dungeon.rooms,
        playerPos,
        dungeon.spawnRoomId
      );

      // Physics: collide enemies with walls
      if (this.wallBodies) {
        for (const enemy of this.enemies) {
          this.physics.add.collider(enemy.sprite, this.wallBodies);
        }
      }

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

      // Initialize dig system
      this.digSystem = new DigSystem(this);

      // Generate treasure location for digging
      const treasureTile = this.digSystem.generateTreasureLocation(
        dungeon.rooms,
        playerPos,
        (tileX: number, tileY: number) => this.roomGenerator.isWall(tileX, tileY)
      );

      // Save treasure tile to run state
      saveManager.updateRunState({
        treasureTile: treasureTile,
      });

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
      this.digKeyAlt = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);

      // Pointer/touch:
      // - tap enemy => attack
      // - tap merchant => interact (or walk to merchant if too far)
      // - long-press ground => dig
      // - tap ground => move
      this.input.on(
        'pointerdown',
        (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
          if (!this.player || !this.scene.isActive('GameScene')) {
            return;
          }

          // Tap on the player toggles shovel/combat mode
          if (currentlyOver && currentlyOver.includes(this.player.sprite)) {
            this.setShovelMode(!this.shovelMode);
            return;
          }

          // If pressed on an enemy, attack instead of moving
          if (currentlyOver && currentlyOver.length > 0) {
            const overEnemy = this.enemies.find(
              (e) => e && !e.isDead() && currentlyOver.includes(e.sprite)
            );
            if (overEnemy) {
              // In shovel mode we don't attack
              if (!this.shovelMode) {
                this.tryAttackEnemy(overEnemy);
                return;
              }
            }

            // If pressed on the merchant, interact (or walk closer)
            if (this.merchant && currentlyOver.includes(this.merchant.sprite)) {
              if (this.merchant.isPlayerInRange()) {
                this.purchaseFragment();
              } else {
                const pos = this.merchant.getPosition();
                this.player.setTarget(pos.x, pos.y);
              }
              return;
            }
          }

          // Start long-press dig timer (ground only)
          this.cancelDigHold();
          this.digHoldPointerId = pointer.id;
          this.digHoldStartX = pointer.worldX;
          this.digHoldStartY = pointer.worldY;
          this.digHoldStartTime = this.time.now;
          this.startDigHoldIndicator(pointer.worldX, pointer.worldY);
          this.digHoldTimer = this.time.delayedCall(this.digHoldThresholdMs, () => {
            // Only dig if the same pointer is still down and hasn't moved much
            if (!pointer.isDown || this.digHoldPointerId !== pointer.id) {
              return;
            }
            const moved = Phaser.Math.Distance.Between(
              this.digHoldStartX,
              this.digHoldStartY,
              pointer.worldX,
              pointer.worldY
            );
            if (moved <= this.digHoldMoveTolerance) {
              this.playDigHoldCompleteAnimation();
              this.handleDig();
            }
          });

          this.player.setTarget(pointer.worldX, pointer.worldY);
        }
      );

      this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.digHoldPointerId === pointer.id) {
          this.cancelDigHold();
        }
      });

      this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (this.digHoldPointerId !== pointer.id || !pointer.isDown) {
          return;
        }
        const moved = Phaser.Math.Distance.Between(
          this.digHoldStartX,
          this.digHoldStartY,
          pointer.worldX,
          pointer.worldY
        );
        if (moved > this.digHoldMoveTolerance) {
          this.cancelDigHold();
        }
      });

      // Setup collisions
      this.setupCollisions();

      // Give player initial invulnerability
      this.lastHitTime = this.time.now;
      this.lastAttackTime = this.time.now;

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

  /**
   * Setup camera with proper bounds for responsive scaling
   */
  private setupCamera(worldWidth: number, worldHeight: number): void {
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  }

  private drawWalls(): void {
    if (this.wallGraphics) {
      this.wallGraphics.destroy();
    }

    this.wallGraphics = this.add.graphics();
    this.wallGraphics.fillStyle(VisualStyle.ColorNumbers.wallColor, 1);

    // Clear previous wall colliders
    if (this.wallBodies) {
      this.wallBodies.clear(true, true);
    }
    this.wallBodies = this.physics.add.staticGroup();

    const { tileSize } = GameConfig;
    const { width: mapWidth, height: mapHeight } = this.roomGenerator.getMapSizeTiles();

    // Render + build physics for every wall tile so visuals match collisions
    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        if (!this.roomGenerator.isWall(x, y)) {
          continue;
        }

        this.wallGraphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

        const wallRect = this.add.rectangle(
          x * tileSize + tileSize / 2,
          y * tileSize + tileSize / 2,
          tileSize,
          tileSize,
          0x000000,
          0
        );

        this.physics.add.existing(wallRect, true);
        this.wallBodies.add(wallRect);
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
        // Reveal treasure location for digging
        this.digSystem.revealTreasureLocation();
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
      const currencyRemoved = this.currencySystem.removeGold(result.cost);
      const saveRemoved = saveManager.removeGold(result.cost);
      
      // Ensure both systems are in sync
      if (!currencyRemoved || !saveRemoved) {
        console.error('Currency system out of sync!');
        return;
      }
      
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
        // Reveal treasure location for digging
        this.digSystem.revealTreasureLocation();
      }
    }
  }

  /**
   * Handle dig attempt
   */
  private handleDig(): void {
    const playerPos = this.player.getPosition();
    const digResult = this.digSystem.dig(playerPos, this.player.health > 0);

    if (!digResult) {
      // Dig was prevented (cooldown, already spawned, or player dead)
      return;
    }

    if (digResult.success && digResult.treasureSpawned) {
      // Success! Spawn treasure chest
      this.treasureChest = new TreasureChest(this, digResult.position.x, digResult.position.y);

      // Setup collision with treasure chest
      this.physics.add.overlap(
        this.player.sprite,
        this.treasureChest.sprite,
        () => this.collectTreasureChest(),
        undefined,
        this
      );

      // Show success message
      const text = this.add.text(
        digResult.position.x,
        digResult.position.y - 50,
        'Treasure Found!',
        {
          fontSize: '18px',
          color: '#ffd700',
          backgroundColor: '#000000',
          padding: { x: 8, y: 5 },
        }
      );
      text.setOrigin(0.5);
      this.tweens.add({
        targets: text,
        y: text.y - 30,
        alpha: 0,
        duration: 2000,
        onComplete: () => text.destroy(),
      });
    } else {
      // Wrong location - apply damage and show feedback
      this.player.takeDamage(digResult.damageTaken);
      this.emitGameState();

      // Red screen flash
      const flash = this.add.rectangle(
        this.cameras.main.scrollX + this.cameras.main.width / 2,
        this.cameras.main.scrollY + this.cameras.main.height / 2,
        this.cameras.main.width,
        this.cameras.main.height,
        0xff0000,
        0.3
      );
      flash.setScrollFactor(0);
      flash.setDepth(1000);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 300,
        onComplete: () => flash.destroy(),
      });

      // Damage popup
      const damageText = this.add.text(
        digResult.position.x,
        digResult.position.y - 30,
        `-${digResult.damageTaken}`,
        {
          fontSize: '20px',
          color: '#ff0000',
          fontStyle: 'bold',
        }
      );
      damageText.setOrigin(0.5);
      this.tweens.add({
        targets: damageText,
        y: damageText.y - 40,
        alpha: 0,
        duration: 1000,
        onComplete: () => damageText.destroy(),
      });

      // Screen shake effect
      this.cameras.main.shake(200, 0.005);

      // Check if player died from dig damage
      if (this.player.health <= 0) {
        const fragmentsCollected = this.mapFragmentSystem.getCollectedCount();
        this.progressManager.recordGameLost(fragmentsCollected);
        progressionSystem.recordLoss();
        this.scene.stop('UIScene');

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

  /**
   * Collect treasure chest (spawned from digging)
   */
  private collectTreasureChest(): void {
    if (this.treasureChest && !this.treasureChest.isCollected()) {
      this.treasureChest.collect();

      // Win! Record progression and advance level
      const fragmentsCollected = this.mapFragmentSystem.getCollectedCount();
      this.progressManager.recordGameWon(fragmentsCollected);
      progressionSystem.recordWin();
      this.scene.stop('UIScene');

      if (window.sceneManager) {
        window.sceneManager.loadScene('GameOverScene').then(() => {
          this.scene.start('GameOverScene', { won: true, fragments: fragmentsCollected });
        });
      } else {
        this.scene.start('GameOverScene', { won: true, fragments: fragmentsCollected });
      }
    }
  }

  private collectTreasure(): void {
    if (!this.treasure.isLocked()) {
      // Win! Record progression and advance level
      const fragmentsCollected = this.mapFragmentSystem.getCollectedCount();
      this.progressManager.recordGameWon(fragmentsCollected);
      progressionSystem.recordWin();
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
        // Game over - record loss and reset level
        const fragmentsCollected = this.mapFragmentSystem.getCollectedCount();
        this.progressManager.recordGameLost(fragmentsCollected);
        progressionSystem.recordLoss();
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

  private tryAttackEnemy(enemy: Enemy): void {
    if (this.shovelMode) return;
    if (!enemy || enemy.isDead()) return;

    const currentTime = this.time.now;
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return;
    }

    // Range check
    const distance = Phaser.Math.Distance.Between(
      this.player.sprite.x,
      this.player.sprite.y,
      enemy.sprite.x,
      enemy.sprite.y
    );
    if (distance > this.attackRange) {
      return;
    }

    this.lastAttackTime = currentTime;
    const killed = enemy.takeDamage(this.attackDamage);
    if (killed) {
      this.cleanupDeadEnemies();
    }
  }

  private tryAttackNearestEnemy(): void {
    if (this.shovelMode) return;
    if (!this.enemies.length) return;

    let nearest: Enemy | undefined;
    let nearestDistance = Infinity;

    for (const enemy of this.enemies) {
      if (!enemy || enemy.isDead()) continue;
      const distance = Phaser.Math.Distance.Between(
        this.player.sprite.x,
        this.player.sprite.y,
        enemy.sprite.x,
        enemy.sprite.y
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = enemy;
      }
    }

    if (nearest && nearestDistance <= this.attackRange) {
      this.tryAttackEnemy(nearest);
    }
  }

  private cleanupDeadEnemies(): void {
    this.enemies = this.enemies.filter((e) => e && !e.isDead());
  }

  private setShovelMode(enabled: boolean): void {
    this.shovelMode = enabled;
    // Visual feedback: change player color while holding the shovel
    const color = enabled ? VisualStyle.ColorNumbers.treasureGold : GameConfig.playerColor;
    this.player.sprite.setFillStyle(color, 1);
  }

  private cancelDigHold(): void {
    this.digHoldPointerId = null;
    this.digHoldStartTime = 0;
    if (this.digHoldTimer) {
      this.digHoldTimer.remove(false);
      this.digHoldTimer = undefined;
    }

    if (this.digHoldIndicator) {
      this.digHoldIndicator.destroy();
      this.digHoldIndicator = undefined;
    }
  }

  private startDigHoldIndicator(x: number, y: number): void {
    if (this.digHoldIndicator) {
      this.digHoldIndicator.destroy();
    }

    this.digHoldIndicator = this.add.graphics();
    this.digHoldIndicator.setDepth(999);
    this.digHoldIndicator.setAlpha(0.9);

    // Draw once immediately (progress will be updated each frame)
    this.drawDigHoldIndicator(x, y, 0);
  }

  private drawDigHoldIndicator(x: number, y: number, progress01: number): void {
    if (!this.digHoldIndicator) return;

    const radius = 22;
    const thickness = 3;

    this.digHoldIndicator.clear();

    // Background ring
    this.digHoldIndicator.lineStyle(thickness, VisualStyle.ColorNumbers.darkWoodBrown, 0.6);
    this.digHoldIndicator.strokeCircle(x, y, radius);

    // Progress arc
    const clamped = Phaser.Math.Clamp(progress01, 0, 1);
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * clamped;
    this.digHoldIndicator.lineStyle(thickness, VisualStyle.ColorNumbers.treasureGold, 1);
    this.digHoldIndicator.beginPath();
    this.digHoldIndicator.arc(x, y, radius, startAngle, endAngle, false);
    this.digHoldIndicator.strokePath();
  }

  private playDigHoldCompleteAnimation(): void {
    if (!this.digHoldIndicator) return;

    // Quick pulse + fade out
    this.tweens.add({
      targets: this.digHoldIndicator,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.digHoldIndicator?.destroy();
        this.digHoldIndicator = undefined;
      },
    });
  }

  private emitGameState(): void {
    this.events.emit('updateUI', {
      health: this.player.health,
      fragments: this.mapFragmentSystem.getCollectedCount(),
      fragmentsRequired: this.mapFragmentSystem.getTotalFragments(),
      gold: this.currencySystem.getGold(),
      level: this.currentLevel,
      fragmentData: this.mapFragmentSystem.getFragments(),
    });
  }

  override update(_time: number, delta: number): void {
    // Update player
    this.player.update(this.cursors);

    // Get player position once for this update cycle
    const playerPos = this.player.getPosition();

    // Update dig-hold indicator progress (touch UX)
    if (this.digHoldPointerId !== null && this.digHoldIndicator) {
      const elapsed = this.time.now - this.digHoldStartTime;
      const fillDuration = Math.max(1, this.digHoldThresholdMs - this.digHoldFillDelayMs);
      const progress = elapsed < this.digHoldFillDelayMs ? 0 : (elapsed - this.digHoldFillDelayMs) / fillDuration;
      this.drawDigHoldIndicator(this.digHoldStartX, this.digHoldStartY, progress);
    }

    // Handle E key and Space key
    const nearMerchant = this.merchant && this.merchant.isPlayerInRange();
    
    // E key: merchant interaction when near, digging when not
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      if (nearMerchant) {
        this.purchaseFragment();
      } else {
        this.handleDig();
      }
    }
    
    // Space key: always dig (no merchant interaction)
    if (Phaser.Input.Keyboard.JustDown(this.digKeyAlt)) {
      this.handleDig();
    }

    // F key: attack nearest enemy in range
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.tryAttackNearestEnemy();
    }

    // Update merchant if exists
    if (this.merchant) {
      this.merchant.update(playerPos.x, playerPos.y);
    }

    // Update enemies
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

        // Contact combat: enemy hurts player; player can also damage enemy on contact
        if (distance < GameConfig.playerSize + GameConfig.enemySize) {
          this.hitEnemy();
          if (!this.shovelMode) {
            this.tryAttackEnemy(enemy);
          }
        }
      }
    });

    // Remove killed enemies from list
    this.cleanupDeadEnemies();
  }
}
