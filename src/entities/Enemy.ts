import Phaser from 'phaser';
import { GameConfig } from '../config/gameConfig';
import {
  EnemyType,
  EnemyStats,
  getEnemyStats,
  HEALTH_BAR_CONFIG,
  DAMAGE_NUMBER_CONFIG,
} from '../config/enemyBalance';

/**
 * Enemy AI configuration
 */
export interface EnemyAIConfig {
  chaseDistance?: number; // Distance at which enemy chases player
  patrolMoveDelay?: number; // Delay between patrol moves
  patrolRange?: number; // Range for random patrol movement
  speed?: number; // Movement speed
}

const ENEMY_TEXTURE_BY_TYPE: Record<EnemyType, string> = {
  [EnemyType.WEAK]: 'enemy-weak-tile',
  [EnemyType.FAST]: 'enemy-fast-tile',
  [EnemyType.TANK]: 'enemy-tank-tile',
};

export class Enemy {
  public sprite: Phaser.GameObjects.Image;
  private scene: Phaser.Scene;
  private targetX: number;
  private targetY: number;
  private moveTimer: number = 0;
  private config: Required<EnemyAIConfig>;

  // Health system
  public readonly type: EnemyType;
  public maxHealth: number;
  public currentHealth: number;
  public damage: number;

  // Visual elements
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthBarFill!: Phaser.GameObjects.Graphics;
  private isDestroyed: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: EnemyType = EnemyType.WEAK,
    level: number = 1,
    aiConfig: EnemyAIConfig = {}
  ) {
    this.scene = scene;
    this.type = type;

    // Get stats for this enemy type and level
    const stats: EnemyStats = getEnemyStats(type, level);
    this.maxHealth = stats.maxHealth;
    this.currentHealth = stats.currentHealth;
    this.damage = stats.damage;

    const textureKey = ENEMY_TEXTURE_BY_TYPE[type] ?? ENEMY_TEXTURE_BY_TYPE[EnemyType.WEAK];

    // Create sprite with type-specific appearance
    this.sprite = scene.add
      .image(x, y, textureKey)
      .setDisplaySize(stats.size * 2.2, stats.size * 2.2)
      .setDepth(9);
    // Enable click/tap interactions (used for attacking on mobile/desktop)
    this.sprite.setInteractive();
    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(stats.size * 1.8, stats.size * 1.8, true);

    this.targetX = x;
    this.targetY = y;

    // Initialize AI config with stats
    this.config = {
      chaseDistance: aiConfig.chaseDistance ?? stats.chaseDistance,
      patrolMoveDelay: aiConfig.patrolMoveDelay ?? GameConfig.enemyAI.patrolMoveDelay,
      patrolRange: aiConfig.patrolRange ?? stats.patrolRange,
      speed: aiConfig.speed ?? stats.speed,
    };

    // Create health bar
    this.createHealthBar();
  }

  /**
   * Create health bar UI
   */
  private createHealthBar(): void {
    // Background
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.setDepth(100);

    // Fill
    this.healthBarFill = this.scene.add.graphics();
    this.healthBarFill.setDepth(101);

    this.updateHealthBar();
  }

  /**
   * Update health bar appearance
   */
  private updateHealthBar(): void {
    if (this.isDestroyed) return;

    const x = this.sprite.x - HEALTH_BAR_CONFIG.width / 2;
    const y = this.sprite.y + HEALTH_BAR_CONFIG.offsetY;

    // Clear and redraw background
    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(
      HEALTH_BAR_CONFIG.backgroundColor,
      HEALTH_BAR_CONFIG.backgroundAlpha
    );
    this.healthBarBg.fillRect(x, y, HEALTH_BAR_CONFIG.width, HEALTH_BAR_CONFIG.height);

    // Border
    this.healthBarBg.lineStyle(HEALTH_BAR_CONFIG.borderWidth, HEALTH_BAR_CONFIG.borderColor);
    this.healthBarBg.strokeRect(x, y, HEALTH_BAR_CONFIG.width, HEALTH_BAR_CONFIG.height);

    // Health fill
    const healthPercent = this.currentHealth / this.maxHealth;
    const fillWidth = HEALTH_BAR_CONFIG.width * healthPercent;
    const fillColor =
      healthPercent < HEALTH_BAR_CONFIG.lowHealthThreshold
        ? HEALTH_BAR_CONFIG.lowHealthColor
        : HEALTH_BAR_CONFIG.healthColor;

    this.healthBarFill.clear();
    this.healthBarFill.fillStyle(fillColor, 1);
    this.healthBarFill.fillRect(x, y, fillWidth, HEALTH_BAR_CONFIG.height);
  }

  /**
   * Take damage and return true if killed
   */
  takeDamage(amount: number): boolean {
    if (this.isDestroyed) return false;

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.updateHealthBar();

    // Show floating damage number
    this.showDamageNumber(amount);

    // Flash sprite
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 1,
    });

    // Check if killed
    if (this.currentHealth <= 0) {
      this.playDeathAnimation();
      return true;
    }

    return false;
  }

  /**
   * Show floating damage number
   */
  private showDamageNumber(damage: number): void {
    const text = this.scene.add.text(this.sprite.x, this.sprite.y - 20, `-${damage}`, {
      fontSize: DAMAGE_NUMBER_CONFIG.fontSize,
      color: DAMAGE_NUMBER_CONFIG.fontColor,
      fontStyle: DAMAGE_NUMBER_CONFIG.fontStyle,
    });
    text.setOrigin(0.5);
    text.setDepth(200);

    // Float upward and fade
    this.scene.tweens.add({
      targets: text,
      y: text.y - DAMAGE_NUMBER_CONFIG.floatDistance,
      alpha: 0,
      duration: DAMAGE_NUMBER_CONFIG.duration,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  /**
   * Play death animation (placeholder)
   */
  private playDeathAnimation(): void {
    // Fade out and scale down
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.currentHealth;
  }

  /**
   * Check if enemy is dead
   */
  isDead(): boolean {
    return this.currentHealth <= 0;
  }

  update(delta: number, playerPos: { x: number; y: number }): void {
    if (this.isDestroyed || this.isDead()) return;

    this.moveTimer += delta;

    if (this.moveTimer >= this.config.patrolMoveDelay) {
      this.moveTimer = 0;
      this.updateTarget(playerPos);
    }

    this.moveTowardsTarget();
    this.updateHealthBar();
  }

  private updateTarget(playerPos: { x: number; y: number }): void {
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      playerPos.x,
      playerPos.y
    );

    // Simple AI: move towards player if close enough (chase behavior)
    if (distance < this.config.chaseDistance) {
      this.targetX = playerPos.x;
      this.targetY = playerPos.y;
    } else {
      // Random patrol behavior when player is far
      this.targetX = this.sprite.x + (Math.random() - 0.5) * this.config.patrolRange;
      this.targetY = this.sprite.y + (Math.random() - 0.5) * this.config.patrolRange;
    }
  }

  private moveTowardsTarget(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body) return; // Safety check for body initialization

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      this.targetX,
      this.targetY
    );

    body.setVelocity(Math.cos(angle) * this.config.speed, Math.sin(angle) * this.config.speed);
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.sprite.destroy();
    this.healthBarBg?.destroy();
    this.healthBarFill?.destroy();
  }
}
