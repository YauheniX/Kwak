import { saveManager } from '../core/saveManager';

export interface GameProgress {
  gamesPlayed: number;
  gamesWon: number;
  totalFragmentsCollected: number;
  highestFragmentsInOneRun: number;
}

/**
 * @deprecated Use SaveManager from core/saveManager.ts instead
 * This class is maintained for backward compatibility
 */
export class ProgressManager {
  getProgress(): GameProgress {
    const metaState = saveManager.getMetaState();
    return {
      gamesPlayed: metaState.gamesPlayed,
      gamesWon: metaState.gamesWon,
      totalFragmentsCollected: metaState.totalFragmentsCollected,
      highestFragmentsInOneRun: metaState.highestFragmentsInOneRun,
    };
  }

  recordGameStart(): void {
    saveManager.recordGameStart();
  }

  recordGameWon(fragmentsCollected: number): void {
    saveManager.recordGameWon(fragmentsCollected);
  }

  recordGameLost(fragmentsCollected: number): void {
    saveManager.recordGameLost(fragmentsCollected);
  }

  resetProgress(): void {
    saveManager.resetMeta();
  }
}
