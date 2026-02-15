import Phaser from 'phaser';
import { GameBalance } from '../config/gameBalance';
import { GameConfig } from '../config/gameConfig';
import { Room } from './roomGenerator';

/**
 * Result of a dig attempt
 */
export interface DigResult {
  success: boolean;
  treasureSpawned: boolean;
  damageTaken: number;
  position: { x: number; y: number };
}

/**
 * Treasure tile information
 */
export interface TreasureTile {
  x: number;
  y: number;
  tileX: number;
  tileY: number;
}

/**
 * Dig System Configuration
 */
export interface DigSystemConfig {
  digDamage?: number;
  minDistanceFromSpawn?: number;
  digCooldownMs?: number;
}

/**
 * Dig System
 * Manages treasure location, dig attempts, and related game mechanics
 */
export class DigSystem {
  private scene: Phaser.Scene;
  private treasureTile: TreasureTile | null = null;
  private lastDigTime: number = 0;
  private treasureSpawned: boolean = false;
  private config: Required<DigSystemConfig>;
  private isMapRevealed: boolean = false;
  private visualHint?: Phaser.GameObjects.Graphics;
  private hintTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, config: DigSystemConfig = {}) {
    this.scene = scene;
    this.config = {
      digDamage: config.digDamage ?? GameBalance.DIG_DAMAGE,
      minDistanceFromSpawn: config.minDistanceFromSpawn ?? GameBalance.TREASURE_MIN_DISTANCE_FROM_SPAWN,
      digCooldownMs: config.digCooldownMs ?? GameBalance.DIG_COOLDOWN_MS,
    };
  }

  /**
   * Generate treasure location during dungeon generation
   */
  generateTreasureLocation(
    rooms: Room[],
    spawnPosition: { x: number; y: number },
    wallCheckFn: (tileX: number, tileY: number) => boolean
  ): TreasureTile {
    const { tileSize } = GameConfig;
    const maxAttempts = 100;
    let attempt = 0;

    while (attempt < maxAttempts) {
      // Select a random room (excluding spawn room)
      const nonSpawnRooms = rooms.filter(room => {
        const roomCenterX = (room.x + room.width / 2) * tileSize;
        const roomCenterY = (room.y + room.height / 2) * tileSize;
        const distance = Phaser.Math.Distance.Between(
          spawnPosition.x,
          spawnPosition.y,
          roomCenterX,
          roomCenterY
        );
        return distance > this.config.minDistanceFromSpawn;
      });

      if (nonSpawnRooms.length === 0) {
        // Fallback: use any room
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const tileX = room.x + Math.floor(Math.random() * room.width);
        const tileY = room.y + Math.floor(Math.random() * room.height);

        if (!wallCheckFn(tileX, tileY)) {
          this.treasureTile = {
            x: tileX * tileSize + tileSize / 2,
            y: tileY * tileSize + tileSize / 2,
            tileX,
            tileY,
          };
          return this.treasureTile;
        }
      } else {
        const room = nonSpawnRooms[Math.floor(Math.random() * nonSpawnRooms.length)];
        const tileX = room.x + Math.floor(Math.random() * room.width);
        const tileY = room.y + Math.floor(Math.random() * room.height);

        if (!wallCheckFn(tileX, tileY)) {
          const x = tileX * tileSize + tileSize / 2;
          const y = tileY * tileSize + tileSize / 2;
          const distance = Phaser.Math.Distance.Between(
            spawnPosition.x,
            spawnPosition.y,
            x,
            y
          );

          if (distance >= this.config.minDistanceFromSpawn) {
            this.treasureTile = { x, y, tileX, tileY };
            return this.treasureTile;
          }
        }
      }

      attempt++;
    }

    // Fallback: use center of last room
    const lastRoom = rooms[rooms.length - 1];
    const tileX = lastRoom.x + Math.floor(lastRoom.width / 2);
    const tileY = lastRoom.y + Math.floor(lastRoom.height / 2);
    this.treasureTile = {
      x: tileX * tileSize + tileSize / 2,
      y: tileY * tileSize + tileSize / 2,
      tileX,
      tileY,
    };
    return this.treasureTile;
  }

  /**
   * Reveal the treasure location with visual hint
   */
  revealTreasureLocation(): void {
    if (!this.treasureTile || this.isMapRevealed) {
      return;
    }

    this.isMapRevealed = true;

    // Create subtle visual hint - glowing tile
    this.visualHint = this.scene.add.graphics();
    this.visualHint.setDepth(-1); // Behind most objects
    
    const { tileSize } = GameConfig;
    const alpha = 0.3;
    
    // Draw glowing X mark
    this.visualHint.lineStyle(3, 0xffd700, alpha);
    const padding = 4;
    this.visualHint.beginPath();
    this.visualHint.moveTo(
      this.treasureTile.tileX * tileSize + padding,
      this.treasureTile.tileY * tileSize + padding
    );
    this.visualHint.lineTo(
      (this.treasureTile.tileX + 1) * tileSize - padding,
      (this.treasureTile.tileY + 1) * tileSize - padding
    );
    this.visualHint.moveTo(
      (this.treasureTile.tileX + 1) * tileSize - padding,
      this.treasureTile.tileY * tileSize + padding
    );
    this.visualHint.lineTo(
      this.treasureTile.tileX * tileSize + padding,
      (this.treasureTile.tileY + 1) * tileSize - padding
    );
    this.visualHint.strokePath();

    // Add pulsing animation
    this.hintTween = this.scene.tweens.add({
      targets: this.visualHint,
      alpha: { from: alpha, to: alpha * 2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Attempt to dig at player's current position
   */
  dig(playerPosition: { x: number; y: number }, playerAlive: boolean): DigResult | null {
    const currentTime = this.scene.time.now;

    // Prevent digging if player is dead
    if (!playerAlive) {
      return null;
    }

    // Check cooldown
    if (currentTime - this.lastDigTime < this.config.digCooldownMs) {
      return null;
    }

    // Prevent multiple treasure spawns
    if (this.treasureSpawned) {
      return null;
    }

    this.lastDigTime = currentTime;

    // Get player tile position
    const { tileSize } = GameConfig;
    const playerTileX = Math.floor(playerPosition.x / tileSize);
    const playerTileY = Math.floor(playerPosition.y / tileSize);

    // Check if player is on treasure tile
    const isCorrectLocation = 
      this.treasureTile !== null &&
      playerTileX === this.treasureTile.tileX &&
      playerTileY === this.treasureTile.tileY;

    if (isCorrectLocation) {
      // Success! Mark treasure as spawned
      this.treasureSpawned = true;

      return {
        success: true,
        treasureSpawned: true,
        damageTaken: 0,
        position: { ...playerPosition },
      };
    } else {
      // Wrong location - apply damage
      return {
        success: false,
        treasureSpawned: false,
        damageTaken: this.config.digDamage,
        position: { ...playerPosition },
      };
    }
  }

  /**
   * Get treasure tile location (for debugging or save state)
   */
  getTreasureTile(): TreasureTile | null {
    return this.treasureTile;
  }

  /**
   * Check if treasure has been spawned
   */
  isTreasureSpawned(): boolean {
    return this.treasureSpawned;
  }

  /**
   * Check if map is revealed
   */
  isMapFullyRevealed(): boolean {
    return this.isMapRevealed;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.hintTween) {
      this.hintTween.stop();
      this.hintTween = undefined;
    }
    if (this.visualHint) {
      this.visualHint.destroy();
      this.visualHint = undefined;
    }
  }

  /**
   * Reset the system (for new game)
   */
  reset(): void {
    this.destroy();
    this.treasureTile = null;
    this.lastDigTime = 0;
    this.treasureSpawned = false;
    this.isMapRevealed = false;
  }
}
