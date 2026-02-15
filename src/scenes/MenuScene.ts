import Phaser from 'phaser';
import { ProgressManager } from '../utils/progressManager';
import { VisualStyle } from '../config/visualStyle';

export class MenuScene extends Phaser.Scene {
  private progressManager: ProgressManager;

  constructor() {
    super({ key: 'MenuScene' });
    this.progressManager = new ProgressManager();
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Set background color to deep ocean blue
    this.cameras.main.setBackgroundColor(VisualStyle.ColorNumbers.deepOceanBlue);

    // Title
    const title = this.add.text(width / 2, height / 4, 'KWAK', {
      fontSize: `${VisualStyle.Typography.fontSize.giant}px`,
      color: VisualStyle.Colors.treasureGold,
      fontStyle: 'bold',
      fontFamily: VisualStyle.Typography.headerFont,
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 4 + 60, 'A Pirate Roguelike Adventure', {
      fontSize: `${VisualStyle.Typography.fontSize.title}px`,
      color: VisualStyle.Colors.tropicalTeal,
      fontFamily: VisualStyle.Typography.bodyFont,
    });
    subtitle.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(
      width / 2,
      height / 2,
      'Collect all map fragments to unlock the treasure!\n\nArrow keys or Tap to move\nTap enemy to attack\nTap merchant to interact (or walk closer)\nLong-press to dig\nAvoid enemies\n\nTap to Start',
      {
        fontSize: `${VisualStyle.Typography.fontSize.large}px`,
        color: VisualStyle.Colors.sandBeige,
        align: 'center',
        fontFamily: VisualStyle.Typography.bodyFont,
      }
    );
    instructions.setOrigin(0.5);

    // Stats
    const progress = this.progressManager.getProgress();
    const stats = this.add.text(
      width / 2,
      height - 100,
      `Games Played: ${progress.gamesPlayed} | Wins: ${progress.gamesWon}\nTotal Fragments: ${progress.totalFragmentsCollected} | Best Run: ${progress.highestFragmentsInOneRun}`,
      {
        fontSize: `${VisualStyle.Typography.fontSize.small}px`,
        color: VisualStyle.Colors.tropicalTeal,
        align: 'center',
        fontFamily: VisualStyle.Typography.bodyFont,
      }
    );
    stats.setOrigin(0.5);

    // Click to start - lazy-load game scenes before starting
    this.input.once('pointerdown', () => {
      this.progressManager.recordGameStart();
      
      // Lazy-load GameScene and UIScene if not already loaded
      // This ensures they're available before we start them
      if (window.sceneManager) {
        window.sceneManager.preloadScenes(['GameScene', 'UIScene']).then(() => {
          this.scene.start('GameScene');
          this.scene.launch('UIScene');
        });
      } else {
        // Fallback if sceneManager is not available
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
      }
    });
  }
}
