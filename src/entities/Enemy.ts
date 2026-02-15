import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';

/**
 * Enemy AI configuration
 */
export interface EnemyAIConfig {
  chaseDistance?: number; // Distance at which enemy chases player
  patrolMoveDelay?: number; // Delay between patrol moves
  patrolRange?: number; // Range for random patrol movement
  speed?: number; // Movement speed
}

export class Enemy {
  public sprite: Phaser.GameObjects.Arc;
  private targetX: number;
  private targetY: number;
  private moveTimer: number = 0;
  private config: Required<EnemyAIConfig>;

  constructor(scene: Phaser.Scene, x: number, y: number, aiConfig: EnemyAIConfig = {}) {
    this.sprite = scene.add.circle(x, y, GameConfig.enemySize, GameConfig.enemyColor);
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    this.targetX = x;
    this.targetY = y;

    // Initialize AI config with defaults from GameConfig
    this.config = {
      chaseDistance: aiConfig.chaseDistance ?? GameConfig.enemyAI.chaseDistance,
      patrolMoveDelay: aiConfig.patrolMoveDelay ?? GameConfig.enemyAI.patrolMoveDelay,
      patrolRange: aiConfig.patrolRange ?? GameConfig.enemyAI.patrolRange,
      speed: aiConfig.speed ?? GameConfig.enemySpeed,
    };
  }

  update(delta: number, playerPos: { x: number; y: number }): void {
    this.moveTimer += delta;

    if (this.moveTimer >= this.config.patrolMoveDelay) {
      this.moveTimer = 0;
      this.updateTarget(playerPos);
    }

    this.moveTowardsTarget();
  }

  private updateTarget(playerPos: { x: number; y: number }): void {
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      playerPos.x,
      playerPos.y
    );

    // Simple AI: move towards player if close enough (chase behavior)
    if (distance < this.config.chaseDistance) {
      this.targetX = playerPos.x;
      this.targetY = playerPos.y;
    } else {
      // Random patrol behavior when player is far
      this.targetX = this.sprite.x + (Math.random() - 0.5) * this.config.patrolRange;
      this.targetY = this.sprite.y + (Math.random() - 0.5) * this.config.patrolRange;
    }
  }

  private moveTowardsTarget(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return; // Safety check for body initialization
    
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      this.targetX,
      this.targetY
    );

    body.setVelocity(
      Math.cos(angle) * this.config.speed,
      Math.sin(angle) * this.config.speed
    );
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
