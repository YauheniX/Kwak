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
  
  // FIT mode: scales game to fit screen while maintaining aspect ratio
  scaleMode: Phaser.Scale.FIT,
  
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
export function getUISafeArea(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  return {
    top: 16,
    bottom: 100, // Extra space for touch controls
    left: 16,
    right: 16,
  };
}

/**
 * Get touch control positions for mobile
 * Returns positions for joystick and action buttons
 */
export function getTouchControlPositions(): {
  joystick: { x: number; y: number };
  actionButton: { x: number; y: number };
  digButton: { x: number; y: number };
} {
  const safeArea = getUISafeArea();
  
  return {
    // Left side joystick
    joystick: {
      x: 100,
      y: SCALE_CONFIG.baseHeight - safeArea.bottom - 20,
    },
    
    // Right side action button
    actionButton: {
      x: SCALE_CONFIG.baseWidth - 100,
      y: SCALE_CONFIG.baseHeight - safeArea.bottom - 20,
    },
    
    // Right side dig button (above action button)
    digButton: {
      x: SCALE_CONFIG.baseWidth - 100,
      y: SCALE_CONFIG.baseHeight - safeArea.bottom - 100,
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
} as const;
