import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { RoomGenerator, Room } from './roomGenerator';
import { GameConfig } from '../config/gameConfig';
import { getRandomEnemyType, getMaxEnemiesPerRoom } from '../config/enemyBalance';

/**
 * Configuration for enemy spawning
 */
export interface EnemySpawnConfig {
  minDistanceFromPlayer?: number; // Minimum distance from player spawn
  maxEnemiesPerRoom?: number; // Maximum enemies per room
  spawnChance?: number; // Probability of spawning enemies (0-1)
  minEnemySpacing?: number; // Minimum spacing between enemies
  dungeonLevel?: number; // Current dungeon level for scaling
}

/**
 * Enemy type definition for extensibility
 */
export interface EnemyType {
  createEnemy: (scene: Phaser.Scene, x: number, y: number, level: number) => Enemy;
  weight?: number; // Spawn weight for random selection (default: 1)
}

/**
 * Enemy spawner system
 * Handles configurable enemy spawning with support for multiple enemy types
 */
export class EnemySpawner {
  private scene: Phaser.Scene;
  private roomGenerator: RoomGenerator;
  private config: Required<EnemySpawnConfig>;
  private enemyTypes: Map<string, EnemyType> = new Map();

  constructor(
    scene: Phaser.Scene,
    roomGenerator: RoomGenerator,
    config: EnemySpawnConfig = {}
  ) {
    this.scene = scene;
    this.roomGenerator = roomGenerator;

    // Initialize config with defaults from GameConfig
    this.config = {
      minDistanceFromPlayer: config.minDistanceFromPlayer ?? GameConfig.enemySpawn.minDistanceFromPlayer,
      maxEnemiesPerRoom: config.maxEnemiesPerRoom ?? GameConfig.enemySpawn.maxEnemiesPerRoom,
      spawnChance: config.spawnChance ?? GameConfig.enemySpawn.spawnChance,
      minEnemySpacing: config.minEnemySpacing ?? GameConfig.enemySpawn.minEnemySpacing,
      dungeonLevel: config.dungeonLevel ?? 1,
    };

    // Register default enemy type - uses level-based random type selection
    this.registerEnemyType('default', {
      createEnemy: (scene: Phaser.Scene, x: number, y: number, level: number) => {
        const enemyType = getRandomEnemyType(level);
        return new Enemy(scene, x, y, enemyType, level);
      },
      weight: 1,
    });
  }

  /**
   * Register a new enemy type
   * This allows easy addition of new enemy types
   */
  registerEnemyType(name: string, enemyType: EnemyType): void {
    this.enemyTypes.set(name, enemyType);
  }

  /**
   * Spawn enemies across all rooms in the dungeon
   */
  spawnEnemies(
    rooms: Room[],
    playerSpawnPosition: { x: number; y: number },
    spawnRoomId: number
  ): Enemy[] {
    const enemies: Enemy[] = [];

    for (const room of rooms) {
      // Skip spawn room to give player breathing room
      if (room.id === spawnRoomId) {
        continue;
      }

      // Check spawn chance
      if (Math.random() > this.config.spawnChance) {
        continue;
      }

      // Spawn enemies in this room
      const roomEnemies = this.spawnEnemiesInRoom(room, playerSpawnPosition);
      enemies.push(...roomEnemies);
    }

    return enemies;
  }

  /**
   * Spawn enemies in a specific room
   */
  private spawnEnemiesInRoom(
    room: Room,
    playerSpawnPosition: { x: number; y: number }
  ): Enemy[] {
    const enemies: Enemy[] = [];

    // Determine number of enemies based on room depth and configuration
    const enemyCount = this.calculateEnemyCount(room);

    // Get valid spawn positions
    const positions = this.roomGenerator.getMultiplePositionsInRoom(
      room,
      enemyCount,
      this.config.minEnemySpacing
    );

    // Create enemies at valid positions
    for (const position of positions) {
      // Check minimum distance from player spawn
      const distanceToPlayer = Phaser.Math.Distance.Between(
        playerSpawnPosition.x,
        playerSpawnPosition.y,
        position.x,
        position.y
      );

      if (distanceToPlayer >= this.config.minDistanceFromPlayer) {
        const enemy = this.createRandomEnemy(position.x, position.y);
        enemies.push(enemy);
      }
    }

    return enemies;
  }

  /**
   * Calculate number of enemies to spawn in a room based on depth
   * Returns 0-maxEnemiesPerRoom based on randomization and depth
   */
  private calculateEnemyCount(room: Room): number {
    // Use level-based max enemies per room
    const levelBasedMax = getMaxEnemiesPerRoom(this.config.dungeonLevel);
    const maxCount = Math.min(this.config.maxEnemiesPerRoom, levelBasedMax);
    
    // Random count from 0 to maxCount
    let count = Math.floor(Math.random() * (maxCount + 1));

    // Scale with room depth (higher depth = more likely to have max enemies)
    if (room.depth > 2 && count > 0) {
      count = Math.min(maxCount, count + 1);
    }

    return count;
  }

  /**
   * Create a random enemy based on registered types and their weights
   */
  private createRandomEnemy(x: number, y: number): Enemy {
    // Calculate total weight
    let totalWeight = 0;
    const types: Array<{ name: string; type: EnemyType }> = [];

    for (const [name, type] of this.enemyTypes) {
      const weight = type.weight ?? 1;
      totalWeight += weight;
      types.push({ name, type });
    }

    // Select random type based on weight
    let random = Math.random() * totalWeight;
    for (const { type } of types) {
      const weight = type.weight ?? 1;
      random -= weight;
      if (random <= 0) {
        return type.createEnemy(this.scene, x, y, this.config.dungeonLevel);
      }
    }

    // Fallback to first type
    return types[0].type.createEnemy(this.scene, x, y, this.config.dungeonLevel);
  }

  /**
   * Get current spawn configuration
   */
  getConfig(): Required<EnemySpawnConfig> {
    return { ...this.config };
  }

  /**
   * Update spawn configuration
   */
  updateConfig(config: Partial<EnemySpawnConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
