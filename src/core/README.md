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
