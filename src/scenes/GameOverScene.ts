import Phaser from 'phaser';
import { VisualStyle } from '../config/visualStyle';
import { getAnchoredPosition, SPACING } from '../config/scaleConfig';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { won: boolean; fragments: number }): void {
    const { width, height } = this.cameras.main;

    // Set background color
    this.cameras.main.setBackgroundColor(VisualStyle.ColorNumbers.deepOceanBlue);

    // Title - positioned at top-center with offset
    const titlePos = getAnchoredPosition('top-center', 0, SPACING.xxxl + SPACING.xl, width, height);
    const title = this.add.text(titlePos.x, titlePos.y, data.won ? 'VICTORY!' : 'GAME OVER', {
      fontSize: `${VisualStyle.Typography.fontSize.giant}px`,
      color: data.won ? VisualStyle.Colors.treasureGold : VisualStyle.Colors.crimsonAccent,
      fontStyle: 'bold',
      fontFamily: VisualStyle.Typography.headerFont,
    });
    title.setOrigin(0.5);

    // Message - centered on screen
    const message = data.won
      ? `You collected all map fragments and found the treasure!`
      : `You were defeated! Fragments collected: ${data.fragments}`;

    const messagePos = getAnchoredPosition('center', 0, 0, width, height);
    const messageText = this.add.text(messagePos.x, messagePos.y, message, {
      fontSize: `${VisualStyle.Typography.fontSize.large}px`,
      color: VisualStyle.Colors.sandBeige,
      align: 'center',
      fontFamily: VisualStyle.Typography.bodyFont,
    });
    messageText.setOrigin(0.5);

    // Instructions - below message using spacing constants
    const instructionsPos = getAnchoredPosition('center', 0, SPACING.xxxl, width, height);
    const instructions = this.add.text(instructionsPos.x, instructionsPos.y, 'Click to return to menu', {
      fontSize: `${VisualStyle.Typography.fontSize.body}px`,
      color: VisualStyle.Colors.tropicalTeal,
      fontFamily: VisualStyle.Typography.bodyFont,
    });
    instructions.setOrigin(0.5);

    // Click to return to menu
    this.input.once('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}
