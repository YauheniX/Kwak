import Phaser from 'phaser';
import { GameConfig } from './config/gameConfig';

/**
 * LAZY-LOADING SETUP:
 * Scenes are dynamically imported on-demand to reduce initial bundle size.
 * Each scene is loaded only when needed using dynamic import().
 * This creates separate chunks for each scene, improving load time and caching.
 */

// Extend Window interface for type safety
declare global {
  interface Window {
    game: Phaser.Game;
    sceneManager: SceneManager;
  }
}

// Scene loader registry - maps scene keys to their dynamic import functions
const sceneLoaders: Record<string, () => Promise<new () => Phaser.Scene>> = {
  BootScene: async () => {
    const { BootScene } = await import('./scenes/BootScene');
    return BootScene;
  },
  PreloadScene: async () => {
    const { PreloadScene } = await import('./scenes/PreloadScene');
    return PreloadScene;
  },
  MenuScene: async () => {
    const { MenuScene } = await import('./scenes/MenuScene');
    return MenuScene;
  },
  GameScene: async () => {
    const { GameScene } = await import('./scenes/GameScene');
    return GameScene;
  },
  UIScene: async () => {
    const { UIScene } = await import('./scenes/UIScene');
    return UIScene;
  },
  GameOverScene: async () => {
    const { GameOverScene } = await import('./scenes/GameOverScene');
    return GameOverScene;
  },
};

// Scene manager to handle dynamic scene loading
class SceneManager {
  private game: Phaser.Game;
  private loadedScenes: Set<string> = new Set();

  constructor(game: Phaser.Game) {
    this.game = game;
  }

  /**
   * Lazy-load and add a scene to the game if not already loaded.
   * This ensures scenes are only loaded when first needed.
   */
  async loadScene(sceneKey: string): Promise<void> {
    // Skip if already loaded
    if (this.loadedScenes.has(sceneKey)) {
      return;
    }

    const loader = sceneLoaders[sceneKey];
    if (!loader) {
      console.error(`No loader found for scene: ${sceneKey}`);
      return;
    }

    try {
      // Dynamic import - creates a separate chunk for this scene
      const SceneClass = await loader();
      
      // Add scene to the game
      this.game.scene.add(sceneKey, SceneClass, false);
      this.loadedScenes.add(sceneKey);
      
      // Development logging (removed by Terser in production)
      console.log(`Lazy-loaded scene: ${sceneKey}`);
    } catch (error) {
      console.error(`Failed to load scene ${sceneKey}:`, error);
    }
  }

  /**
   * Pre-load multiple scenes in parallel for better performance
   */
  async preloadScenes(sceneKeys: string[]): Promise<void> {
    await Promise.all(sceneKeys.map((key) => this.loadScene(key)));
  }
}

// Initialize the game with minimal configuration
// Only BootScene is loaded initially - all other scenes are lazy-loaded
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GameConfig.width,
  height: GameConfig.height,
  backgroundColor: GameConfig.backgroundColor,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [], // Start with no scenes - they'll be loaded dynamically
};

const game = new Phaser.Game(config);
const sceneManager = new SceneManager(game);

// Bootstrap: Load and start BootScene
(async () => {
  // Load BootScene first
  await sceneManager.loadScene('BootScene');
  
  // Pre-load PreloadScene and MenuScene for quick transitions
  // GameScene, UIScene, and GameOverScene are loaded only when needed
  await sceneManager.preloadScenes(['PreloadScene', 'MenuScene']);
  
  // Start the game
  game.scene.start('BootScene');
})();

// Expose game instance and scene manager for debugging and scene transitions
if (typeof window !== 'undefined') {
  window.game = game;
  window.sceneManager = sceneManager;
}
