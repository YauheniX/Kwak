import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';

export class Fragment {
  public sprite: Phaser.GameObjects.Arc;
  public collected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.circle(
      x,
      y,
      GameConfig.fragmentSize,
      GameConfig.fragmentColor
    );
    scene.physics.add.existing(this.sprite, true); // true = static body
  }

  collect(): void {
    this.collected = true;
    this.sprite.destroy();
  }

  destroy(): void {
    if (!this.collected) {
      this.sprite.destroy();
    }
  }
}

export class Treasure {
  public sprite: Phaser.GameObjects.Arc;
  private locked: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.circle(
      x,
      y,
      GameConfig.treasureSize,
      GameConfig.treasureColor
    );
    scene.physics.add.existing(this.sprite, true);
    this.sprite.setAlpha(0.3); // Visually show it's locked
  }

  unlock(): void {
    this.locked = false;
    this.sprite.setAlpha(1.0); // Show it's unlocked
  }

  isLocked(): boolean {
    return this.locked;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
