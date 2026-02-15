import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';

export class Enemy {
  public sprite: Phaser.GameObjects.Arc;
  private targetX: number;
  private targetY: number;
  private moveTimer: number = 0;
  private moveDelay: number = 1000; // 1 second between moves

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.circle(x, y, GameConfig.enemySize, GameConfig.enemyColor);
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    this.targetX = x;
    this.targetY = y;
  }

  update(delta: number, playerPos: { x: number; y: number }): void {
    this.moveTimer += delta;

    if (this.moveTimer >= this.moveDelay) {
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

    // Simple AI: move towards player if close enough (within 300 pixels)
    if (distance < 300) {
      this.targetX = playerPos.x;
      this.targetY = playerPos.y;
    } else {
      // Random wandering
      this.targetX = this.sprite.x + (Math.random() - 0.5) * 100;
      this.targetY = this.sprite.y + (Math.random() - 0.5) * 100;
    }
  }

  private moveTowardsTarget(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      this.targetX,
      this.targetY
    );

    body.setVelocity(
      Math.cos(angle) * GameConfig.enemySpeed,
      Math.sin(angle) * GameConfig.enemySpeed
    );
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
