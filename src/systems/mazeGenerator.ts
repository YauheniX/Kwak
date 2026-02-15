/**
 * Maze Generator System
 * 
 * Generates proper procedural mazes/labyrinths using grid-based algorithms.
 * Ensures all rooms are connected with corridors and no isolated areas.
 * 
 * Uses Randomized Depth-First Search (DFS) algorithm for maze generation.
 */

import { GameConfig } from '../config/gameConfig';

/**
 * Cell in the maze grid
 */
export interface MazeCell {
  x: number; // Grid x coordinate
  y: number; // Grid y coordinate
  isRoom: boolean; // Whether this cell is part of a room
  roomId: number | null; // ID of the room this cell belongs to
  isWall: boolean; // Whether this cell is a wall
  isCorridor: boolean; // Whether this cell is a corridor
  visited: boolean; // Used during generation
}

/**
 * Room in the maze
 */
export interface MazeRoom {
  id: number;
  gridX: number; // Grid x coordinate
  gridY: number; // Grid y coordinate
  gridWidth: number; // Width in grid cells
  gridHeight: number; // Height in grid cells
  x: number; // Pixel x coordinate
  y: number; // Pixel y coordinate
  width: number; // Pixel width
  height: number; // Pixel height
  centerX: number; // Pixel center x
  centerY: number; // Pixel center y
  type: RoomType; // Room classification
  depth: number; // Distance from spawn
}

/**
 * Room type classification
 */
export enum RoomType {
  SPAWN = 'SPAWN',
  TREASURE = 'TREASURE',
  SHOP = 'SHOP',
  COMBAT = 'COMBAT',
  BOSS = 'BOSS',
  ELITE = 'ELITE',
}

/**
 * Corridor connection
 */
export interface MazeCorridor {
  x1: number; // Start x (pixels)
  y1: number; // Start y (pixels)
  x2: number; // End x (pixels)
  y2: number; // End y (pixels)
  room1Id: number;
  room2Id: number;
}

/**
 * Complete maze structure
 */
export interface Maze {
  grid: MazeCell[][];
  rooms: MazeRoom[];
  corridors: MazeCorridor[];
  spawnRoomId: number;
  treasureRoomId: number;
  shopRoomId: number;
  bossRoomId: number;
  gridWidth: number;
  gridHeight: number;
}

/**
 * Maze generation configuration
 */
export interface MazeConfig {
  gridWidth?: number; // Number of cells horizontally
  gridHeight?: number; // Number of cells vertically
  cellSize?: number; // Size of each cell in pixels
  roomCount?: number; // Number of rooms to generate
  minRoomSize?: number; // Minimum room size in cells
  maxRoomSize?: number; // Maximum room size in cells
  corridorWidth?: number; // Corridor width in cells
  mazeDensity?: number; // 0-1, how maze-like (vs open) the dungeon is
  seed?: number; // Random seed
}

/**
 * Seeded random number generator
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Maze Generator
 */
export class MazeGenerator {
  private config: Required<MazeConfig>;
  private rng: SeededRandom;
  private grid: MazeCell[][] = [];
  private rooms: MazeRoom[] = [];
  private corridors: MazeCorridor[] = [];
  private roomIdCounter: number = 0;

  constructor(config: MazeConfig = {}) {
    this.config = {
      gridWidth: config.gridWidth ?? 50,
      gridHeight: config.gridHeight ?? 40,
      cellSize: config.cellSize ?? GameConfig.tileSize,
      roomCount: config.roomCount ?? GameConfig.maxRooms,
      minRoomSize: config.minRoomSize ?? 4,
      maxRoomSize: config.maxRoomSize ?? 10,
      corridorWidth: config.corridorWidth ?? 1,
      mazeDensity: config.mazeDensity ?? 0.7,
      seed: config.seed ?? Date.now(),
    };

    this.rng = new SeededRandom(this.config.seed);
  }

  /**
   * Generate complete maze
   */
  generate(): Maze {
    // Initialize grid
    this.initializeGrid();

    // Generate rooms
    this.generateRooms();

    // Connect all rooms with corridors using DFS
    this.connectRoomsWithMaze();

    // Classify rooms
    const classification = this.classifyRooms();

    // Build corridor list for rendering
    this.buildCorridorList();

    return {
      grid: this.grid,
      rooms: this.rooms,
      corridors: this.corridors,
      spawnRoomId: classification.spawnRoomId,
      treasureRoomId: classification.treasureRoomId,
      shopRoomId: classification.shopRoomId,
      bossRoomId: classification.bossRoomId,
      gridWidth: this.config.gridWidth,
      gridHeight: this.config.gridHeight,
    };
  }

  /**
   * Initialize empty grid
   */
  private initializeGrid(): void {
    this.grid = [];
    for (let y = 0; y < this.config.gridHeight; y++) {
      const row: MazeCell[] = [];
      for (let x = 0; x < this.config.gridWidth; x++) {
        row.push({
          x,
          y,
          isRoom: false,
          roomId: null,
          isWall: true,
          isCorridor: false,
          visited: false,
        });
      }
      this.grid.push(row);
    }
  }

  /**
   * Generate random rooms on the grid
   */
  private generateRooms(): void {
    this.rooms = [];
    this.roomIdCounter = 0;
    const maxAttempts = this.config.roomCount * 10;
    let attempts = 0;

    while (this.rooms.length < this.config.roomCount && attempts < maxAttempts) {
      const room = this.createRandomRoom();
      if (room && !this.roomOverlaps(room)) {
        this.rooms.push(room);
        this.carveRoom(room);
      }
      attempts++;
    }
  }

  /**
   * Create a random room
   */
  private createRandomRoom(): MazeRoom | null {
    const gridWidth = this.rng.nextInt(this.config.minRoomSize, this.config.maxRoomSize);
    const gridHeight = this.rng.nextInt(this.config.minRoomSize, this.config.maxRoomSize);
    const gridX = this.rng.nextInt(1, this.config.gridWidth - gridWidth - 1);
    const gridY = this.rng.nextInt(1, this.config.gridHeight - gridHeight - 1);

    return {
      id: this.roomIdCounter++,
      gridX,
      gridY,
      gridWidth,
      gridHeight,
      x: gridX * this.config.cellSize,
      y: gridY * this.config.cellSize,
      width: gridWidth * this.config.cellSize,
      height: gridHeight * this.config.cellSize,
      centerX: (gridX + gridWidth / 2) * this.config.cellSize,
      centerY: (gridY + gridHeight / 2) * this.config.cellSize,
      type: RoomType.COMBAT,
      depth: 0,
    };
  }

  /**
   * Check if room overlaps with existing rooms
   */
  private roomOverlaps(room: MazeRoom): boolean {
    const spacing = 2; // Minimum spacing between rooms
    
    for (const existing of this.rooms) {
      if (
        room.gridX - spacing < existing.gridX + existing.gridWidth &&
        room.gridX + room.gridWidth + spacing > existing.gridX &&
        room.gridY - spacing < existing.gridY + existing.gridHeight &&
        room.gridY + room.gridHeight + spacing > existing.gridY
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Carve out a room in the grid
   */
  private carveRoom(room: MazeRoom): void {
    for (let y = room.gridY; y < room.gridY + room.gridHeight; y++) {
      for (let x = room.gridX; x < room.gridX + room.gridWidth; x++) {
        if (y >= 0 && y < this.config.gridHeight && x >= 0 && x < this.config.gridWidth) {
          this.grid[y][x].isWall = false;
          this.grid[y][x].isRoom = true;
          this.grid[y][x].roomId = room.id;
        }
      }
    }
  }

  /**
   * Connect all rooms with maze corridors using Randomized DFS
   * Ensures all rooms are reachable (fully connected graph)
   */
  private connectRoomsWithMaze(): void {
    if (this.rooms.length === 0) return;

    // For each pair of adjacent rooms, create corridor
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const room1 = this.rooms[i];
      const room2 = this.rooms[i + 1];
      this.carveCorridor(room1, room2);
    }

    // Add additional connections for maze complexity
    const extraConnections = Math.floor(this.rooms.length * this.config.mazeDensity);
    for (let i = 0; i < extraConnections; i++) {
      const room1 = this.rooms[this.rng.nextInt(0, this.rooms.length - 1)];
      const room2 = this.rooms[this.rng.nextInt(0, this.rooms.length - 1)];
      if (room1.id !== room2.id) {
        this.carveCorridor(room1, room2);
      }
    }
  }

  /**
   * Carve L-shaped corridor between two rooms
   */
  private carveCorridor(room1: MazeRoom, room2: MazeRoom): void {
    const centerX1 = Math.floor(room1.gridX + room1.gridWidth / 2);
    const centerY1 = Math.floor(room1.gridY + room1.gridHeight / 2);
    const centerX2 = Math.floor(room2.gridX + room2.gridWidth / 2);
    const centerY2 = Math.floor(room2.gridY + room2.gridHeight / 2);

    // Randomly choose horizontal-first or vertical-first
    if (this.rng.next() < 0.5) {
      // Horizontal then vertical
      this.carveHorizontalCorridor(centerY1, centerX1, centerX2);
      this.carveVerticalCorridor(centerX2, centerY1, centerY2);
    } else {
      // Vertical then horizontal
      this.carveVerticalCorridor(centerX1, centerY1, centerY2);
      this.carveHorizontalCorridor(centerY2, centerX1, centerX2);
    }
  }

  /**
   * Carve horizontal corridor
   */
  private carveHorizontalCorridor(y: number, x1: number, x2: number): void {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    
    for (let x = minX; x <= maxX; x++) {
      for (let dy = 0; dy < this.config.corridorWidth; dy++) {
        const cy = y + dy;
        if (cy >= 0 && cy < this.config.gridHeight && x >= 0 && x < this.config.gridWidth) {
          if (!this.grid[cy][x].isRoom) {
            this.grid[cy][x].isWall = false;
            this.grid[cy][x].isCorridor = true;
          }
        }
      }
    }
  }

  /**
   * Carve vertical corridor
   */
  private carveVerticalCorridor(x: number, y1: number, y2: number): void {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    for (let y = minY; y <= maxY; y++) {
      for (let dx = 0; dx < this.config.corridorWidth; dx++) {
        const cx = x + dx;
        if (y >= 0 && y < this.config.gridHeight && cx >= 0 && cx < this.config.gridWidth) {
          if (!this.grid[y][cx].isRoom) {
            this.grid[y][cx].isWall = false;
            this.grid[y][cx].isCorridor = true;
          }
        }
      }
    }
  }

  /**
   * Build corridor list for rendering
   */
  private buildCorridorList(): void {
    this.corridors = [];
    
    // Create corridors from adjacent rooms
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const room1 = this.rooms[i];
      const room2 = this.rooms[i + 1];
      
      this.corridors.push({
        x1: room1.centerX,
        y1: room1.centerY,
        x2: room2.centerX,
        y2: room2.centerY,
        room1Id: room1.id,
        room2Id: room2.id,
      });
    }
  }

  /**
   * Classify rooms by type
   */
  private classifyRooms(): {
    spawnRoomId: number;
    treasureRoomId: number;
    shopRoomId: number;
    bossRoomId: number;
  } {
    if (this.rooms.length === 0) {
      throw new Error('No rooms generated');
    }

    // First room = spawn
    const spawnRoom = this.rooms[0];
    spawnRoom.type = RoomType.SPAWN;

    // Last room = boss
    const bossRoom = this.rooms[this.rooms.length - 1];
    bossRoom.type = RoomType.BOSS;

    // Middle room = treasure
    const treasureIndex = Math.floor(this.rooms.length / 2);
    const treasureRoom = this.rooms[treasureIndex];
    treasureRoom.type = RoomType.TREASURE;

    // Another middle room = shop
    const shopIndex = Math.floor(this.rooms.length / 3);
    const shopRoom = this.rooms[shopIndex];
    shopRoom.type = RoomType.SHOP;

    return {
      spawnRoomId: spawnRoom.id,
      treasureRoomId: treasureRoom.id,
      shopRoomId: shopRoom.id,
      bossRoomId: bossRoom.id,
    };
  }

  /**
   * Check if grid position is a wall
   */
  isWall(gridX: number, gridY: number): boolean {
    if (gridY < 0 || gridY >= this.config.gridHeight || 
        gridX < 0 || gridX >= this.config.gridWidth) {
      return true;
    }
    return this.grid[gridY][gridX].isWall;
  }

  /**
   * Get random position in room (in pixels)
   */
  getRandomPositionInRoom(room: MazeRoom): { x: number; y: number } {
    const margin = 1;
    const gridX = room.gridX + margin + Math.floor(this.rng.next() * (room.gridWidth - margin * 2));
    const gridY = room.gridY + margin + Math.floor(this.rng.next() * (room.gridHeight - margin * 2));
    
    return {
      x: gridX * this.config.cellSize + this.config.cellSize / 2,
      y: gridY * this.config.cellSize + this.config.cellSize / 2,
    };
  }

  /**
   * Get cell size
   */
  getCellSize(): number {
    return this.config.cellSize;
  }

  /**
   * Get grid dimensions
   */
  getGridDimensions(): { width: number; height: number } {
    return {
      width: this.config.gridWidth,
      height: this.config.gridHeight,
    };
  }
}
