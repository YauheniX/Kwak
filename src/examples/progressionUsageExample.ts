/**
 * Progression System Usage Example
 * =================================
 * This file demonstrates how to integrate the progression system with the existing game systems.
 * 
 * This is a reference implementation showing the key integration points.
 * Copy and adapt these patterns into your actual game scenes.
 */

import { ProgressionSystem, estimateDifficultyTier, getDifficultyName } from '../core/progression';
import { saveManager } from '../core/saveManager';

// ==================== EXAMPLE 1: INITIALIZE PROGRESSION ====================

/**
 * Initialize the progression system at game start
 * Typically done in MenuScene or BootScene
 */
function initializeProgression() {
  // Create progression system with default config
  // const progression = new ProgressionSystem();
  
  // Or customize configuration for your game balance
  const customProgression = new ProgressionSystem({
    baseGoldPerRun: 75, // More generous gold rewards
    difficultyScaleRate: 0.08, // Slower difficulty increase
    goldPerFragment: 30, // Better fragment rewards
  });
  
  return customProgression;
}

// ==================== EXAMPLE 2: APPLY DIFFICULTY AT RUN START ====================

/**
 * Apply difficulty modifiers when starting a new dungeon run
 * Typically done in GameScene.create()
 */
function applyDifficultyToRun(progression: ProgressionSystem) {
  // Get player's meta-progression
  const metaState = saveManager.getMetaState();
  
  // Calculate current difficulty based on games played
  const difficulty = progression.getDifficultyModifiers(metaState.gamesPlayed);
  
  // Display difficulty to player
  const tier = estimateDifficultyTier(metaState.gamesPlayed);
  console.log(`Current Difficulty: ${getDifficultyName(tier)} (Tier ${tier})`);
  console.log(`Games Played: ${metaState.gamesPlayed}`);
  
  // Apply difficulty to room generation
  // Note: This assumes your RoomGenerator has these methods
  // Adapt to your actual implementation
  /*
  roomGenerator.setMaxRooms(difficulty.maxRooms);
  roomGenerator.setComplexityMultiplier(difficulty.roomComplexity);
  */
  
  // Apply difficulty to enemy spawning
  // Note: This assumes your EnemySpawner has updateConfig method
  /*
  enemySpawner.updateConfig({
    spawnChance: difficulty.enemySpawnChance,
    maxEnemiesPerRoom: difficulty.maxEnemiesPerRoom,
  });
  */
  
  // Apply difficulty to fragment system
  // Note: Adjust fragment availability and cost
  /*
  const baseFragments = 5;
  const scaledFragments = Math.max(3, Math.floor(baseFragments * difficulty.fragmentScarcity));
  
  mapFragmentSystem.updateConfig({
    maxFragments: scaledFragments,
    fragmentPurchaseCost: difficulty.fragmentCost,
  });
  */
  
  // Apply difficulty to enemy stats
  // Note: This would be done when creating enemies
  /*
  for (const enemy of enemies) {
    enemy.health *= difficulty.enemyHealthMultiplier;
    enemy.damage *= difficulty.enemyDamageMultiplier;
  }
  */
  
  return difficulty;
}

// ==================== EXAMPLE 3: CALCULATE AND APPLY REWARDS ====================

/**
 * Calculate and apply rewards at the end of a dungeon run
 * Typically done in GameOverScene or GameScene when run ends
 */
function handleRunCompletion(
  progression: ProgressionSystem,
  fragmentsCollected: number,
  enemiesDefeated: number,
  runWon: boolean
) {
  // Calculate rewards based on performance
  const rewards = progression.calculateRunRewards(
    fragmentsCollected,
    enemiesDefeated,
    runWon
  );
  
  // Display rewards to player
  console.log('=== Run Completed ===');
  console.log(`Result: ${runWon ? 'Victory' : 'Defeat'}`);
  console.log(`Fragments Collected: ${fragmentsCollected}`);
  console.log(`Enemies Defeated: ${enemiesDefeated}`);
  console.log('');
  console.log('=== Rewards ===');
  console.log(`Gold Earned: ${rewards.gold}`);
  console.log(`Bonus Gold: ${rewards.bonusGold}`);
  console.log(`XP Earned: ${rewards.xp}`);
  console.log(`Fragment Unlock Chance: ${(rewards.fragmentUnlockChance * 100).toFixed(1)}%`);
  
  // Apply rewards to progression
  const leveledUp = progression.applyRewards(rewards);
  
  if (leveledUp) {
    const metrics = progression.getMetrics();
    console.log('');
    console.log('🎉 LEVEL UP! 🎉');
    console.log(`New Level: ${metrics.level}`);
    console.log(`XP to Next Level: ${metrics.xpToNextLevel}`);
    
    // Add level-up rewards or unlocks here
    // Example: Unlock new content at specific levels
    if (metrics.level === 5) {
      progression.unlockRoom('treasure_vault');
      console.log('Unlocked: Treasure Vault room type!');
    }
    if (metrics.level === 10) {
      progression.unlockEnemy('elite_guard');
      console.log('Unlocked: Elite Guard enemy type!');
    }
  }
  
  // Update save manager with new totals
  const metaState = saveManager.getMetaState();
  const progressionMetrics = progression.getMetrics();
  
  saveManager.updateMetaState({
    totalGoldEarned: metaState.totalGoldEarned + rewards.gold,
    totalFragmentsCollected: metaState.totalFragmentsCollected + fragmentsCollected,
  });
  
  // Add gold to player's current balance (for meta-purchases)
  progression.updateMetrics({
    currentGold: progressionMetrics.currentGold + rewards.gold,
    totalFragmentsCollected: progressionMetrics.totalFragmentsCollected + fragmentsCollected,
  });
  
  // Check for fragment unlock
  if (Math.random() < rewards.fragmentUnlockChance) {
    console.log('');
    console.log('✨ New Fragment Type Unlocked! ✨');
    // Implement fragment unlock logic here
    // This could unlock new fragment types, visual variants, etc.
  }
  
  return rewards;
}

// ==================== EXAMPLE 4: META-PROGRESSION SHOP ====================

/**
 * Example of a meta-progression shop where players spend persistent currency
 * Typically implemented as a separate scene or menu
 */
function metaProgressionShop(progression: ProgressionSystem) {
  const metrics = progression.getMetrics();
  
  console.log('=== Meta-Progression Shop ===');
  console.log(`Current Gold: ${metrics.currentGold}`);
  console.log(`Level: ${metrics.level}`);
  console.log('');
  
  // Example purchasable items
  const shopItems = [
    { id: 'health_boost', name: 'Health Boost', cost: 500, type: 'powerup' as const },
    { id: 'damage_boost', name: 'Damage Boost', cost: 750, type: 'powerup' as const },
    { id: 'boss_room', name: 'Boss Room', cost: 1000, type: 'room' as const },
    { id: 'elite_enemy', name: 'Elite Enemy', cost: 800, type: 'enemy' as const },
  ];
  
  // Display available items
  console.log('Available Purchases:');
  shopItems.forEach((item, index) => {
    const canAfford = metrics.currentGold >= item.cost;
    const alreadyUnlocked = progression.isUnlocked(item.type, item.id);
    const status = alreadyUnlocked ? '[OWNED]' : canAfford ? '[BUY]' : '[LOCKED]';
    
    console.log(`${index + 1}. ${item.name} - ${item.cost}g ${status}`);
  });
  
  // Example purchase
  function purchaseItem(itemId: string, cost: number, type: 'room' | 'enemy' | 'powerup') {
    if (progression.spendGold(cost)) {
      let unlocked = false;
      
      switch (type) {
        case 'room':
          unlocked = progression.unlockRoom(itemId);
          break;
        case 'enemy':
          unlocked = progression.unlockEnemy(itemId);
          break;
        case 'powerup':
          unlocked = progression.unlockPowerUp(itemId);
          break;
      }
      
      if (unlocked) {
        console.log(`Purchased: ${itemId}`);
        return true;
      } else {
        // Already owned, refund
        progression.updateMetrics({
          currentGold: progression.getMetrics().currentGold + cost,
        });
        console.log('Already owned!');
        return false;
      }
    } else {
      console.log('Insufficient gold!');
      return false;
    }
  }
  
  return purchaseItem;
}

// ==================== EXAMPLE 5: DISPLAY PROGRESSION STATUS ====================

/**
 * Display current progression status to player
 * Useful for UI panels, stats screens, etc.
 */
function displayProgressionStatus(progression: ProgressionSystem) {
  const metrics = progression.getMetrics();
  const metaState = saveManager.getMetaState();
  
  console.log('=== Player Progression ===');
  console.log('');
  
  // Level and XP
  console.log('Level:', metrics.level);
  console.log(`XP: ${metrics.currentXP} / ${metrics.xpToNextLevel}`);
  const xpPercent = ((metrics.currentXP / metrics.xpToNextLevel) * 100).toFixed(1);
  console.log(`Progress: ${xpPercent}%`);
  console.log('Total XP:', metrics.totalXP);
  console.log('');
  
  // Currency
  console.log('Current Gold:', metrics.currentGold);
  console.log('Total Earned:', metrics.totalGoldEarned);
  console.log('Total Spent:', metrics.totalGoldSpent);
  console.log('');
  
  // Fragment Stats
  console.log('Fragments Collected:', metrics.totalFragmentsCollected);
  console.log('Unique Unlocked:', metrics.uniqueFragmentsUnlocked);
  console.log('Collection Rate:', metrics.fragmentCollectionRate.toFixed(2), 'per run');
  console.log('');
  
  // Game Stats
  console.log('Games Played:', metaState.gamesPlayed);
  console.log('Games Won:', metaState.gamesWon);
  const winRate = metaState.gamesPlayed > 0 
    ? ((metaState.gamesWon / metaState.gamesPlayed) * 100).toFixed(1) 
    : 0;
  console.log('Win Rate:', `${winRate}%`);
  console.log('');
  
  // Difficulty
  const tier = estimateDifficultyTier(metaState.gamesPlayed);
  console.log('Current Difficulty:', getDifficultyName(tier), `(Tier ${tier})`);
  console.log('');
  
  // Unlocks
  console.log('Unlocked Rooms:', metrics.unlockedRooms.length);
  console.log('Unlocked Enemies:', metrics.unlockedEnemies.length);
  console.log('Unlocked Power-ups:', metrics.unlockedPowerUps.length);
}

// ==================== EXAMPLE 6: COMPLETE GAME INTEGRATION ====================

/**
 * Complete example of progression system integration
 * This shows the full lifecycle from game start to completion
 */
export function completeProgressionExample() {
  console.log('==============================================');
  console.log('  Progression System Integration Example');
  console.log('==============================================');
  console.log('');
  
  // 1. Initialize progression system
  const progression = initializeProgression();
  console.log('✓ Progression system initialized');
  console.log('');
  
  // 2. Display current status
  displayProgressionStatus(progression);
  console.log('');
  
  // 3. Start a new run and apply difficulty
  console.log('=== Starting New Run ===');
  saveManager.recordGameStart();
  const difficulty = applyDifficultyToRun(progression);
  console.log(`Room Complexity: ${difficulty.roomComplexity.toFixed(2)}x`);
  console.log(`Max Rooms: ${difficulty.maxRooms}`);
  console.log(`Enemy Health: ${difficulty.enemyHealthMultiplier.toFixed(2)}x`);
  console.log(`Enemy Damage: ${difficulty.enemyDamageMultiplier.toFixed(2)}x`);
  console.log('');
  
  // 4. Simulate run completion
  console.log('=== Simulating Run ===');
  const fragmentsCollected = 3;
  const enemiesDefeated = 5;
  const runWon = true;
  console.log('(Playing through dungeon...)');
  console.log('');
  
  // 5. Handle run completion and rewards
  handleRunCompletion(
    progression,
    fragmentsCollected,
    enemiesDefeated,
    runWon
  );
  
  // Record outcome in save manager
  if (runWon) {
    saveManager.recordGameWon(fragmentsCollected);
  } else {
    saveManager.recordGameLost(fragmentsCollected);
  }
  console.log('');
  
  // 6. Show meta-progression shop
  console.log('');
  const purchaseFunction = metaProgressionShop(progression);
  console.log('');
  
  // Example purchase
  console.log('=== Making Purchase ===');
  purchaseFunction('health_boost', 500, 'powerup');
  console.log('');
  
  // 7. Display updated status
  console.log('');
  displayProgressionStatus(progression);
  
  console.log('');
  console.log('==============================================');
  console.log('  Example Complete');
  console.log('==============================================');
}

// Run the example (comment out when using as reference)
// completeProgressionExample();
