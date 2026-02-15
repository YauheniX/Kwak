/**
 * Save Manager
 * Modular save system with separation of run-state and meta-state
 * Uses localStorage with TypeScript type safety
 */

// ==================== INTERFACES ====================

/**
 * Run State - Temporary data for current dungeon run
 * Cleared when player dies or completes the run
 */
export interface RunState {
  // Current dungeon data
  dungeonSeed?: number;
  currentRoomId?: number;
  
  // Player temporary stats
  playerPosition?: { x: number; y: number };
  playerHealth?: number;
  
  // Current run fragments
  collectedFragmentIds: number[];
  totalFragmentsInRun: number;
  
  // Currency for current run
  gold: number;
  
  // Treasure digging
  treasureTile?: { x: number; y: number; tileX: number; tileY: number };
  
  // Run timestamp
  runStartTime: number;
}

/**
 * Meta State - Persistent player data
 * Persists across runs and game sessions
 */
export interface MetaState {
  // Player persistent currency
  permanentCurrency: number;
  
  // Unlocked items/upgrades
  unlockedItems: string[];
  unlockedUpgrades: string[];
  
  // Persistent stats
  gamesPlayed: number;
  gamesWon: number;
  totalFragmentsCollected: number;
  highestFragmentsInOneRun: number;
  totalGoldEarned: number;
  totalDeaths: number;
  
  // Achievement tracking
  achievements: string[];
  
  // Preferences
  lastPlayedTimestamp: number;
}

// ==================== STORAGE KEYS ====================

const STORAGE_KEYS = {
  RUN_STATE: 'kwak_run_state',
  META_STATE: 'kwak_meta_state',
} as const;

// ==================== DEFAULT STATES ====================

/**
 * Default run state for new runs
 */
export const DEFAULT_RUN_STATE: RunState = {
  collectedFragmentIds: [],
  totalFragmentsInRun: 0,
  gold: 150, // Starting gold
  runStartTime: Date.now(),
};

/**
 * Default meta state for new players
 */
export const DEFAULT_META_STATE: MetaState = {
  permanentCurrency: 0,
  unlockedItems: [],
  unlockedUpgrades: [],
  gamesPlayed: 0,
  gamesWon: 0,
  totalFragmentsCollected: 0,
  highestFragmentsInOneRun: 0,
  totalGoldEarned: 0,
  totalDeaths: 0,
  achievements: [],
  lastPlayedTimestamp: Date.now(),
};

// ==================== SERIALIZATION HELPERS ====================

/**
 * Serialize data to JSON string with error handling
 */
function serialize<T>(data: T): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to serialize data:', error);
    throw new Error('Serialization failed');
  }
}

/**
 * Deserialize JSON string to typed object with validation
 */
function deserialize<T>(jsonString: string, defaultValue: T): T {
  try {
    const parsed = JSON.parse(jsonString);
    // Basic validation - ensure parsed is an object
    if (typeof parsed !== 'object' || parsed === null) {
      console.warn('Invalid data format, using default');
      return defaultValue;
    }
    return parsed as T;
  } catch (error) {
    console.error('Failed to deserialize data:', error);
    return defaultValue;
  }
}

// ==================== SAVE MANAGER CLASS ====================

/**
 * SaveManager - Centralized save system
 * Handles both run-state and meta-state with modular API
 */
export class SaveManager {
  private runState: RunState;
  private metaState: MetaState;

  constructor() {
    // Load both states on initialization
    this.runState = this.loadRunState();
    this.metaState = this.loadMetaState();
  }

  // ==================== RUN STATE METHODS ====================

  /**
   * Save current run state to localStorage
   */
  saveRunState(): void {
    try {
      const serialized = serialize(this.runState);
      localStorage.setItem(STORAGE_KEYS.RUN_STATE, serialized);
    } catch (error) {
      console.error('Failed to save run state:', error);
    }
  }

  /**
   * Load run state from localStorage
   * Returns default state if not found or invalid
   */
  loadRunState(): RunState {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RUN_STATE);
      if (!stored) {
        return { ...DEFAULT_RUN_STATE };
      }
      return deserialize(stored, DEFAULT_RUN_STATE);
    } catch (error) {
      console.error('Failed to load run state:', error);
      return { ...DEFAULT_RUN_STATE };
    }
  }

  /**
   * Get current run state (immutable copy)
   */
  getRunState(): Readonly<RunState> {
    return { ...this.runState };
  }

  /**
   * Update run state with partial data
   */
  updateRunState(updates: Partial<RunState>): void {
    this.runState = { ...this.runState, ...updates };
    this.saveRunState();
  }

  /**
   * Reset run state to default (for new run)
   */
  resetRun(): void {
    this.runState = { ...DEFAULT_RUN_STATE, runStartTime: Date.now() };
    this.saveRunState();
  }

  // ==================== META STATE METHODS ====================

  /**
   * Save meta state to localStorage
   */
  saveMetaState(): void {
    try {
      const serialized = serialize(this.metaState);
      localStorage.setItem(STORAGE_KEYS.META_STATE, serialized);
    } catch (error) {
      console.error('Failed to save meta state:', error);
    }
  }

  /**
   * Load meta state from localStorage
   * Returns default state if not found or invalid
   */
  loadMetaState(): MetaState {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.META_STATE);
      if (!stored) {
        return { ...DEFAULT_META_STATE };
      }
      return deserialize(stored, DEFAULT_META_STATE);
    } catch (error) {
      console.error('Failed to load meta state:', error);
      return { ...DEFAULT_META_STATE };
    }
  }

  /**
   * Get current meta state (immutable copy)
   */
  getMetaState(): Readonly<MetaState> {
    return { ...this.metaState };
  }

  /**
   * Update meta state with partial data
   */
  updateMetaState(updates: Partial<MetaState>): void {
    this.metaState = { ...this.metaState, ...updates };
    this.saveMetaState();
  }

  /**
   * Reset meta state to default (complete wipe)
   */
  resetMeta(): void {
    this.metaState = { ...DEFAULT_META_STATE, lastPlayedTimestamp: Date.now() };
    this.saveMetaState();
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Record a new game start
   */
  recordGameStart(): void {
    this.updateMetaState({
      gamesPlayed: this.metaState.gamesPlayed + 1,
      lastPlayedTimestamp: Date.now(),
    });
  }

  /**
   * Record a game win with fragments collected
   */
  recordGameWon(fragmentsCollected: number): void {
    const updates: Partial<MetaState> = {
      gamesWon: this.metaState.gamesWon + 1,
      totalFragmentsCollected: this.metaState.totalFragmentsCollected + fragmentsCollected,
    };

    if (fragmentsCollected > this.metaState.highestFragmentsInOneRun) {
      updates.highestFragmentsInOneRun = fragmentsCollected;
    }

    this.updateMetaState(updates);
  }

  /**
   * Record a game loss with fragments collected
   */
  recordGameLost(fragmentsCollected: number): void {
    const updates: Partial<MetaState> = {
      totalFragmentsCollected: this.metaState.totalFragmentsCollected + fragmentsCollected,
      totalDeaths: this.metaState.totalDeaths + 1,
    };

    if (fragmentsCollected > this.metaState.highestFragmentsInOneRun) {
      updates.highestFragmentsInOneRun = fragmentsCollected;
    }

    this.updateMetaState(updates);
  }

  /**
   * Add gold to current run
   */
  addGold(amount: number): void {
    if (amount <= 0) {
      console.warn('addGold called with non-positive amount:', amount);
      return;
    }
    this.updateRunState({
      gold: this.runState.gold + amount,
    });
  }

  /**
   * Remove gold from current run
   * @returns true if successful, false if insufficient funds
   */
  removeGold(amount: number): boolean {
    if (amount <= 0) {
      console.warn('removeGold called with non-positive amount:', amount);
      return false;
    }
    if (this.runState.gold < amount) {
      return false;
    }
    this.updateRunState({
      gold: this.runState.gold - amount,
    });
    return true;
  }

  /**
   * Check if player can afford an item
   */
  canAfford(cost: number): boolean {
    return this.runState.gold >= cost;
  }

  /**
   * Collect a fragment in current run
   */
  collectFragment(fragmentId: number): void {
    if (!this.runState.collectedFragmentIds.includes(fragmentId)) {
      this.updateRunState({
        collectedFragmentIds: [...this.runState.collectedFragmentIds, fragmentId],
      });
    }
  }

  /**
   * Get number of fragments collected in current run
   */
  getCollectedFragmentsCount(): number {
    return this.runState.collectedFragmentIds.length;
  }

  /**
   * Check if all fragments are collected in current run
   */
  areAllFragmentsCollected(): boolean {
    return (
      this.runState.totalFragmentsInRun > 0 &&
      this.runState.collectedFragmentIds.length >= this.runState.totalFragmentsInRun
    );
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clear all save data (both run and meta)
   * USE WITH CAUTION - This wipes everything
   */
  clearAllData(): void {
    this.resetRun();
    this.resetMeta();
    localStorage.removeItem(STORAGE_KEYS.RUN_STATE);
    localStorage.removeItem(STORAGE_KEYS.META_STATE);
  }

  /**
   * Export save data as JSON string (for backup/sync)
   */
  exportSaveData(): string {
    return serialize({
      runState: this.runState,
      metaState: this.metaState,
      version: '1.0.0',
      exportedAt: Date.now(),
    });
  }

  /**
   * Import save data from JSON string (for restore/sync)
   */
  importSaveData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.runState) {
        this.runState = data.runState;
        this.saveRunState();
      }
      if (data.metaState) {
        this.metaState = data.metaState;
        this.saveMetaState();
      }
      return true;
    } catch (error) {
      console.error('Failed to import save data:', error);
      return false;
    }
  }
}

// ==================== SINGLETON INSTANCE ====================

/**
 * Global singleton instance of SaveManager
 * Use this for consistent save state across the application
 */
export const saveManager = new SaveManager();
