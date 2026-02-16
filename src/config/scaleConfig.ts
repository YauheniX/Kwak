/**
 * Phaser Scale Configuration for Responsive & Mobile Support
 * 
 * This configuration ensures the game:
 * - Works on small phones, large phones, and desktop
 * - Maintains aspect ratio without distortion
 * - Prevents overflow and cropping
 * - Centers content properly
 * - Supports both portrait and landscape modes
 * 
 * Base resolution: 1280x720 (16:9 aspect ratio)
 */

import Phaser from 'phaser';

export interface ScaleConfig {
  baseWidth: number;
  baseHeight: number;
  scaleMode: Phaser.Scale.ScaleModeType;
  autoCenter: Phaser.Scale.CenterType;
  min: {
    width: number;
    height: number;
  };
  max: {
    width: number;
    height: number;
  };
}

/**
 * Primary scale configuration
 */
export const SCALE_CONFIG: ScaleConfig = {
  // Base resolution (16:9 aspect ratio)
  baseWidth: 1280,
  baseHeight: 720,
  
  // RESIZE mode: canvas matches viewport size directly
  scaleMode: Phaser.Scale.RESIZE,
  
  // Center the game both horizontally and vertically
  autoCenter: Phaser.Scale.CENTER_BOTH,
  
  // Minimum supported resolution (small phones)
  min: {
    width: 320,
    height: 480,
  },
  
  // Maximum supported resolution (large desktops)
  max: {
    width: 2560,
    height: 1440,
  },
};

/**
 * Get Phaser scale configuration object
 */
export function getPhaserScaleConfig(): Phaser.Types.Core.ScaleConfig {
  return {
    mode: SCALE_CONFIG.scaleMode,
    autoCenter: SCALE_CONFIG.autoCenter,
    width: SCALE_CONFIG.baseWidth,
    height: SCALE_CONFIG.baseHeight,
    min: SCALE_CONFIG.min,
    max: SCALE_CONFIG.max,
  };
}

/**
 * Helper function to get relative position based on screen dimensions
 * This ensures UI elements are positioned relative to the game bounds
 */
export function getRelativePosition(
  x: number,
  y: number,
  baseWidth: number = SCALE_CONFIG.baseWidth,
  baseHeight: number = SCALE_CONFIG.baseHeight
): { x: number; y: number } {
  return {
    x: (x / baseWidth) * SCALE_CONFIG.baseWidth,
    y: (y / baseHeight) * SCALE_CONFIG.baseHeight,
  };
}

/**
 * Calculate UI safe area margins to avoid overlap with touch controls
 * Returns margins in pixels for top, bottom, left, right
 */
export function getUISafeArea(
  width: number = SCALE_CONFIG.baseWidth,
  height: number = SCALE_CONFIG.baseHeight
): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  const horizontalPadding = Math.max(12, Math.round(width * 0.02));
  const verticalPadding = Math.max(12, Math.round(height * 0.02));
  const controlPadding = Math.max(88, Math.round(height * 0.14));

  return {
    top: verticalPadding,
    bottom: controlPadding, // Extra space for touch controls
    left: horizontalPadding,
    right: horizontalPadding,
  };
}

/**
 * Get touch control positions for mobile
 * Returns positions for joystick and action buttons
 */
export function getTouchControlPositions(
  width: number = SCALE_CONFIG.baseWidth,
  height: number = SCALE_CONFIG.baseHeight
): {
  joystick: { x: number; y: number };
  actionButton: { x: number; y: number };
  digButton: { x: number; y: number };
} {
  const safeArea = getUISafeArea(width, height);
  const edgeOffset = Math.max(72, Math.round(width * 0.08));
  const bottomY = height - safeArea.bottom - 20;
  
  return {
    // Left side joystick
    joystick: {
      x: edgeOffset,
      y: bottomY,
    },
    
    // Right side action button
    actionButton: {
      x: width - edgeOffset,
      y: bottomY,
    },
    
    // Right side dig button (above action button)
    digButton: {
      x: width - edgeOffset,
      y: bottomY - 80,
    },
  };
}

/**
 * 8px spacing grid for consistent UI layout
 */
export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
  xxxl: 64,
  // Fragment-specific spacing
  fragmentIndicator: 20,
} as const;

/**
 * Anchor position type for UI elements
 */
export type AnchorPosition = 
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Get position based on anchor point with optional offset
 * This is the primary helper for responsive UI positioning
 * 
 * @param anchor - The anchor position (e.g., 'top-left', 'bottom-right')
 * @param offsetX - Horizontal offset from anchor point (default: 0)
 * @param offsetY - Vertical offset from anchor point (default: 0)
 * @param width - Current viewport width (default: base width). Pass this.cameras.main.width from scenes.
 * @param height - Current viewport height (default: base height). Pass this.cameras.main.height from scenes.
 * @returns Position object with x and y coordinates
 */
export function getAnchoredPosition(
  anchor: AnchorPosition,
  offsetX: number = 0,
  offsetY: number = 0,
  width: number = SCALE_CONFIG.baseWidth,
  height: number = SCALE_CONFIG.baseHeight
): { x: number; y: number } {
  const safeArea = getUISafeArea(width, height);
  
  let x = 0;
  let y = 0;

  // Calculate base position based on anchor
  switch (anchor) {
    case 'top-left':
      x = safeArea.left;
      y = safeArea.top;
      break;
    case 'top-center':
      x = width / 2;
      y = safeArea.top;
      break;
    case 'top-right':
      x = width - safeArea.right;
      y = safeArea.top;
      break;
    case 'center-left':
      x = safeArea.left;
      y = height / 2;
      break;
    case 'center':
      x = width / 2;
      y = height / 2;
      break;
    case 'center-right':
      x = width - safeArea.right;
      y = height / 2;
      break;
    case 'bottom-left':
      x = safeArea.left;
      y = height - safeArea.bottom;
      break;
    case 'bottom-center':
      x = width / 2;
      y = height - safeArea.bottom;
      break;
    case 'bottom-right':
      x = width - safeArea.right;
      y = height - safeArea.bottom;
      break;
  }

  return {
    x: x + offsetX,
    y: y + offsetY,
  };
}

/**
 * Get position based on percentage of screen dimensions
 * Useful for flexible layouts that adapt to any screen size
 * 
 * @param percentX - Horizontal position as percentage (0-100)
 * @param percentY - Vertical position as percentage (0-100)
 * @param width - Screen width (defaults to base width)
 * @param height - Screen height (defaults to base height)
 * @returns Position object with x and y coordinates
 */
export function getPercentagePosition(
  percentX: number,
  percentY: number,
  width: number = SCALE_CONFIG.baseWidth,
  height: number = SCALE_CONFIG.baseHeight
): { x: number; y: number } {
  return {
    x: (width * percentX) / 100,
    y: (height * percentY) / 100,
  };
}

/**
 * Get position for stacking UI elements vertically
 * Useful for creating lists or vertical menus
 * 
 * @param anchor - Base anchor position
 * @param index - Index in the stack (0, 1, 2, ...)
 * @param spacing - Space between elements (defaults to SPACING.md)
 * @param initialOffset - Initial offset from anchor point
 * @param width - Current width (defaults to SCALE_CONFIG.baseWidth)
 * @param height - Current height (defaults to SCALE_CONFIG.baseHeight)
 * @returns Position object with x and y coordinates
 */
export function getStackedPosition(
  anchor: AnchorPosition,
  index: number,
  spacing: number = SPACING.md,
  initialOffset: { x: number; y: number } = { x: 0, y: 0 },
  width: number = SCALE_CONFIG.baseWidth,
  height: number = SCALE_CONFIG.baseHeight
): { x: number; y: number } {
  const base = getAnchoredPosition(anchor, initialOffset.x, initialOffset.y, width, height);
  
  return {
    x: base.x,
    y: base.y + (index * spacing),
  };
}

/**
 * Calculate minimum touch size for mobile-friendly UI
 * Ensures buttons and interactive elements are easy to tap
 * 
 * @param size - Desired size
 * @returns Size clamped to minimum touch-friendly value (48px)
 */
export function getMinimumTouchSize(size: number): number {
  const MIN_TOUCH_SIZE = 48;
  return Math.max(size, MIN_TOUCH_SIZE);
}

/**
 * Check if current viewport is in portrait orientation
 * Useful for conditional layout adjustments
 * 
 * @param width - Current width
 * @param height - Current height
 * @returns True if portrait orientation
 */
export function isPortrait(
  width: number = SCALE_CONFIG.baseWidth,
  height: number = SCALE_CONFIG.baseHeight
): boolean {
  return height > width;
}

/**
 * Get responsive font size based on screen dimensions
 * Scales font size appropriately for different screen sizes
 * 
 * @param baseFontSize - Base font size at standard resolution
 * @param width - Current width
 * @param height - Current height
 * @returns Scaled font size
 */
export function getResponsiveFontSize(
  baseFontSize: number,
  width: number = SCALE_CONFIG.baseWidth,
  height: number = SCALE_CONFIG.baseHeight
): number {
  // Calculate scale factor based on the smaller dimension
  const minDimension = Math.min(width, height);
  const baseMinDimension = Math.min(SCALE_CONFIG.baseWidth, SCALE_CONFIG.baseHeight);
  const scaleFactor = minDimension / baseMinDimension;
  
  // Scale font size but keep it within reasonable bounds
  return Math.max(12, Math.min(baseFontSize * scaleFactor, baseFontSize * 1.5));
}
