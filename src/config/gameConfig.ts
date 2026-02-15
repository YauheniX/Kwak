export const GameConfig = {
  // Display
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',

  // Room generation
  roomWidth: 20,
  roomHeight: 15,
  tileSize: 32,
  maxRooms: 10,

  // Player
  playerSpeed: 200,
  playerSize: 16,
  playerColor: 0x00ff00,

  // Enemy
  enemySpeed: 100,
  enemySize: 14,
  enemyColor: 0xff0000,
  enemiesPerRoom: 3,

  // Fragments & Treasure
  fragmentsRequired: 4, // 3-5 range, using 4
  fragmentSize: 10,
  fragmentColor: 0xffff00,
  treasureSize: 20,
  treasureColor: 0xffd700,

  // UI
  fontSize: 16,
  uiFontColor: '#ffffff',
};
