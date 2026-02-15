export interface GameProgress {
  gamesPlayed: number;
  gamesWon: number;
  totalFragmentsCollected: number;
  highestFragmentsInOneRun: number;
}

const STORAGE_KEY = 'kwak_progress';

export class ProgressManager {
  private progress: GameProgress;

  constructor() {
    this.progress = this.loadProgress();
  }

  private loadProgress(): GameProgress {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as GameProgress;
      } catch (e) {
        console.error('Failed to parse stored progress', e);
      }
    }
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      totalFragmentsCollected: 0,
      highestFragmentsInOneRun: 0,
    };
  }

  private saveProgress(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }

  getProgress(): GameProgress {
    return { ...this.progress };
  }

  recordGameStart(): void {
    this.progress.gamesPlayed++;
    this.saveProgress();
  }

  recordGameWon(fragmentsCollected: number): void {
    this.progress.gamesWon++;
    this.progress.totalFragmentsCollected += fragmentsCollected;
    if (fragmentsCollected > this.progress.highestFragmentsInOneRun) {
      this.progress.highestFragmentsInOneRun = fragmentsCollected;
    }
    this.saveProgress();
  }

  recordGameLost(fragmentsCollected: number): void {
    this.progress.totalFragmentsCollected += fragmentsCollected;
    if (fragmentsCollected > this.progress.highestFragmentsInOneRun) {
      this.progress.highestFragmentsInOneRun = fragmentsCollected;
    }
    this.saveProgress();
  }

  resetProgress(): void {
    this.progress = {
      gamesPlayed: 0,
      gamesWon: 0,
      totalFragmentsCollected: 0,
      highestFragmentsInOneRun: 0,
    };
    this.saveProgress();
  }
}
