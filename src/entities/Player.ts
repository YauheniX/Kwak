import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';

export class Player {
  public sprite: Phaser.GameObjects.Arc;
  public health: number = 1000; // Much higher health for easier gameplay
  private targetX: number | null = null;
  private targetY: number | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.circle(x, y, GameConfig.playerSize, GameConfig.playerColor);
    // Enable tap/click on player (used to toggle tools like the shovel)
    this.sprite.setInteractive();
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(0);

    // Keyboard controls
    let keyboardActive = false;
    if (cursors.left.isDown) {
      body.setVelocityX(-GameConfig.playerSpeed);
      keyboardActive = true;
    } else if (cursors.right.isDown) {
      body.setVelocityX(GameConfig.playerSpeed);
      keyboardActive = true;
    }

    if (cursors.up.isDown) {
      body.setVelocityY(-GameConfig.playerSpeed);
      keyboardActive = true;
    } else if (cursors.down.isDown) {
      body.setVelocityY(GameConfig.playerSpeed);
      keyboardActive = true;
    }

    // If keyboard is active, clear touch target
    if (keyboardActive) {
      this.targetX = null;
      this.targetY = null;
    }

    // Touch/Mouse movement
    if (this.targetX !== null && this.targetY !== null && !keyboardActive) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        this.targetX,
        this.targetY
      );

      // If close enough to target, stop moving
      if (distance < 10) {
        this.targetX = null;
        this.targetY = null;
        body.setVelocity(0);
      } else {
        // Move towards target
        const angle = Phaser.Math.Angle.Between(
          this.sprite.x,
          this.sprite.y,
          this.targetX,
          this.targetY
        );
        body.setVelocity(
          Math.cos(angle) * GameConfig.playerSpeed,
          Math.sin(angle) * GameConfig.playerSpeed
        );
      }
    }

    // Normalize diagonal movement
    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(GameConfig.playerSpeed);
    }
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
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
