import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';
import { InputController } from '../input/InputController';

export class Player {
  public sprite: Phaser.GameObjects.Image;
  public health: number = 100;
  private targetX: number | null = null;
  private targetY: number | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add
      .image(x, y, 'player-ship-tile')
      .setDisplaySize(GameConfig.tileSize, GameConfig.tileSize)
      .setDepth(10);
    // Enable tap/click on player (used to toggle tools like the shovel)
    this.sprite.setInteractive();
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(GameConfig.playerSize * 1.8, GameConfig.playerSize * 1.8, true);
  }

  setShovelMode(enabled: boolean): void {
    this.sprite.setTexture(enabled ? 'player-shovel-tile' : 'player-ship-tile');
  }

  /**
   * Moves the player sprite based on the provided InputController.
   *
   * The update loop depends ONLY on input.getHorizontal() / input.getVertical()
   * so that keyboard and virtual joystick share this path without modification.
   * Tap-to-move (setTarget) remains available as a fallback for pointer taps
   * that are not captured by the joystick.
   */
  update(input: InputController): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(0);

    const h = input.getHorizontal();
    const v = input.getVertical();

    if (input.isActive()) {
      // Directional input is present – clear any tap-to-move target.
      this.targetX = null;
      this.targetY = null;
      body.setVelocityX(h * GameConfig.playerSpeed);
      body.setVelocityY(v * GameConfig.playerSpeed);
    }

    // Touch/Mouse tap-to-move (used when no directional input is active).
    if (this.targetX !== null && this.targetY !== null && !input.isActive()) {
      const distance = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        this.targetX,
        this.targetY
      );

      // Stop when close enough to the target.
      if (distance < 10) {
        this.targetX = null;
        this.targetY = null;
        body.setVelocity(0);
      } else {
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

    // Normalize diagonal movement to maintain consistent speed.
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
