/**
 * Currency System
 * Manages in-game currency (gold/coins) for purchasing items
 */

export interface CurrencyData {
  gold: number;
}

export class CurrencySystem {
  private gold: number = 0;

  constructor(initialGold: number = 0) {
    this.gold = initialGold;
  }

  /**
   * Get current gold amount
   */
  getGold(): number {
    return this.gold;
  }

  /**
   * Add gold
   */
  addGold(amount: number): void {
    if (amount > 0) {
      this.gold += amount;
    }
  }

  /**
   * Remove gold (for purchases)
   */
  removeGold(amount: number): boolean {
    if (amount <= 0 || this.gold < amount) {
      return false;
    }
    this.gold -= amount;
    return true;
  }

  /**
   * Check if player can afford an item
   */
  canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  /**
   * Reset currency (for new game)
   */
  reset(initialGold: number = 0): void {
    this.gold = initialGold;
  }
}
