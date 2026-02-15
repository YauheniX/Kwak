/**
 * Enemy Balance Configuration
 * 
 * Defines enemy types, stats, and scaling formulas.
 * All enemy stats are configurable and separate from game logic.
 */

/**
 * Enemy type classification
 */
export enum EnemyType {
  WEAK = 'WEAK',
  FAST = 'FAST',
  TANK = 'TANK',
}

/**
 * Base stats for each enemy type
 */
export interface EnemyStats {
  type: EnemyType;
  maxHealth: number;
  currentHealth: number;
  damage: number;
  speed: number;
  size: number;
  color: number;
  chaseDistance: number;
  patrolRange: number;
}

/**
 * Enemy type definitions with base stats
 */
export const ENEMY_BASE_STATS: Record<EnemyType, Omit<EnemyStats, 'currentHealth'>> = {
  [EnemyType.WEAK]: {
    type: EnemyType.WEAK,
    maxHealth: 30,
    damage: 5,
    speed: 80,
    size: 12,
    color: 0xff6b6b, // Light red
    chaseDistance: 250,
    patrolRange: 80,
  },
  
  [EnemyType.FAST]: {
    type: EnemyType.FAST,
    maxHealth: 20,
    damage: 8,
    speed: 150,
    size: 10,
    color: 0xffd93d, // Yellow
    chaseDistance: 350,
    patrolRange: 120,
  },
  
  [EnemyType.TANK]: {
    type: EnemyType.TANK,
    maxHealth: 80,
    damage: 15,
    speed: 60,
    size: 18,
    color: 0x6c5ce7, // Purple
    chaseDistance: 200,
    patrolRange: 60,
  },
};

/**
 * Get enemy stats for a specific type at a given level
 * @param type Enemy type
 * @param level Dungeon level (1, 2, 3, ...)
 * @returns Scaled enemy stats
 */
export function getEnemyStats(type: EnemyType, level: number = 1): EnemyStats {
  const baseStats = ENEMY_BASE_STATS[type];
  const scalingFactor = getScalingFactor(level);
  
  return {
    ...baseStats,
    maxHealth: Math.floor(baseStats.maxHealth * scalingFactor.health),
    currentHealth: Math.floor(baseStats.maxHealth * scalingFactor.health),
    damage: Math.floor(baseStats.damage * scalingFactor.damage),
    speed: Math.floor(baseStats.speed * scalingFactor.speed),
  };
}

/**
 * Difficulty scaling factors per level
 * @param level Dungeon level
 * @returns Scaling multipliers for enemy stats
 */
export function getScalingFactor(level: number): {
  health: number;
  damage: number;
  speed: number;
  count: number;
} {
  // Level 1 = base stats (1.0x)
  // Each additional level increases difficulty
  const levelMultiplier = Math.max(1, level);
  
  return {
    // Health scales significantly with level
    health: 1 + (levelMultiplier - 1) * 0.3, // +30% per level
    
    // Damage scales moderately
    damage: 1 + (levelMultiplier - 1) * 0.2, // +20% per level
    
    // Speed scales slightly
    speed: 1 + (levelMultiplier - 1) * 0.1, // +10% per level
    
    // Enemy count increases
    count: 1 + (levelMultiplier - 1) * 0.25, // +25% per level
  };
}

/**
 * Get random enemy type based on dungeon level
 * Higher levels have higher chance of stronger enemies
 * @param level Dungeon level
 * @returns Random enemy type
 */
export function getRandomEnemyType(level: number = 1): EnemyType {
  const rand = Math.random() * 100;
  
  // Level 1: 60% weak, 30% fast, 10% tank
  // Level 2: 40% weak, 40% fast, 20% tank
  // Level 3+: 20% weak, 40% fast, 40% tank
  
  if (level === 1) {
    if (rand < 60) return EnemyType.WEAK;
    if (rand < 90) return EnemyType.FAST;
    return EnemyType.TANK;
  } else if (level === 2) {
    if (rand < 40) return EnemyType.WEAK;
    if (rand < 80) return EnemyType.FAST;
    return EnemyType.TANK;
  } else {
    if (rand < 20) return EnemyType.WEAK;
    if (rand < 60) return EnemyType.FAST;
    return EnemyType.TANK;
  }
}

/**
 * Get max enemies per room based on dungeon level
 * @param level Dungeon level
 * @returns Maximum number of enemies that can spawn in a room
 */
export function getMaxEnemiesPerRoom(level: number = 1): number {
  const baseCount = 3;
  const scalingFactor = getScalingFactor(level);
  return Math.floor(baseCount * scalingFactor.count);
}

/**
 * Health bar configuration
 */
export const HEALTH_BAR_CONFIG = {
  width: 30,
  height: 4,
  offsetY: -25, // Above enemy
  backgroundColor: 0x000000,
  backgroundAlpha: 0.5,
  borderColor: 0xffffff,
  borderWidth: 1,
  healthColor: 0x00ff00, // Green
  lowHealthColor: 0xff0000, // Red
  lowHealthThreshold: 0.3, // 30%
} as const;

/**
 * Floating damage number configuration
 */
export const DAMAGE_NUMBER_CONFIG = {
  fontSize: '16px',
  fontColor: '#ff0000',
  fontStyle: 'bold',
  floatDistance: 40, // Pixels to float upward
  duration: 1000, // Milliseconds
  fadeDelay: 500, // Start fading after this time
} as const;
