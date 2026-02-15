/**
 * Progression System
 * 
 * Manages dungeon level progression and difficulty scaling.
 * Tracks current level, win/loss records, and provides difficulty parameters.
 */

import { getScalingFactor, getMaxEnemiesPerRoom } from '../config/enemyBalance';

/**
 * Progression state stored across runs
 */
export interface ProgressionState {
  currentLevel: number; // Current dungeon level (1, 2, 3, ...)
  highestLevelReached: number; // Highest level ever reached
  totalRuns: number; // Total number of runs
  totalWins: number; // Total number of wins
  totalLosses: number; // Total number of losses
  consecutiveWins: number; // Current win streak
  consecutiveLosses: number; // Current loss streak
}

/**
 * Default progression state
 */
const DEFAULT_STATE: ProgressionState = {
  currentLevel: 1,
  highestLevelReached: 1,
  totalRuns: 0,
  totalWins: 0,
  totalLosses: 0,
  consecutiveWins: 0,
  consecutiveLosses: 0,
};

/**
 * Progression System Manager
 */
export class ProgressionSystem {
  private state: ProgressionState;
  private storageKey: string = 'kwak_progression_state';

  constructor() {
    this.state = this.loadState();
  }

  /**
   * Load progression state from localStorage
   */
  private loadState(): ProgressionState {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate loaded data
        return {
          ...DEFAULT_STATE,
          ...parsed,
        };
      }
    } catch (error) {
      console.error('Failed to load progression state:', error);
    }
    return { ...DEFAULT_STATE };
  }

  /**
   * Save progression state to localStorage
   */
  private saveState(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save progression state:', error);
    }
  }

  /**
   * Get current dungeon level
   */
  getCurrentLevel(): number {
    return this.state.currentLevel;
  }

  /**
   * Get full progression state
   */
  getState(): Readonly<ProgressionState> {
    return { ...this.state };
  }

  /**
   * Record a win and advance to next level
   */
  recordWin(): void {
    this.state.totalRuns++;
    this.state.totalWins++;
    this.state.consecutiveWins++;
    this.state.consecutiveLosses = 0;

    // Advance to next level
    this.state.currentLevel++;
    
    // Update highest level reached
    if (this.state.currentLevel > this.state.highestLevelReached) {
      this.state.highestLevelReached = this.state.currentLevel;
    }

    this.saveState();
  }

  /**
   * Record a loss and reset to level 1
   */
  recordLoss(): void {
    this.state.totalRuns++;
    this.state.totalLosses++;
    this.state.consecutiveLosses++;
    this.state.consecutiveWins = 0;

    // Reset to level 1 on loss
    this.state.currentLevel = 1;

    this.saveState();
  }

  /**
   * Manually set current level (for testing or admin purposes)
   */
  setLevel(level: number): void {
    this.state.currentLevel = Math.max(1, level);
    if (this.state.currentLevel > this.state.highestLevelReached) {
      this.state.highestLevelReached = this.state.currentLevel;
    }
    this.saveState();
  }

  /**
   * Reset progression to initial state
   */
  reset(): void {
    this.state = { ...DEFAULT_STATE };
    this.saveState();
  }

  /**
   * Get difficulty parameters for current level
   * Returns scaled values for enemy stats, spawn rates, etc.
   */
  getDifficultyParams(): {
    level: number;
    enemyHealthMultiplier: number;
    enemyDamageMultiplier: number;
    enemySpeedMultiplier: number;
    enemyCountMultiplier: number;
    maxEnemiesPerRoom: number;
    fragmentRarityBonus: number;
  } {
    const scaling = getScalingFactor(this.state.currentLevel);
    
    return {
      level: this.state.currentLevel,
      enemyHealthMultiplier: scaling.health,
      enemyDamageMultiplier: scaling.damage,
      enemySpeedMultiplier: scaling.speed,
      enemyCountMultiplier: scaling.count,
      maxEnemiesPerRoom: getMaxEnemiesPerRoom(this.state.currentLevel),
      
      // Fragment rarity increases with level
      // Higher levels make fragments more common
      fragmentRarityBonus: Math.min(0.2, (this.state.currentLevel - 1) * 0.05),
    };
  }

  /**
   * Get statistics for display
   */
  getStatistics(): {
    winRate: number; // 0-100
    totalRuns: number;
    bestStreak: number;
    currentStreak: number;
    highestLevel: number;
  } {
    const winRate = this.state.totalRuns > 0
      ? (this.state.totalWins / this.state.totalRuns) * 100
      : 0;

    return {
      winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
      totalRuns: this.state.totalRuns,
      bestStreak: this.state.consecutiveWins,
      currentStreak: this.state.consecutiveWins,
      highestLevel: this.state.highestLevelReached,
    };
  }

  /**
   * Export progression state for debugging
   */
  export(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import progression state from JSON
   */
  import(jsonState: string): boolean {
    try {
      const parsed = JSON.parse(jsonState);
      this.state = {
        ...DEFAULT_STATE,
        ...parsed,
      };
      this.saveState();
      return true;
    } catch (error) {
      console.error('Failed to import progression state:', error);
      return false;
    }
  }
}

/**
 * Global progression system instance
 */
export const progressionSystem = new ProgressionSystem();
