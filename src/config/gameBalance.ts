/**
 * Game Balance Configuration
 * Tunable parameters for gameplay mechanics
 */

export const GameBalance = {
  // Digging System
  DIG_DAMAGE: 15, // Damage taken for wrong dig location
  TREASURE_MIN_DISTANCE_FROM_SPAWN: 300, // Minimum distance from spawn point (pixels)
  DIG_COOLDOWN_MS: 1000, // Cooldown between dig attempts (milliseconds)
} as const;
