import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';

export class Player {
  public sprite: Phaser.GameObjects.Arc;
  public health: number = 100;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.circle(x, y, GameConfig.playerSize, GameConfig.playerColor);
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(0);

    if (cursors.left.isDown) {
      body.setVelocityX(-GameConfig.playerSpeed);
    } else if (cursors.right.isDown) {
      body.setVelocityX(GameConfig.playerSpeed);
    }

    if (cursors.up.isDown) {
      body.setVelocityY(-GameConfig.playerSpeed);
    } else if (cursors.down.isDown) {
      body.setVelocityY(GameConfig.playerSpeed);
    }

    // Normalize diagonal movement
    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(GameConfig.playerSpeed);
    }
  }

  takeDamage(amount: number): void {
    this.health -= amount;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
