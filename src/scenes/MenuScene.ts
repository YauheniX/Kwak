import Phaser from 'phaser';
import { ProgressManager } from '../utils/progressManager';

export class MenuScene extends Phaser.Scene {
  private progressManager: ProgressManager;

  constructor() {
    super({ key: 'MenuScene' });
    this.progressManager = new ProgressManager();
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Title
    const title = this.add.text(width / 2, height / 4, 'KWAK', {
      fontSize: '64px',
      color: '#00ff00',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 4 + 60, 'A Roguelike Adventure', {
      fontSize: '24px',
      color: '#ffffff',
    });
    subtitle.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(
      width / 2,
      height / 2,
      'Collect all fragments to unlock the treasure!\n\nArrow keys to move\nAvoid enemies\n\nClick to Start',
      {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
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
        fontSize: '14px',
        color: '#aaaaaa',
        align: 'center',
      }
    );
    stats.setOrigin(0.5);

    // Click to start
    this.input.once('pointerdown', () => {
      this.progressManager.recordGameStart();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });
  }
}
