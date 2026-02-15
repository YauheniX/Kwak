import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // This scene just boots up the game
    // In a real game, you might load a loading bar graphic here
  }

  create(): void {
    // Move to preload scene
    this.scene.start('PreloadScene');
  }
}
