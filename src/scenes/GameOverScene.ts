import Phaser from 'phaser';
import { VisualStyle } from '../config/visualStyle';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { won: boolean; fragments: number }): void {
    const { width, height } = this.cameras.main;

    // Set background color
    this.cameras.main.setBackgroundColor(VisualStyle.ColorNumbers.deepOceanBlue);

    // Title
    const title = this.add.text(width / 2, height / 3, data.won ? 'VICTORY!' : 'GAME OVER', {
      fontSize: `${VisualStyle.Typography.fontSize.giant}px`,
      color: data.won ? VisualStyle.Colors.treasureGold : VisualStyle.Colors.crimsonAccent,
      fontStyle: 'bold',
      fontFamily: VisualStyle.Typography.headerFont,
    });
    title.setOrigin(0.5);

    // Message
    const message = data.won
      ? `You collected all map fragments and found the treasure!`
      : `You were defeated! Fragments collected: ${data.fragments}`;

    const messageText = this.add.text(width / 2, height / 2, message, {
      fontSize: `${VisualStyle.Typography.fontSize.large}px`,
      color: VisualStyle.Colors.sandBeige,
      align: 'center',
      fontFamily: VisualStyle.Typography.bodyFont,
    });
    messageText.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(width / 2, height / 2 + 60, 'Click to return to menu', {
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
