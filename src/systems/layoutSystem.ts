/**
 * Layout System for Responsive UI Positioning
 * 
 * This system manages dynamic UI element positioning based on screen size and orientation.
 * It handles:
 * - HUD element positioning (health bar, gold counter, fragment tracker)
 * - Touch control positioning
 * - Safe area calculations
 * - Resize event handling
 * 
 * The layout system ensures UI elements:
 * - Don't overlap with each other
 * - Stay within safe margins
 * - Scale appropriately for different screen sizes
 * - Adapt to portrait and landscape orientations
 */

import Phaser from 'phaser';
import { 
  SPACING, 
  getAnchoredPosition, 
  getMinimumTouchSize
} from '../config/scaleConfig';

/**
 * Layout configuration for UI elements
 */
export interface LayoutConfig {
  // HUD Elements
  healthBar: { x: number; y: number };
  levelDisplay: { x: number; y: number };
  goldDisplay: { x: number; y: number };
  fragmentTracker: { x: number; y: number };
  fragmentIndicators: { startX: number; startY: number; spacing: number };
  
  // Touch Controls (if needed in future)
  joystick?: { x: number; y: number; size: number };
  actionButton?: { x: number; y: number; size: number };
  digButton?: { x: number; y: number; size: number };
}

/**
 * Layout System Class
 * Manages responsive positioning of all UI elements
 */
export class LayoutSystem {
  private scene: Phaser.Scene;
  private currentLayout: LayoutConfig;
  private resizeCallbacks: Array<(layout: LayoutConfig) => void> = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.currentLayout = this.calculateLayout();
    this.setupResizeHandler();
  }

  /**
   * Calculate layout positions based on current screen dimensions
   * This is the core method that determines where all UI elements should be placed
   */
  private calculateLayout(): LayoutConfig {
    const { width, height } = this.scene.cameras.main;

    // Health bar - always top-left
    const healthBarPos = getAnchoredPosition('top-left', 0, 0, width, height);

    // Level display - below health bar
    const levelDisplayPos = getAnchoredPosition('top-left', 0, SPACING.lg, width, height);

    // Gold display - below level display
    const goldDisplayPos = getAnchoredPosition('top-left', 0, SPACING.lg + SPACING.xl, width, height);

    // Fragment tracker text - top-right
    const fragmentTrackerPos = getAnchoredPosition('top-right', 0, 0, width, height);

    // Fragment indicators - top-right, below fragment tracker
    // Using SPACING.fragmentIndicator for consistent spacing between indicators
    const fragmentIndicatorsStartPos = getAnchoredPosition(
      'top-right',
      0,
      SPACING.lg + SPACING.md,
      width,
      height
    );

    // Touch controls (if needed)
    const touchControlSize = getMinimumTouchSize(64);
    
    // Joystick - bottom-left
    const joystickPos = getAnchoredPosition('bottom-left', SPACING.xl, -SPACING.xl, width, height);
    
    // Action button - bottom-right
    const actionButtonPos = getAnchoredPosition('bottom-right', -SPACING.xl, -SPACING.xl, width, height);
    
    // Dig button - bottom-right, above action button
    const digButtonPos = getAnchoredPosition(
      'bottom-right', 
      -SPACING.xl, 
      -SPACING.xl - touchControlSize - SPACING.sm,
      width,
      height
    );

    return {
      healthBar: healthBarPos,
      levelDisplay: levelDisplayPos,
      goldDisplay: goldDisplayPos,
      fragmentTracker: fragmentTrackerPos,
      fragmentIndicators: {
        startX: fragmentIndicatorsStartPos.x,
        startY: fragmentIndicatorsStartPos.y,
        spacing: SPACING.fragmentIndicator,
      },
      joystick: { ...joystickPos, size: touchControlSize },
      actionButton: { ...actionButtonPos, size: touchControlSize },
      digButton: { ...digButtonPos, size: touchControlSize },
    };
  }

  /**
   * Setup resize event handler
   * Recalculates layout when screen size changes
   */
  private setupResizeHandler(): void {
    this.scene.scale.on('resize', this.handleResize, this);
  }

  /**
   * Handle resize events
   * Recalculates layout and notifies all registered callbacks
   */
  private handleResize(): void {
    this.currentLayout = this.calculateLayout();
    
    // Notify all registered callbacks
    this.resizeCallbacks.forEach(callback => {
      callback(this.currentLayout);
    });
  }

  /**
   * Register a callback to be called when layout changes
   * UI elements can use this to update their positions
   */
  public onLayoutChange(callback: (layout: LayoutConfig) => void): void {
    this.resizeCallbacks.push(callback);
  }

  /**
   * Get current layout configuration
   */
  public getLayout(): LayoutConfig {
    return this.currentLayout;
  }

  /**
   * Get position for health bar
   */
  public getHealthBarPosition(): { x: number; y: number } {
    return this.currentLayout.healthBar;
  }

  /**
   * Get position for level display
   */
  public getLevelDisplayPosition(): { x: number; y: number } {
    return this.currentLayout.levelDisplay;
  }

  /**
   * Get position for gold display
   */
  public getGoldDisplayPosition(): { x: number; y: number } {
    return this.currentLayout.goldDisplay;
  }

  /**
   * Get position for fragment tracker
   */
  public getFragmentTrackerPosition(): { x: number; y: number } {
    return this.currentLayout.fragmentTracker;
  }

  /**
   * Get position for fragment indicator at given index
   * Fragment indicators are stacked horizontally from right to left
   */
  public getFragmentIndicatorPosition(index: number): { x: number; y: number } {
    const { startX, startY, spacing } = this.currentLayout.fragmentIndicators;
    return {
      x: startX - (index * spacing),
      y: startY,
    };
  }

  /**
   * Get safe area margins
   * Returns the margins that should be avoided to prevent UI overlap
   */
  public getSafeArea(): { top: number; bottom: number; left: number; right: number } {
    return {
      top: SPACING.sm,
      bottom: SPACING.xxxl + SPACING.xl, // Extra space for touch controls
      left: SPACING.sm,
      right: SPACING.sm,
    };
  }

  /**
   * Cleanup - remove event listeners
   */
  public destroy(): void {
    this.scene.scale.off('resize', this.handleResize, this);
    this.resizeCallbacks = [];
  }
}
