import Phaser from 'phaser';
import { MapFragmentData, FragmentState } from '../systems/mapFragment';
import { VisualStyle } from '../config/visualStyle';
import { SPACING, SCALE_CONFIG } from '../config/scaleConfig';

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private fragmentText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private fragmentIndicators: Phaser.GameObjects.Container[] = [];
  private maxHealth: number = 1000;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Use responsive positioning based on scale config
    const safeLeft = SPACING.sm;
    const safeTop = SPACING.sm;
    const safeRight = SCALE_CONFIG.baseWidth - SPACING.sm;
    
    // Create health bar background
    const healthBarBg = this.add.graphics();
    healthBarBg.fillStyle(VisualStyle.ColorNumbers.darkWoodBrown, 0.8);
    healthBarBg.fillRoundedRect(
      safeLeft,
      safeTop,
      VisualStyle.ComponentSize.healthBarWidth,
      VisualStyle.ComponentSize.healthBarHeight,
      4
    );

    // Create health bar (will be updated)
    this.healthBar = this.add.graphics();
    this.updateHealthBar(this.maxHealth, this.maxHealth);

    // Health label
    this.healthText = this.add.text(
      safeLeft + SPACING.sm,
      safeTop + SPACING.xs,
      'Health: 1000',
      {
        fontSize: `${VisualStyle.Typography.fontSize.small}px`,
        color: VisualStyle.Colors.sandBeige,
        fontFamily: VisualStyle.Typography.uiFont,
      }
    );

    // Level display (NEW)
    this.levelText = this.add.text(
      safeLeft,
      safeTop + VisualStyle.ComponentSize.healthBarHeight + SPACING.sm,
      'Level: 1',
      {
        fontSize: `${VisualStyle.Typography.fontSize.body}px`,
        color: VisualStyle.Colors.treasureGold,
        fontFamily: VisualStyle.Typography.uiFont,
        backgroundColor: VisualStyle.Colors.darkWoodBrown,
        padding: { x: SPACING.sm, y: SPACING.xs },
      }
    );

    // Gold display (with icon placeholder)
    this.goldText = this.add.text(
      safeLeft,
      safeTop + VisualStyle.ComponentSize.healthBarHeight + SPACING.sm + SPACING.lg,
      '⚫ Gold: 0',
      {
        fontSize: `${VisualStyle.Typography.fontSize.body}px`,
        color: VisualStyle.Colors.treasureGold,
        fontFamily: VisualStyle.Typography.uiFont,
        backgroundColor: VisualStyle.Colors.darkWoodBrown,
        padding: { x: SPACING.sm, y: SPACING.xs },
      }
    );

    // Fragment display label
    this.fragmentText = this.add.text(
      safeRight,
      safeTop,
      'Map Fragments: 0 / 0',
      {
        fontSize: `${VisualStyle.Typography.fontSize.body}px`,
        color: VisualStyle.Colors.sandBeige,
        fontFamily: VisualStyle.Typography.uiFont,
        backgroundColor: VisualStyle.Colors.darkWoodBrown,
        padding: { x: SPACING.sm, y: SPACING.xs },
      }
    );
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
    level?: number;
    fragmentData: MapFragmentData[];
  }): void {
    this.healthText.setText(`Health: ${data.health}`);
    this.goldText.setText(`⚫ Gold: ${data.gold}`);
    this.fragmentText.setText(`Map Fragments: ${data.fragments} / ${data.fragmentsRequired}`);
    
    // Update level display
    if (data.level !== undefined) {
      this.levelText.setText(`Level: ${data.level}`);
    }

    // Update health bar
    this.updateHealthBar(data.health, this.maxHealth);

    // Update fragment indicators
    this.updateFragmentIndicators(data.fragmentData);
  }

  private updateHealthBar(currentHealth: number, maxHealth: number): void {
    this.healthBar.clear();

    const healthPercent = currentHealth / maxHealth;
    const barWidth = VisualStyle.ComponentSize.healthBarWidth - 8;
    const currentWidth = barWidth * healthPercent;

    // Determine health bar color based on health percentage
    let healthColor: number;
    if (healthPercent > 0.6) {
      healthColor = VisualStyle.ColorNumbers.emeraldGreen;
    } else if (healthPercent > 0.3) {
      healthColor = VisualStyle.ColorNumbers.treasureGold;
    } else {
      healthColor = VisualStyle.ColorNumbers.crimsonAccent;
    }

    // Draw health bar with gradient effect
    this.healthBar.fillStyle(healthColor, 1);
    this.healthBar.fillRoundedRect(
      SPACING.sm + 4,
      SPACING.sm + 4,
      currentWidth,
      VisualStyle.ComponentSize.healthBarHeight - 8,
      2
    );
  }

  private updateFragmentIndicators(fragmentData: MapFragmentData[]): void {
    // Clear existing indicators
    this.fragmentIndicators.forEach((indicator) => indicator.destroy());
    this.fragmentIndicators = [];

    const safeRight = SCALE_CONFIG.baseWidth - SPACING.sm;
    const startX = safeRight;
    const startY = SPACING.sm + VisualStyle.ComponentSize.healthBarHeight + SPACING.md;
    const spacing = VisualStyle.ComponentSize.fragmentIndicatorSpacing;

    // Create visual indicators for each fragment (torn parchment style)
    fragmentData.forEach((fragment, index) => {
      const container = this.add.container(
        startX - index * spacing,
        startY
      );

      let fillColor: number;
      let alpha: number = 1;
      let strokeColor: number = VisualStyle.ColorNumbers.darkWoodBrown;

      switch (fragment.state) {
        case FragmentState.COLLECTED:
        case FragmentState.PURCHASED:
          fillColor = VisualStyle.ColorNumbers.treasureGold;
          // Add glow effect for collected fragments
          const glow = this.add.circle(0, 0, VisualStyle.FragmentVisual.glowSize, fillColor, 0.3);
          container.add(glow);
          
          // Pulsing animation for collected fragments
          this.tweens.add({
            targets: glow,
            alpha: { from: 0.3, to: 0.6 },
            scale: { from: 1, to: 1.2 },
            duration: VisualStyle.FragmentVisual.pulseSpeed,
            yoyo: true,
            repeat: -1,
          });
          break;
        case FragmentState.AVAILABLE_FOR_PURCHASE:
          fillColor = VisualStyle.ColorNumbers.tropicalTeal;
          break;
        case FragmentState.UNCOLLECTED:
        default:
          fillColor = VisualStyle.ColorNumbers.sandBeige;
          alpha = 0.5;
          break;
      }

      // Create torn parchment-like fragment shape
      const graphics = this.add.graphics();
      
      // Draw irregular quadrilateral to simulate torn parchment
      graphics.fillStyle(fillColor, alpha);
      graphics.lineStyle(1, strokeColor, alpha);
      
      // Irregular shape points (torn parchment effect)
      graphics.beginPath();
      graphics.moveTo(-6, -8);
      graphics.lineTo(6, -7);
      graphics.lineTo(7, 8);
      graphics.lineTo(-5, 7);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();

      // Add treasure mark symbol (X) for collected fragments
      if (fragment.state === FragmentState.COLLECTED || fragment.state === FragmentState.PURCHASED) {
        const mark = this.add.text(0, 0, 'X', {
          fontSize: '10px',
          color: VisualStyle.Colors.darkWoodBrown,
          fontStyle: 'bold',
        });
        mark.setOrigin(0.5);
        container.add(mark);
      }

      container.add(graphics);
      // Note: Containers don't have setOrigin in Phaser 3
      this.fragmentIndicators.push(container);
    });
  }
}
