import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';

/**
 * Merchant entity for selling fragments and items
 */
export class Merchant {
  public sprite: Phaser.GameObjects.Image;
  public interactionRadius: number = 96;
  private promptText?: Phaser.GameObjects.Text;
  private isPlayerNearby: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add
      .image(x, y, 'merchant-tile')
      .setDisplaySize(GameConfig.tileSize, GameConfig.tileSize)
      .setDepth(9);
    // Enable tap/click interaction on mobile/desktop
    this.sprite.setInteractive();
    scene.physics.add.existing(this.sprite, true); // static body

    // Add a visual indicator (star or crown effect)
    const indicator = scene.add.circle(x, y - 30, 8, 0xffff00);
    scene.tweens.add({
      targets: indicator,
      y: y - 35,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Create interaction prompt (hidden by default)
    this.promptText = scene.add.text(x, y + 35, 'Tap (or E) to interact', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 },
    });
    this.promptText.setOrigin(0.5, 0);
    this.promptText.setVisible(false);
  }

  /**
   * Update merchant (check player proximity)
   */
  update(playerX: number, playerY: number): void {
    const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);

    const wasNearby = this.isPlayerNearby;
    this.isPlayerNearby = distance <= this.interactionRadius;

    // Show/hide prompt
    if (this.isPlayerNearby && !wasNearby) {
      this.promptText?.setVisible(true);
    } else if (!this.isPlayerNearby && wasNearby) {
      this.promptText?.setVisible(false);
    }
  }

  /**
   * Check if player is near merchant
   */
  isPlayerInRange(): boolean {
    return this.isPlayerNearby;
  }

  /**
   * Get merchant position
   */
  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Destroy merchant
   */
  destroy(): void {
    this.sprite.destroy();
    if (this.promptText) {
      this.promptText.destroy();
    }
  }
}
