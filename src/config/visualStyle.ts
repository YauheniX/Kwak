/**
 * Visual Style Configuration for Kwak
 * Pirate-Fantasy Theme
 * 
 * Theme: Pirate fantasy dungeon exploration
 * Mood: Light adventure, mysterious treasure hunt
 * Avoid dark horror tones; keep casual accessibility
 */

/**
 * Color Palette
 * Pirate-fantasy themed colors for consistent visual identity
 */
export const Colors = {
  // Primary palette
  deepOceanBlue: '#1F3C88',
  tropicalTeal: '#008E89',
  sandBeige: '#E6C79C',
  treasureGold: '#F4B400',
  emeraldGreen: '#2ECC71',
  crimsonAccent: '#B33939',
  darkWoodBrown: '#4B2E2B',

  // Semantic colors
  reward: '#F4B400', // Treasure Gold - for rewards and fragments
  rewardAccent: '#2ECC71', // Emerald Green - for reward highlights
  background: '#1F3C88', // Deep Ocean Blue
  surface: '#4B2E2B', // Dark Wood Brown - for panels and surfaces
  text: '#E6C79C', // Sand Beige - for readable text
  textDark: '#4B2E2B', // Dark Wood Brown - for text on light backgrounds
  accent: '#008E89', // Tropical Teal - for interactive elements
  danger: '#B33939', // Crimson Accent - for warnings and damage

  // UI specific colors
  healthFull: '#2ECC71', // Emerald Green
  healthLow: '#B33939', // Crimson Accent
  healthBackground: '#4B2E2B', // Dark Wood Brown
  fragmentCollected: '#F4B400', // Treasure Gold
  fragmentUncollected: '#E6C79C', // Sand Beige with low opacity
  fragmentPurchasable: '#008E89', // Tropical Teal

  // Environment colors
  wallColor: '#4B2E2B', // Dark Wood Brown
  floorColor: '#E6C79C', // Sand Beige
  enemyColor: '#7D3C98', // Muted purple
  treasureChest: '#F4B400', // Treasure Gold
  treasureChestAccent: '#B33939', // Crimson Accent
} as const;

/**
 * Color Palette in numeric format for Phaser
 */
export const ColorNumbers = {
  deepOceanBlue: 0x1f3c88,
  tropicalTeal: 0x008e89,
  sandBeige: 0xe6c79c,
  treasureGold: 0xf4b400,
  emeraldGreen: 0x2ecc71,
  crimsonAccent: 0xb33939,
  darkWoodBrown: 0x4b2e2b,

  // Semantic colors
  reward: 0xf4b400,
  rewardAccent: 0x2ecc71,
  background: 0x1f3c88,
  surface: 0x4b2e2b,
  accent: 0x008e89,
  danger: 0xb33939,

  // UI specific
  healthFull: 0x2ecc71,
  healthLow: 0xb33939,
  fragmentCollected: 0xf4b400,
  fragmentUncollected: 0xe6c79c,
  fragmentPurchasable: 0x008e89,

  // Environment
  wallColor: 0x4b2e2b,
  floorColor: 0xe6c79c,
  enemyColor: 0x7d3c98,
  treasureChest: 0xf4b400,
  treasureChestAccent: 0xb33939,
} as const;

/**
 * UI Sizing System
 * Based on 8px grid system for consistent spacing
 */
export const Spacing = {
  xs: 4, // 0.5 grid units
  sm: 8, // 1 grid unit
  md: 16, // 2 grid units
  lg: 24, // 3 grid units
  xl: 32, // 4 grid units
  xxl: 48, // 6 grid units
  xxxl: 64, // 8 grid units
} as const;

/**
 * Typography Configuration
 * Fantasy-style font for headers, simple sans-serif for body text
 */
export const Typography = {
  // Font families
  headerFont: 'Arial Black, sans-serif', // Will be replaced with fantasy font when assets are added
  bodyFont: 'Arial, sans-serif',
  uiFont: 'Arial, sans-serif',

  // Font sizes (based on 8px grid)
  fontSize: {
    tiny: 12,
    small: 14,
    body: 16, // 2 grid units
    large: 20,
    title: 24, // 3 grid units
    hero: 32, // 4 grid units
    mega: 48, // 6 grid units
    giant: 64, // 8 grid units
  },

  // Font weights
  weight: {
    normal: 'normal',
    bold: 'bold',
  },
} as const;

/**
 * UI Component Sizing
 * Minimum touch-friendly sizes and consistent dimensions
 */
export const ComponentSize = {
  // Button sizing
  buttonMinHeight: 48, // Minimum touch size
  buttonPadding: {
    x: 16,
    y: 12,
  },

  // Icon sizes
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,

  // Fragment indicators
  fragmentIndicatorSize: 12,
  fragmentIndicatorSpacing: 20,

  // Health bar
  healthBarWidth: 200,
  healthBarHeight: 24,

  // HUD positioning
  hudPadding: 16,
} as const;

/**
 * Animation Configuration
 */
export const Animation = {
  // Duration in milliseconds
  fast: 200,
  normal: 400,
  slow: 600,

  // Easing
  easeDefault: 'Quad.easeOut',
  easeSmooth: 'Sine.easeInOut',
  easeBounce: 'Bounce.easeOut',
} as const;

/**
 * Fragment Visual Configuration
 */
export const FragmentVisual = {
  // Size and appearance
  size: 12,
  glowSize: 16,
  glowAlpha: 0.4,

  // Parchment fragment styling
  parchmentColor: Colors.sandBeige,
  parchmentBorder: Colors.darkWoodBrown,
  treasureMarkColor: Colors.treasureGold,

  // Animation
  pulseSpeed: 1000, // milliseconds
  collectGlowDuration: 600,
  combineDuration: 800,
} as const;

/**
 * Treasure Chest Visual Configuration
 */
export const TreasureChestVisual = {
  size: 32,
  mainColor: ColorNumbers.treasureChest,
  accentColor: ColorNumbers.treasureChestAccent,
  glowColor: ColorNumbers.treasureGold,
  glowAlpha: 0.3,
} as const;

/**
 * Button State Styling
 */
export const ButtonStyle = {
  // Normal state
  normal: {
    backgroundColor: Colors.darkWoodBrown,
    textColor: Colors.sandBeige,
    borderColor: Colors.darkWoodBrown,
  },

  // Hover state
  hover: {
    backgroundColor: Colors.darkWoodBrown,
    textColor: Colors.treasureGold,
    borderColor: Colors.treasureGold,
  },

  // Pressed state
  pressed: {
    backgroundColor: '#3a221f', // Darker wood tone
    textColor: Colors.sandBeige,
    borderColor: Colors.darkWoodBrown,
  },

  // Disabled state
  disabled: {
    backgroundColor: '#6b4e4a',
    textColor: '#a08d84',
    borderColor: '#6b4e4a',
  },
} as const;

/**
 * HUD Layout Configuration
 */
export const HudLayout = {
  // Top Left - Health and Gold
  topLeft: {
    x: Spacing.md,
    y: Spacing.md,
    spacing: Spacing.sm,
  },

  // Top Right - Fragment Tracker
  topRight: {
    x: -Spacing.md,
    y: Spacing.md,
    spacing: Spacing.sm,
  },

  // Bottom Left - Virtual Joystick
  bottomLeft: {
    x: Spacing.xl,
    y: -Spacing.xl,
    size: 100,
    alpha: 0.5,
  },

  // Bottom Right - Action Button
  bottomRight: {
    x: -Spacing.xl,
    y: -Spacing.xl,
    size: 64,
  },
} as const;

/**
 * Visual Style Export
 * All visual configuration in one convenient object
 */
export const VisualStyle = {
  Colors,
  ColorNumbers,
  Spacing,
  Typography,
  ComponentSize,
  Animation,
  FragmentVisual,
  TreasureChestVisual,
  ButtonStyle,
  HudLayout,
} as const;

export default VisualStyle;
