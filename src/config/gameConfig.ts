export const GameConfig = {
  // Display
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',

  // Room generation - configurable parameters for dungeon generation
  roomWidth: 20, // Maximum room width in tiles (rooms will vary from 8 to this value)
  roomHeight: 15, // Maximum room height in tiles (rooms will vary from 6 to this value)
  tileSize: 32, // Size of each tile in pixels
  maxRooms: 5, // Total number of rooms to generate (minimum 1 guaranteed)

  // Player
  playerSpeed: 200,
  playerSize: 16,
  playerColor: 0x00ff00,

  // Enemy - configurable spawn parameters
  enemySpeed: 100,
  enemySize: 14,
  enemyColor: 0xff0000,
  enemiesPerRoom: 1, // Number of enemies per room (supports multiple spawn points)
  
  // Enemy spawn configuration
  enemySpawn: {
    minDistanceFromPlayer: 200, // Minimum distance from player spawn point (pixels)
    maxEnemiesPerRoom: 3, // Maximum number of enemies that can spawn in a single room
    spawnChance: 0.8, // Probability of spawning enemies in a room (0-1)
    minEnemySpacing: 64, // Minimum distance between enemies in the same room (pixels)
  },
  
  // Enemy AI configuration
  enemyAI: {
    chaseDistance: 300, // Distance at which enemy starts chasing player (pixels)
    patrolMoveDelay: 1000, // Time between patrol movements (milliseconds)
    patrolRange: 100, // Maximum distance for random patrol movement (pixels)
  },

  // Fragments & Treasure - configurable loot distribution
  fragmentsRequired: 4, // Number of fragments to collect (minimum 1 per dungeon guaranteed)
  fragmentSize: 10,
  fragmentColor: 0xffff00,
  treasureSize: 20,
  treasureColor: 0xffd700,

  // UI
  fontSize: 16,
  uiFontColor: '#ffffff',
};
