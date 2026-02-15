/**
 * Progression System
 * ==================
 * Modular system for managing player progression across dungeon runs
 * 
 * Features:
 * - Dungeon run rewards (currency and fragment unlock chances)
 * - Difficulty scaling based on meta-progression
 * - Placeholder metrics for future expansion (XP, gold, fragments)
 * - Extensible architecture for meta-upgrades and new mechanics
 * 
 * How to Use:
 * -----------
 * 1. Create instance: const progression = new ProgressionSystem(config);
 * 2. Calculate rewards: progression.calculateRunRewards(fragmentsCollected, enemiesDefeated);
 * 3. Get difficulty: progression.getDifficultyModifiers(gamesPlayed);
 * 4. Extend: Add new mechanics via interfaces and configuration
 */

// ==================== INTERFACES ====================

/**
 * Run rewards awarded to player after completing/failing a dungeon run
 */
export interface RunReward {
  gold: number; // Currency earned during the run
  fragmentUnlockChance: number; // Chance (0-1) to unlock a map fragment for next run
  bonusGold: number; // Bonus gold based on performance
  xp: number; // Experience points (placeholder for future leveling system)
}

/**
 * Difficulty modifiers that scale with player progression
 * Applied to dungeon generation and enemy spawning
 */
export interface DifficultyModifiers {
  // Room complexity
  roomComplexity: number; // Multiplier for room size/layout complexity (1.0 = base)
  maxRooms: number; // Maximum number of rooms in dungeon
  
  // Enemy scaling
  enemyHealthMultiplier: number; // Multiplier for enemy health (1.0 = base)
  enemyDamageMultiplier: number; // Multiplier for enemy damage (1.0 = base)
  enemySpawnChance: number; // Probability of enemy spawning in a room (0-1)
  maxEnemiesPerRoom: number; // Maximum enemies per room
  
  // Fragment scarcity
  fragmentScarcity: number; // Multiplier for fragment spawn rate (lower = more scarce)
  fragmentCost: number; // Cost to purchase fragments from merchant
  
  // Rewards
  goldMultiplier: number; // Multiplier for gold rewards (1.0 = base)
}

/**
 * Progression metrics tracked across runs
 * Placeholder structure for future meta-progression features
 */
export interface ProgressionMetrics {
  // Player level and experience (placeholder)
  level: number; // Current player level (1-based)
  currentXP: number; // Current XP in this level
  xpToNextLevel: number; // XP needed for next level
  totalXP: number; // Total XP earned across all runs
  
  // Currency
  totalGoldEarned: number; // Total gold earned across all runs
  totalGoldSpent: number; // Total gold spent on purchases
  currentGold: number; // Current gold available for spending
  
  // Fragment collection
  totalFragmentsCollected: number; // Total fragments collected across all runs
  uniqueFragmentsUnlocked: number; // Unique fragment types unlocked (for variety)
  fragmentCollectionRate: number; // Average fragments per run
  
  // Meta-progression (placeholder for future features)
  unlockedRooms: string[]; // Room types unlocked (e.g., 'treasure_vault', 'boss_chamber')
  unlockedEnemies: string[]; // Enemy types unlocked (e.g., 'elite_guard', 'shadow_beast')
  unlockedPowerUps: string[]; // Power-ups unlocked (e.g., 'double_damage', 'shield')
}

/**
 * Configuration for progression system
 * All parameters have sensible defaults but can be customized
 */
export interface ProgressionConfig {
  // Reward calculation
  baseGoldPerRun?: number; // Base gold awarded per run (default: 50)
  goldPerFragment?: number; // Gold bonus per fragment collected (default: 25)
  goldPerEnemy?: number; // Gold bonus per enemy defeated (default: 10)
  fragmentUnlockBaseChance?: number; // Base chance to unlock fragment (default: 0.2)
  fragmentUnlockPerFragment?: number; // Chance increase per fragment collected (default: 0.1)
  baseXPPerRun?: number; // Base XP awarded per run (default: 100)
  xpPerFragment?: number; // XP bonus per fragment collected (default: 50)
  
  // Difficulty scaling
  difficultyScaleRate?: number; // How fast difficulty increases (default: 0.1)
  maxDifficultyMultiplier?: number; // Cap on difficulty scaling (default: 2.0)
  
  // Level progression (placeholder)
  xpCurveMultiplier?: number; // XP curve scaling (default: 1.5)
  baseXPToLevel?: number; // Base XP needed for level 2 (default: 500)
}

// ==================== DEFAULT CONFIGURATION ====================

/**
 * Default progression configuration
 * Provides balanced starting values for all systems
 */
export const DEFAULT_PROGRESSION_CONFIG: Required<ProgressionConfig> = {
  // Rewards
  baseGoldPerRun: 50,
  goldPerFragment: 25,
  goldPerEnemy: 10,
  fragmentUnlockBaseChance: 0.2,
  fragmentUnlockPerFragment: 0.1,
  baseXPPerRun: 100,
  xpPerFragment: 50,
  
  // Difficulty
  difficultyScaleRate: 0.1,
  maxDifficultyMultiplier: 2.0,
  
  // Leveling
  xpCurveMultiplier: 1.5,
  baseXPToLevel: 500,
};

// ==================== PROGRESSION SYSTEM ====================

/**
 * ProgressionSystem - Manages all progression-related mechanics
 * 
 * This class provides:
 * - Reward calculation based on run performance
 * - Difficulty scaling based on meta-progression
 * - Placeholder metrics for future features
 * 
 * Extension Points:
 * -----------------
 * 1. Add new reward types: Extend RunReward interface and calculateRunRewards()
 * 2. Add new difficulty factors: Extend DifficultyModifiers and getDifficultyModifiers()
 * 3. Add meta-upgrades: Create new interface and integrate with metrics
 * 4. Add level-based unlocks: Use ProgressionMetrics.level in unlock conditions
 */
export class ProgressionSystem {
  private config: Required<ProgressionConfig>;
  private metrics: ProgressionMetrics;
  
  constructor(config: ProgressionConfig = {}) {
    this.config = { ...DEFAULT_PROGRESSION_CONFIG, ...config };
    
    // Initialize metrics with default values
    this.metrics = this.createDefaultMetrics();
  }
  
  // ==================== REWARD CALCULATION ====================
  
  /**
   * Calculate rewards for a completed dungeon run
   * 
   * @param fragmentsCollected - Number of fragments collected in this run
   * @param enemiesDefeated - Number of enemies defeated in this run
   * @param runWon - Whether the player won (collected all fragments)
   * @returns RunReward object with all earned rewards
   * 
   * Extension: Add new parameters for other performance metrics
   * Example: roomsCleared, timeBonus, damageTaken, etc.
   */
  calculateRunRewards(
    fragmentsCollected: number,
    enemiesDefeated: number = 0,
    runWon: boolean = false
  ): RunReward {
    // Base gold from completing the run
    let gold = this.config.baseGoldPerRun;
    
    // Bonus gold from fragments
    gold += fragmentsCollected * this.config.goldPerFragment;
    
    // Bonus gold from enemies
    gold += enemiesDefeated * this.config.goldPerEnemy;
    
    // Win bonus (50% extra gold)
    const bonusGold = runWon ? Math.floor(gold * 0.5) : 0;
    gold += bonusGold;
    
    // Calculate fragment unlock chance
    // Base chance + bonus per fragment collected, capped at 90%
    const fragmentUnlockChance = Math.min(
      0.9,
      this.config.fragmentUnlockBaseChance + 
      (fragmentsCollected * this.config.fragmentUnlockPerFragment)
    );
    
    // Calculate XP
    let xp = this.config.baseXPPerRun;
    xp += fragmentsCollected * this.config.xpPerFragment;
    if (runWon) {
      xp += Math.floor(xp * 0.3); // 30% XP bonus for winning
    }
    
    return {
      gold,
      fragmentUnlockChance,
      bonusGold,
      xp,
    };
  }
  
  /**
   * Apply rewards to player's progression metrics
   * Updates all tracked stats and checks for level-ups
   * 
   * @param rewards - RunReward to apply
   * @returns Whether player leveled up
   * 
   * Extension: Add unlock logic based on level or milestones
   * Example: if (this.metrics.level === 5) unlockNewRoom();
   */
  applyRewards(rewards: RunReward): boolean {
    // Apply gold
    this.metrics.totalGoldEarned += rewards.gold;
    this.metrics.currentGold += rewards.gold;
    
    // Apply XP and check for level-up
    this.metrics.currentXP += rewards.xp;
    this.metrics.totalXP += rewards.xp;
    
    return this.checkLevelUp();
  }
  
  // ==================== DIFFICULTY SCALING ====================
  
  /**
   * Get difficulty modifiers based on player progression
   * 
   * @param gamesPlayed - Total number of games played (from meta-state)
   * @returns DifficultyModifiers to apply to dungeon generation and enemies
   * 
   * Scaling Philosophy:
   * - Gradual increase: Difficulty scales slowly to avoid frustration
   * - Multiple factors: Affects rooms, enemies, and fragments differently
   * - Capped growth: Prevents difficulty from becoming impossible
   * 
   * Extension: Add more sophisticated scaling based on:
   * - Player level instead of games played
   * - Win/loss ratio for adaptive difficulty
   * - Custom difficulty settings
   */
  getDifficultyModifiers(gamesPlayed: number): DifficultyModifiers {
    // Calculate base difficulty multiplier (increases with games played)
    // Formula: 1.0 + (games * scaleRate), capped at maxMultiplier
    const difficultyMult = Math.min(
      this.config.maxDifficultyMultiplier,
      1.0 + (gamesPlayed * this.config.difficultyScaleRate)
    );
    
    // Room complexity scaling (slower than other factors)
    // More rooms unlock gradually (5 base, up to 8 max)
    const roomComplexity = 1.0 + ((difficultyMult - 1.0) * 0.5);
    const maxRooms = Math.min(8, Math.floor(5 + (gamesPlayed * 0.3)));
    
    // Enemy scaling (health and damage increase together)
    // Enemy health: 1.0x -> 2.0x based on difficulty
    // Enemy damage: 1.0x -> 2.0x based on difficulty
    const enemyHealthMultiplier = difficultyMult;
    const enemyDamageMultiplier = difficultyMult;
    
    // Enemy spawn chance increases gradually (0.8 base -> 0.95 max)
    const enemySpawnChance = Math.min(0.95, 0.8 + (gamesPlayed * 0.015));
    
    // Max enemies per room increases (3 base -> 5 max)
    const maxEnemiesPerRoom = Math.min(5, Math.floor(3 + (gamesPlayed * 0.1)));
    
    // Fragment scarcity (fewer fragments available at higher difficulty)
    // 1.0 = normal availability, 0.5 = half as many fragments
    const fragmentScarcity = Math.max(0.5, 1.0 - ((difficultyMult - 1.0) * 0.3));
    
    // Fragment cost increases with difficulty (100 base -> 200 max)
    const fragmentCost = Math.floor(100 * difficultyMult);
    
    // Gold multiplier increases slightly to compensate for difficulty
    // Ensures players can still afford fragments despite higher costs
    const goldMultiplier = 1.0 + ((difficultyMult - 1.0) * 0.5);
    
    return {
      roomComplexity,
      maxRooms,
      enemyHealthMultiplier,
      enemyDamageMultiplier,
      enemySpawnChance,
      maxEnemiesPerRoom,
      fragmentScarcity,
      fragmentCost,
      goldMultiplier,
    };
  }
  
  // ==================== PROGRESSION METRICS ====================
  
  /**
   * Get current progression metrics
   * @returns Immutable copy of metrics
   */
  getMetrics(): Readonly<ProgressionMetrics> {
    return { ...this.metrics };
  }
  
  /**
   * Update specific metrics
   * Use for tracking fragments collected, gold spent, etc.
   * 
   * @param updates - Partial metrics to update
   * @param gamesPlayed - Optional: Total games played for accurate fragment rate calculation
   * 
   * Extension: Add validation or triggers for specific updates
   * Example: Check for achievement unlocks when updating metrics
   */
  updateMetrics(updates: Partial<ProgressionMetrics>, gamesPlayed?: number): void {
    this.metrics = { ...this.metrics, ...updates };
    
    // Recalculate fragment collection rate if fragments were updated
    if (updates.totalFragmentsCollected !== undefined && gamesPlayed !== undefined && gamesPlayed > 0) {
      this.metrics.fragmentCollectionRate = 
        this.metrics.totalFragmentsCollected / gamesPlayed;
    }
  }
  
  /**
   * Record gold spent on purchases
   * Useful for tracking economy and balancing costs
   * 
   * @param amount - Amount of gold spent
   */
  spendGold(amount: number): boolean {
    if (this.metrics.currentGold < amount) {
      return false;
    }
    this.metrics.currentGold -= amount;
    this.metrics.totalGoldSpent += amount;
    return true;
  }
  
  /**
   * Check for level-up based on current XP
   * @returns Whether player leveled up
   * 
   * Extension: Add level-up rewards or unlocks
   * Example: Grant skill points, unlock new abilities, etc.
   */
  private checkLevelUp(): boolean {
    let leveledUp = false;
    
    while (this.metrics.currentXP >= this.metrics.xpToNextLevel) {
      // Level up!
      this.metrics.currentXP -= this.metrics.xpToNextLevel;
      this.metrics.level++;
      leveledUp = true;
      
      // Calculate XP needed for next level (exponential curve)
      this.metrics.xpToNextLevel = Math.floor(
        this.config.baseXPToLevel * 
        Math.pow(this.config.xpCurveMultiplier, this.metrics.level - 1)
      );
      
      // Extension point: Add level-up rewards here
      // Example:
      // this.unlockRewardForLevel(this.metrics.level);
      // this.grantSkillPoints(1);
    }
    
    return leveledUp;
  }
  
  /**
   * Create default progression metrics
   * @returns Fresh metrics for a new player
   */
  private createDefaultMetrics(): ProgressionMetrics {
    return {
      // Level system (placeholder)
      level: 1,
      currentXP: 0,
      xpToNextLevel: this.config.baseXPToLevel,
      totalXP: 0,
      
      // Currency
      totalGoldEarned: 0,
      totalGoldSpent: 0,
      currentGold: 0,
      
      // Fragments
      totalFragmentsCollected: 0,
      uniqueFragmentsUnlocked: 0,
      fragmentCollectionRate: 0,
      
      // Unlocks (placeholder for future features)
      unlockedRooms: [],
      unlockedEnemies: [],
      unlockedPowerUps: [],
    };
  }
  
  /**
   * Reset metrics to default (for new game+ or testing)
   */
  resetMetrics(): void {
    this.metrics = this.createDefaultMetrics();
  }
  
  // ==================== EXTENSION EXAMPLES ====================
  
  /**
   * Example: Unlock a new room type based on progression
   * This is a placeholder showing how to extend the system
   * 
   * To implement:
   * 1. Define room types in a separate enum/config
   * 2. Check unlock conditions (level, achievements, etc.)
   * 3. Add to unlockedRooms array
   * 4. Use in dungeon generation to include new room types
   * 
   * @param roomType - Identifier for the room type
   */
  unlockRoom(roomType: string): boolean {
    if (this.metrics.unlockedRooms.includes(roomType)) {
      return false; // Already unlocked
    }
    
    this.metrics.unlockedRooms.push(roomType);
    return true;
  }
  
  /**
   * Example: Unlock a new enemy type based on progression
   * This is a placeholder showing how to extend the system
   * 
   * To implement:
   * 1. Define enemy types in a separate enum/config
   * 2. Check unlock conditions
   * 3. Add to unlockedEnemies array
   * 4. Use in enemy spawner to include new enemy types
   * 
   * @param enemyType - Identifier for the enemy type
   */
  unlockEnemy(enemyType: string): boolean {
    if (this.metrics.unlockedEnemies.includes(enemyType)) {
      return false; // Already unlocked
    }
    
    this.metrics.unlockedEnemies.push(enemyType);
    return true;
  }
  
  /**
   * Example: Unlock a power-up for future runs
   * This is a placeholder showing how to extend the system
   * 
   * To implement:
   * 1. Define power-up types in a separate enum/config
   * 2. Check unlock conditions (cost, level, achievements)
   * 3. Add to unlockedPowerUps array
   * 4. Apply power-up effects in game logic
   * 
   * @param powerUpType - Identifier for the power-up
   */
  unlockPowerUp(powerUpType: string): boolean {
    if (this.metrics.unlockedPowerUps.includes(powerUpType)) {
      return false; // Already unlocked
    }
    
    this.metrics.unlockedPowerUps.push(powerUpType);
    return true;
  }
  
  /**
   * Example: Check if a specific unlock is available
   * Useful for UI and unlock hints
   * 
   * @param unlockType - Type of unlock ('room', 'enemy', 'powerup')
   * @param identifier - Specific unlock identifier
   */
  isUnlocked(unlockType: 'room' | 'enemy' | 'powerup', identifier: string): boolean {
    switch (unlockType) {
      case 'room':
        return this.metrics.unlockedRooms.includes(identifier);
      case 'enemy':
        return this.metrics.unlockedEnemies.includes(identifier);
      case 'powerup':
        return this.metrics.unlockedPowerUps.includes(identifier);
      default:
        return false;
    }
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate XP needed for a specific level
 * Useful for UI and progression planning
 * 
 * @param level - Target level
 * @param config - Progression configuration
 * @returns Total XP needed to reach the level
 */
export function calculateXPForLevel(
  level: number, 
  config: ProgressionConfig = {}
): number {
  const fullConfig = { ...DEFAULT_PROGRESSION_CONFIG, ...config };
  let totalXP = 0;
  
  for (let i = 1; i < level; i++) {
    totalXP += Math.floor(
      fullConfig.baseXPToLevel * 
      Math.pow(fullConfig.xpCurveMultiplier, i - 1)
    );
  }
  
  return totalXP;
}

/**
 * Estimate difficulty for a given number of games played
 * Useful for displaying difficulty tier to player
 * 
 * @param gamesPlayed - Number of games played
 * @param config - Progression configuration
 * @returns Difficulty tier (1-5)
 */
export function estimateDifficultyTier(
  gamesPlayed: number,
  config: ProgressionConfig = {}
): number {
  const fullConfig = { ...DEFAULT_PROGRESSION_CONFIG, ...config };
  const difficultyMult = Math.min(
    fullConfig.maxDifficultyMultiplier,
    1.0 + (gamesPlayed * fullConfig.difficultyScaleRate)
  );
  
  // Map difficulty multiplier to tier (1-5)
  if (difficultyMult <= 1.2) return 1; // Easy
  if (difficultyMult <= 1.4) return 2; // Normal
  if (difficultyMult <= 1.6) return 3; // Hard
  if (difficultyMult <= 1.8) return 4; // Very Hard
  return 5; // Extreme
}

/**
 * Get a formatted difficulty name for display
 * 
 * @param tier - Difficulty tier (1-5, values outside this range are clamped)
 * @returns Human-readable difficulty name
 */
export function getDifficultyName(tier: number): string {
  const names = ['Easy', 'Normal', 'Hard', 'Very Hard', 'Extreme'];
  // Clamp tier to valid range (1-5) to prevent invalid array access
  const clampedTier = Math.max(1, Math.min(5, tier));
  return names[clampedTier - 1];
}
