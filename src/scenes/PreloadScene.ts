import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Create loading text
    const { width, height } = this.cameras.main;
    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5);

    // Since we're using shapes, there's nothing to actually preload
    // But this scene demonstrates the structure
  }

  create(): void {
    // Move to menu
    this.scene.start('MenuScene');
  }
}
