import Phaser from 'phaser';
import { MapFragmentData, FragmentState } from '../systems/mapFragment';
import { VisualStyle } from '../config/visualStyle';
import { SPACING } from '../config/scaleConfig';
import { LayoutSystem } from '../systems/layoutSystem';

export class UIScene extends Phaser.Scene {
  private healthText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private fragmentText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private fragmentIndicators: Phaser.GameObjects.Container[] = [];
  private maxHealth: number = 1000;
  private layoutSystem!: LayoutSystem;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Initialize layout system for responsive positioning
    this.layoutSystem = new LayoutSystem(this);
    const layout = this.layoutSystem.getLayout();
    
    // Create health bar background
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.fillStyle(VisualStyle.ColorNumbers.darkWoodBrown, 0.8);
    this.healthBarBg.fillRoundedRect(
      layout.healthBar.x,
      layout.healthBar.y,
      VisualStyle.ComponentSize.healthBarWidth,
      VisualStyle.ComponentSize.healthBarHeight,
      4
    );

    // Create health bar (will be updated)
    this.healthBar = this.add.graphics();
    this.updateHealthBar(this.maxHealth, this.maxHealth);

    // Health label
    this.healthText = this.add.text(
      layout.healthBar.x + SPACING.sm,
      layout.healthBar.y + SPACING.xs,
      'Health: 1000',
      {
        fontSize: `${VisualStyle.Typography.fontSize.small}px`,
        color: VisualStyle.Colors.sandBeige,
        fontFamily: VisualStyle.Typography.uiFont,
      }
    );

    // Level display
    this.levelText = this.add.text(
      layout.levelDisplay.x,
      layout.levelDisplay.y,
      'Level: 1',
      {
        fontSize: `${VisualStyle.Typography.fontSize.body}px`,
        color: VisualStyle.Colors.treasureGold,
        fontFamily: VisualStyle.Typography.uiFont,
        backgroundColor: VisualStyle.Colors.darkWoodBrown,
        padding: { x: SPACING.sm, y: SPACING.xs },
      }
    );

    // Gold display
    this.goldText = this.add.text(
      layout.goldDisplay.x,
      layout.goldDisplay.y,
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
      layout.fragmentTracker.x,
      layout.fragmentTracker.y,
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

    // Register resize handler to reposition UI elements
    this.layoutSystem.onLayoutChange((newLayout) => {
      this.repositionUIElements(newLayout);
    });

    // Listen for updates from GameScene
    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('updateUI', this.updateUI, this);
  }

  /**
   * Reposition all UI elements when layout changes (e.g., screen resize)
   */
  private repositionUIElements(layout: ReturnType<LayoutSystem['getLayout']>): void {
    // Reposition health bar background
    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(VisualStyle.ColorNumbers.darkWoodBrown, 0.8);
    this.healthBarBg.fillRoundedRect(
      layout.healthBar.x,
      layout.healthBar.y,
      VisualStyle.ComponentSize.healthBarWidth,
      VisualStyle.ComponentSize.healthBarHeight,
      4
    );

    // Reposition health text
    this.healthText.setPosition(
      layout.healthBar.x + SPACING.sm,
      layout.healthBar.y + SPACING.xs
    );

    // Reposition level display
    this.levelText.setPosition(layout.levelDisplay.x, layout.levelDisplay.y);

    // Reposition gold display
    this.goldText.setPosition(layout.goldDisplay.x, layout.goldDisplay.y);

    // Reposition fragment tracker
    this.fragmentText.setPosition(layout.fragmentTracker.x, layout.fragmentTracker.y);

    // Force redraw health bar with current health
    this.updateHealthBar(
      parseInt(this.healthText.text.replace('Health: ', '')) || this.maxHealth,
      this.maxHealth
    );
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

    // Get current layout position
    const layout = this.layoutSystem.getLayout();

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
      layout.healthBar.x + 4,
      layout.healthBar.y + 4,
      currentWidth,
      VisualStyle.ComponentSize.healthBarHeight - 8,
      2
    );
  }

  private updateFragmentIndicators(fragmentData: MapFragmentData[]): void {
    // Clear existing indicators
    this.fragmentIndicators.forEach((indicator) => indicator.destroy());
    this.fragmentIndicators = [];

    // Create visual indicators for each fragment (torn parchment style)
    fragmentData.forEach((fragment, index) => {
      // Get position from layout system
      const position = this.layoutSystem.getFragmentIndicatorPosition(index);
      
      const container = this.add.container(position.x, position.y);

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
      this.fragmentIndicators.push(container);
    });
  }
}
