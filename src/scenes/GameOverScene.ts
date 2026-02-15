import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { won: boolean; fragments: number }): void {
    const { width, height } = this.cameras.main;

    // Title
    const title = this.add.text(
      width / 2,
      height / 3,
      data.won ? 'VICTORY!' : 'GAME OVER',
      {
        fontSize: '48px',
        color: data.won ? '#00ff00' : '#ff0000',
        fontStyle: 'bold',
      }
    );
    title.setOrigin(0.5);

    // Message
    const message = data.won
      ? `You collected all fragments and found the treasure!`
      : `You were defeated! Fragments collected: ${data.fragments}`;
    
    const messageText = this.add.text(width / 2, height / 2, message, {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
    });
    messageText.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(
      width / 2,
      height / 2 + 60,
      'Click to return to menu',
      {
        fontSize: '18px',
        color: '#aaaaaa',
      }
    );
    instructions.setOrigin(0.5);

    // Click to return to menu
    this.input.once('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}
