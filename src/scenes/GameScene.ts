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

  constructor() {
    super({ key: 'GameScene' });
    this.progressManager = new ProgressManager();
  }

  create(): void {
    // Generate rooms
    this.roomGenerator = new RoomGenerator();
    const rooms = this.roomGenerator.generateRooms(GameConfig.maxRooms);

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

    // Create treasure in a random room
    const treasureRoom = rooms[Math.floor(Math.random() * rooms.length)];
    const treasurePos = this.roomGenerator.getRandomPositionInRoom(treasureRoom);
    this.treasure = new Treasure(this, treasurePos.x, treasurePos.y);

    // Create enemies in rooms
    for (const room of rooms) {
      for (let i = 0; i < GameConfig.enemiesPerRoom; i++) {
        const pos = this.roomGenerator.getRandomPositionInRoom(room);
        const enemy = new Enemy(this, pos.x, pos.y);
        this.enemies.push(enemy);
      }
    }

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();

    // Setup collisions
    this.setupCollisions();

    // Emit initial state to UI
    this.emitGameState();
  }

  private drawWalls(): void {
    this.wallGraphics = this.add.graphics();
    this.wallGraphics.fillStyle(0x444444, 1);

    const { tileSize, roomWidth, roomHeight } = GameConfig;
    const rooms = this.roomGenerator.getRooms();

    // Draw room walls
    for (const room of rooms) {
      for (let x = room.x; x < room.x + room.width; x++) {
        for (let y = room.y; y < room.y + room.height; y++) {
          if (this.roomGenerator.isWall(x, y)) {
            this.wallGraphics.fillRect(
              x * tileSize,
              y * tileSize,
              tileSize,
              tileSize
            );
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

    // Player hits enemies
    this.enemies.forEach((enemy) => {
      this.physics.add.overlap(
        this.player.sprite,
        enemy.sprite,
        () => this.hitEnemy(),
        undefined,
        this
      );
    });
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
    this.player.takeDamage(20);
    this.emitGameState();

    if (this.player.health <= 0) {
      // Game over
      this.progressManager.recordGameLost(this.fragmentsCollected);
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { won: false, fragments: this.fragmentsCollected });
    }
  }

  private emitGameState(): void {
    this.events.emit('updateUI', {
      health: this.player.health,
      fragments: this.fragmentsCollected,
      fragmentsRequired: GameConfig.fragmentsRequired,
    });
  }

  update(_time: number, delta: number): void {
    // Update player
    this.player.update(this.cursors);

    // Update enemies
    const playerPos = this.player.getPosition();
    this.enemies.forEach((enemy) => {
      enemy.update(delta, playerPos);
    });
  }
}
