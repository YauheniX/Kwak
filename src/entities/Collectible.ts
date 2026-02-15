import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';

export class Fragment {
  public sprite: Phaser.GameObjects.Arc;
  public collected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.circle(x, y, GameConfig.fragmentSize, GameConfig.fragmentColor);
    scene.physics.add.existing(this.sprite, true); // true = static body
  }

  collect(): void {
    this.collected = true;
    this.sprite.destroy();
  }

  destroy(): void {
    if (!this.collected) {
      this.sprite.destroy();
    }
  }
}

export class Treasure {
  public sprite: Phaser.GameObjects.Arc;
  private locked: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.circle(x, y, GameConfig.treasureSize, GameConfig.treasureColor);
    scene.physics.add.existing(this.sprite, true);
    this.sprite.setAlpha(0.3); // Visually show it's locked
  }

  unlock(): void {
    this.locked = false;
    this.sprite.setAlpha(1.0); // Show it's unlocked
  }

  isLocked(): boolean {
    return this.locked;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

/**
 * Treasure Chest entity
 * Spawned when player successfully digs at treasure location
 */
export class TreasureChest {
  public sprite: Phaser.GameObjects.Arc;
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private collected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Create treasure chest sprite (golden chest)
    this.sprite = scene.add.circle(x, y, GameConfig.treasureSize * 1.5, 0xffd700);
    scene.physics.add.existing(this.sprite, true);

    // Start invisible for spawn animation
    this.sprite.setAlpha(0);
    this.sprite.setScale(0.1);

    // Spawn animation - scale + fade in
    scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Create golden particle burst
    this.createParticleBurst(scene, x, y);
  }

  /**
   * Create golden particle burst effect
   */
  private createParticleBurst(scene: Phaser.Scene, x: number, y: number): void {
    // Create particles manually without texture
    const particles: Phaser.GameObjects.Arc[] = [];
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 100 + Math.random() * 100;
      const particle = scene.add.circle(x, y, 3, 0xffd700);
      particles.push(particle);

      // Animate particle outward
      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Mark treasure as collected
   */
  collect(): void {
    this.collected = true;
  }

  /**
   * Check if treasure is collected
   */
  isCollected(): boolean {
    return this.collected;
  }

  /**
   * Destroy the treasure chest
   */
  destroy(): void {
    this.sprite.destroy();
    if (this.particles) {
      this.particles.stop();
    }
  }
}
