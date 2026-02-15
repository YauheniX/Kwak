import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private fragmentText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const { width } = this.cameras.main;

    // Health display
    this.healthText = this.add.text(
      10,
      10,
      'Health: 100',
      {
        fontSize: `${GameConfig.fontSize}px`,
        color: GameConfig.uiFontColor,
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      }
    );

    // Fragment display
    this.fragmentText = this.add.text(
      width - 10,
      10,
      'Fragments: 0 / 4',
      {
        fontSize: `${GameConfig.fontSize}px`,
        color: GameConfig.uiFontColor,
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      }
    );
    this.fragmentText.setOrigin(1, 0);

    // Listen for updates from GameScene
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('updateUI', this.updateUI, this);
  }

  private updateUI(data: { health: number; fragments: number; fragmentsRequired: number }): void {
    this.healthText.setText(`Health: ${data.health}`);
    this.fragmentText.setText(`Fragments: ${data.fragments} / ${data.fragmentsRequired}`);
  }
}
