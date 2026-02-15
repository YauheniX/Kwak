# Core Module

This directory contains core game systems that are fundamental to the game architecture.

## SaveManager

The `saveManager.ts` module provides a modular save system with clear separation between run-state and meta-state.

### Architecture

#### Run State (Temporary)
- Current dungeon/run data
- Player position and health
- Collected fragments in current run
- Gold for current run
- Run timestamp

**Reset on:** Game over, new game, victory

#### Meta State (Persistent)
- Player progression stats (games played, wins, total fragments)
- Permanent currency
- Unlocked items and upgrades
- Achievements
- Player preferences

**Persists:** Across all game sessions

### Usage

#### Import
```typescript
import { saveManager } from '../core/saveManager';
```

#### Basic Operations

**Start a new run:**
```typescript
saveManager.resetRun(); // Clears run state
saveManager.recordGameStart(); // Increments games played
```

**Track fragments:**
```typescript
saveManager.updateRunState({ totalFragmentsInRun: 5 });
saveManager.collectFragment(fragmentId);
const collected = saveManager.getCollectedFragmentsCount();
```

**Manage gold:**
```typescript
saveManager.addGold(50);
if (saveManager.canAfford(100)) {
  const success = saveManager.removeGold(100);
  if (success) {
    // Purchase successful
  }
}
```

**Record game outcome:**
```typescript
const fragmentsCollected = saveManager.getCollectedFragmentsCount();
saveManager.recordGameWon(fragmentsCollected); // or recordGameLost()
```

**Access state:**
```typescript
const runState = saveManager.getRunState();
const metaState = saveManager.getMetaState();
```

### API Reference

#### Run State Methods
- `saveRunState()` - Save current run state to localStorage
- `loadRunState()` - Load run state from localStorage
- `getRunState()` - Get immutable copy of run state
- `updateRunState(updates)` - Update run state with partial data
- `resetRun()` - Reset run state to default

#### Meta State Methods
- `saveMetaState()` - Save meta state to localStorage
- `loadMetaState()` - Load meta state from localStorage
- `getMetaState()` - Get immutable copy of meta state
- `updateMetaState(updates)` - Update meta state with partial data
- `resetMeta()` - Reset meta state to default

#### Convenience Methods
- `recordGameStart()` - Increment games played counter
- `recordGameWon(fragmentsCollected)` - Record a victory
- `recordGameLost(fragmentsCollected)` - Record a loss
- `addGold(amount)` - Add gold to current run
- `removeGold(amount)` - Remove gold (returns false if insufficient)
- `canAfford(cost)` - Check if player can afford cost
- `collectFragment(fragmentId)` - Mark fragment as collected
- `getCollectedFragmentsCount()` - Get number of collected fragments
- `areAllFragmentsCollected()` - Check if all fragments collected

#### Utility Methods
- `clearAllData()` - Clear all save data (USE WITH CAUTION)
- `exportSaveData()` - Export save data as JSON string
- `importSaveData(jsonString)` - Import save data from JSON

### Future Enhancements

The modular design supports future features:
- Cloud save sync
- Multiple save slots
- Save data encryption
- Cross-device progression
- Save data versioning and migration

### Backward Compatibility

The existing `ProgressManager` in `utils/progressManager.ts` has been updated to delegate to `SaveManager`, ensuring backward compatibility with existing code while centralizing save logic.

---

## Progression System

The `progression.ts` module provides a modular progression system for managing player advancement across dungeon runs.

### Features

- **Run Rewards**: Calculate currency and XP based on performance
- **Difficulty Scaling**: Gradual difficulty increase based on meta-progression
- **Fragment Unlock Chances**: Probabilistic fragment unlocks after each run
- **Placeholder Metrics**: XP, levels, and unlocks ready for future expansion
- **Extensible Architecture**: Easy to add new mechanics and meta-upgrades

### Core Components

#### Reward System
After each dungeon run, players earn:
- **Gold**: Base reward + bonuses for fragments and enemies defeated
- **XP**: Experience points for level progression (placeholder)
- **Fragment Unlock Chance**: Probability to unlock new map fragments

#### Difficulty Modifiers
Difficulty scales across multiple dimensions:
- **Room Complexity**: More complex layouts and more rooms
- **Enemy Scaling**: Increased health, damage, and spawn rates
- **Fragment Scarcity**: Fewer fragments available at higher difficulties
- **Fragment Cost**: Higher prices in merchant shops

#### Progression Metrics (Placeholder)
Track player advancement:
- **Level System**: XP-based leveling with exponential curve
- **Currency Tracking**: Total earned and spent
- **Fragment Collection**: Total collected and collection rate
- **Unlocks**: Rooms, enemies, and power-ups (extensible)

### Usage

#### Basic Setup
```typescript
import { ProgressionSystem } from '../core/progression';

// Create with default configuration
const progression = new ProgressionSystem();

// Or customize configuration
const progression = new ProgressionSystem({
  baseGoldPerRun: 75,
  difficultyScaleRate: 0.15,
  maxDifficultyMultiplier: 2.5,
});
```

#### Calculate Run Rewards
```typescript
// After a dungeon run
const rewards = progression.calculateRunRewards(
  fragmentsCollected,
  enemiesDefeated,
  runWon
);

console.log(`Earned ${rewards.gold} gold`);
console.log(`Fragment unlock chance: ${rewards.fragmentUnlockChance * 100}%`);
console.log(`Gained ${rewards.xp} XP`);

// Apply rewards to player
const leveledUp = progression.applyRewards(rewards);
if (leveledUp) {
  console.log('Level up!');
}
```

#### Get Difficulty Modifiers
```typescript
// Get current difficulty based on games played
const metaState = saveManager.getMetaState();
const difficulty = progression.getDifficultyModifiers(metaState.gamesPlayed);

// Apply to dungeon generation
roomGenerator.setMaxRooms(difficulty.maxRooms);
roomGenerator.setComplexityMultiplier(difficulty.roomComplexity);

// Apply to enemy spawner
enemySpawner.updateConfig({
  spawnChance: difficulty.enemySpawnChance,
  maxEnemiesPerRoom: difficulty.maxEnemiesPerRoom,
});

// Apply to fragment system
mapFragmentSystem.updateConfig({
  fragmentPurchaseCost: difficulty.fragmentCost,
  maxFragments: Math.floor(5 * difficulty.fragmentScarcity),
});

// Apply to enemy stats
enemy.setHealthMultiplier(difficulty.enemyHealthMultiplier);
enemy.setDamageMultiplier(difficulty.enemyDamageMultiplier);
```

#### Track Metrics
```typescript
// Get current metrics
const metrics = progression.getMetrics();
console.log(`Level: ${metrics.level}`);
console.log(`Gold: ${metrics.currentGold}`);
console.log(`Fragments: ${metrics.totalFragmentsCollected}`);

// Update metrics
progression.updateMetrics({
  totalFragmentsCollected: metrics.totalFragmentsCollected + 1,
});

// Spend gold on purchases
if (progression.spendGold(100)) {
  console.log('Purchase successful');
}
```

#### Helper Functions
```typescript
import { 
  calculateXPForLevel, 
  estimateDifficultyTier, 
  getDifficultyName 
} from '../core/progression';

// Calculate XP needed for a level
const xpNeeded = calculateXPForLevel(10); // XP for level 10

// Get difficulty tier (1-5)
const tier = estimateDifficultyTier(gamesPlayed);
const name = getDifficultyName(tier); // "Easy", "Normal", etc.
```

### Configuration Options

All progression parameters can be customized:

```typescript
interface ProgressionConfig {
  // Reward calculation
  baseGoldPerRun?: number;        // Base gold per run (default: 50)
  goldPerFragment?: number;       // Bonus per fragment (default: 25)
  goldPerEnemy?: number;          // Bonus per enemy (default: 10)
  fragmentUnlockBaseChance?: number;  // Base unlock chance (default: 0.2)
  fragmentUnlockPerFragment?: number; // Chance per fragment (default: 0.1)
  baseXPPerRun?: number;          // Base XP per run (default: 100)
  xpPerFragment?: number;         // XP per fragment (default: 50)
  
  // Difficulty scaling
  difficultyScaleRate?: number;   // Scale rate (default: 0.1)
  maxDifficultyMultiplier?: number; // Max multiplier (default: 2.0)
  
  // Level progression
  xpCurveMultiplier?: number;     // XP curve (default: 1.5)
  baseXPToLevel?: number;         // Base XP for level 2 (default: 500)
}
```

### Extension Points

The progression system is designed for easy extension:

#### 1. Add New Reward Types
```typescript
// Extend RunReward interface
export interface RunReward {
  gold: number;
  xp: number;
  skillPoints: number;  // New reward type
  // ...
}

// Update calculateRunRewards() to include new rewards
```

#### 2. Add New Difficulty Factors
```typescript
// Extend DifficultyModifiers interface
export interface DifficultyModifiers {
  // ... existing modifiers
  bossHealthMultiplier: number;  // New difficulty factor
}

// Update getDifficultyModifiers() to calculate new factors
```

#### 3. Add Meta-Upgrades
```typescript
// Define upgrade system
interface MetaUpgrade {
  id: string;
  name: string;
  cost: number;
  effect: () => void;
}

// Use unlockPowerUp() or extend with new unlock methods
progression.unlockPowerUp('double_damage');
```

#### 4. Add Level-Based Unlocks
```typescript
// In applyRewards() after level-up:
if (this.metrics.level === 5) {
  this.unlockRoom('treasure_vault');
}
if (this.metrics.level === 10) {
  this.unlockEnemy('elite_guard');
}
```

#### 5. Add Custom Difficulty Scaling
```typescript
// Override getDifficultyModifiers for custom logic
class CustomProgressionSystem extends ProgressionSystem {
  getDifficultyModifiers(gamesPlayed: number): DifficultyModifiers {
    // Custom scaling based on win rate, player level, etc.
    const winRate = this.calculateWinRate();
    // ... custom logic
  }
}
```

### Integration Example

Complete integration with existing game systems:

```typescript
// In GameScene.create()
import { ProgressionSystem } from '../core/progression';
import { saveManager } from '../core/saveManager';

// Initialize progression system
const progression = new ProgressionSystem();

// Get difficulty for current run
const metaState = saveManager.getMetaState();
const difficulty = progression.getDifficultyModifiers(metaState.gamesPlayed);

// Apply difficulty to game systems
this.enemySpawner.updateConfig({
  spawnChance: difficulty.enemySpawnChance,
  maxEnemiesPerRoom: difficulty.maxEnemiesPerRoom,
});

// After run completion (in GameOverScene or similar)
const rewards = progression.calculateRunRewards(
  fragmentsCollected,
  enemiesDefeated,
  playerWon
);

// Save rewards to meta-state
const leveledUp = progression.applyRewards(rewards);
saveManager.updateMetaState({
  totalGoldEarned: metaState.totalGoldEarned + rewards.gold,
  totalFragmentsCollected: metaState.totalFragmentsCollected + fragmentsCollected,
});

// Check for fragment unlock
if (Math.random() < rewards.fragmentUnlockChance) {
  // Unlock a new fragment type for next run
  console.log('New fragment unlocked!');
}
```

### Future Enhancement Ideas

The modular design supports many potential features:

1. **Prestige System**: Reset progress for permanent bonuses
2. **Skill Trees**: Spend skill points on permanent upgrades
3. **Achievement System**: Unlock rewards for specific milestones
4. **Daily Challenges**: Special runs with unique modifiers
5. **Leaderboards**: Compare progression with other players
6. **Meta-Currencies**: Multiple currency types for different systems
7. **Difficulty Modes**: Player-selectable difficulty presets
8. **Adaptive Difficulty**: Auto-adjust based on player performance
9. **Seasonal Content**: Time-limited unlocks and events
10. **Consumable Items**: Persistent items usable in runs
