import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';
import { MapFragmentData, FragmentState } from '../systems/mapFragment';

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private fragmentText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private fragmentIndicators: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const { width } = this.cameras.main;

    // Health display
    this.healthText = this.add.text(10, 10, 'Health: 1000', {
      fontSize: `${GameConfig.fontSize}px`,
      color: GameConfig.uiFontColor,
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });

    // Gold display
    this.goldText = this.add.text(10, 40, 'Gold: 0', {
      fontSize: `${GameConfig.fontSize}px`,
      color: GameConfig.uiFontColor,
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });

    // Fragment display
    this.fragmentText = this.add.text(width - 10, 10, 'Fragments: 0 / 0', {
      fontSize: `${GameConfig.fontSize}px`,
      color: GameConfig.uiFontColor,
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });
    this.fragmentText.setOrigin(1, 0);

    // Listen for updates from GameScene
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('updateUI', this.updateUI, this);
  }

  private updateUI(data: {
    health: number;
    fragments: number;
    fragmentsRequired: number;
    gold: number;
    fragmentData: MapFragmentData[];
  }): void {
    this.healthText.setText(`Health: ${data.health}`);
    this.goldText.setText(`Gold: ${data.gold}`);
    this.fragmentText.setText(`Fragments: ${data.fragments} / ${data.fragmentsRequired}`);

    // Update fragment indicators
    this.updateFragmentIndicators(data.fragmentData);
  }

  private updateFragmentIndicators(fragmentData: MapFragmentData[]): void {
    // Clear existing indicators
    this.fragmentIndicators.forEach((indicator) => indicator.destroy());
    this.fragmentIndicators = [];

    const { width } = this.cameras.main;
    const startX = width - 10;
    const startY = 40;
    const spacing = 20;

    // Create visual indicators for each fragment
    fragmentData.forEach((fragment, index) => {
      let color: number;
      let alpha: number = 1;

      switch (fragment.state) {
        case FragmentState.COLLECTED:
        case FragmentState.PURCHASED:
          color = 0x00ff00; // Green for collected
          break;
        case FragmentState.AVAILABLE_FOR_PURCHASE:
          color = 0x00ffff; // Cyan for purchasable
          break;
        case FragmentState.UNCOLLECTED:
        default:
          color = 0xffff00; // Yellow for uncollected
          alpha = 0.4;
          break;
      }

      const indicator = this.add.circle(
        startX - index * spacing,
        startY,
        8,
        color,
        alpha
      );
      indicator.setOrigin(1, 0.5);
      this.fragmentIndicators.push(indicator);
    });
  }
}
