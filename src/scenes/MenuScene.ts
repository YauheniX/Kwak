import Phaser from 'phaser';
import { ProgressManager } from '../utils/progressManager';
import { VisualStyle } from '../config/visualStyle';
import { getAnchoredPosition, SPACING } from '../config/scaleConfig';

export class MenuScene extends Phaser.Scene {
  private progressManager: ProgressManager;

  constructor() {
    super({ key: 'MenuScene' });
    this.progressManager = new ProgressManager();
  }

  create(): void {
    const { width, height } = this.cameras.main;
    // Add a full-screen background image if available, otherwise fall back to color
    if (this.textures.exists('menu-background')) {
      const bg = this.add.image(0, 0, 'menu-background').setOrigin(0, 0);
      bg.setDisplaySize(width, height);
      bg.setScrollFactor(0);
      // apply a subtle tint overlay to match visual style
      bg.setTint(VisualStyle.ColorNumbers.deepOceanBlue);
      bg.setAlpha(0.8);
    } else {
      this.cameras.main.setBackgroundColor(VisualStyle.ColorNumbers.deepOceanBlue);
    }

    // Title - positioned at top-center with offset
    const titlePos = getAnchoredPosition('top-center', 0, SPACING.xxxl, width, height);
    const title = this.add.text(titlePos.x, titlePos.y, 'KWAK', {
      fontSize: `${VisualStyle.Typography.fontSize.giant}px`,
      color: VisualStyle.Colors.treasureGold,
      fontStyle: 'bold',
      fontFamily: VisualStyle.Typography.headerFont,
    });
    title.setOrigin(0.5);

    // Subtitle - positioned below title using spacing constants
    const subtitlePos = getAnchoredPosition('top-center', 0, SPACING.xxxl + SPACING.xxxl, width, height);
    const subtitle = this.add.text(subtitlePos.x, subtitlePos.y, 'A Pirate Roguelike Adventure', {
      fontSize: `${VisualStyle.Typography.fontSize.title}px`,
      color: VisualStyle.Colors.tropicalTeal,
      fontFamily: VisualStyle.Typography.bodyFont,
    });
    subtitle.setOrigin(0.5);

    // Instructions - centered on screen
    const instructionsPos = getAnchoredPosition('center', 0, 0, width, height);
    const instructions = this.add.text(
      instructionsPos.x,
      instructionsPos.y,
      'Collect all map fragments to unlock the treasure!\n\nArrow keys or Tap to move\nTap enemy to attack\nTap merchant to interact (or walk closer)\nLong-press to dig\nAvoid enemies\n\nTap to Start',
      {
        fontSize: `${VisualStyle.Typography.fontSize.large}px`,
        color: VisualStyle.Colors.sandBeige,
        align: 'center',
        fontFamily: VisualStyle.Typography.bodyFont,
      }
    );
    instructions.setOrigin(0.5);

    // Stats - positioned at bottom-center with offset using spacing constants
    const progress = this.progressManager.getProgress();
    const statsPos = getAnchoredPosition('bottom-center', 0, -SPACING.xxxl, width, height);
    const stats = this.add.text(
      statsPos.x,
      statsPos.y,
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
