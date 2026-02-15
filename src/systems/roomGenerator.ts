import { GameConfig } from '../config/gameConfig';

/**
 * Represents a room in the dungeon
 */
export interface Room {
  x: number; // Top-left x coordinate in tile units
  y: number; // Top-left y coordinate in tile units
  width: number; // Width in tile units
  height: number; // Height in tile units
}

/**
 * Represents a corridor connecting two rooms
 */
export interface Corridor {
  x1: number; // Start x coordinate in tile units
  y1: number; // Start y coordinate in tile units
  x2: number; // End x coordinate in tile units
  y2: number; // End y coordinate in tile units
}

/**
 * Configuration for room generation
 */
export interface RoomGenerationConfig {
  // Total number of rooms to generate (default: from GameConfig.maxRooms)
  roomCount?: number;
  // Minimum room width in tiles (default: 8)
  minRoomWidth?: number;
  // Maximum room width in tiles (default: from GameConfig.roomWidth)
  maxRoomWidth?: number;
  // Minimum room height in tiles (default: 6)
  minRoomHeight?: number;
  // Maximum room height in tiles (default: from GameConfig.roomHeight)
  maxRoomHeight?: number;
  // Maximum placement attempts per room (default: 30)
  maxPlacementAttempts?: number;
  // Minimum distance between rooms in tiles (default: 2)
  minRoomSpacing?: number;
  // Corridor width in tiles (default: 3)
  corridorWidth?: number;
}

/**
 * Enhanced procedural dungeon room generator
 * Generates interconnected rooms with corridors ensuring all areas are reachable
 */
export class RoomGenerator {
  private rooms: Room[] = [];
  private corridors: Corridor[] = [];
  private config: Required<RoomGenerationConfig>;

  constructor(config: RoomGenerationConfig = {}) {
    // Initialize configuration with defaults
    this.config = {
      roomCount: config.roomCount ?? GameConfig.maxRooms,
      minRoomWidth: config.minRoomWidth ?? 8,
      maxRoomWidth: config.maxRoomWidth ?? GameConfig.roomWidth,
      minRoomHeight: config.minRoomHeight ?? 6,
      maxRoomHeight: config.maxRoomHeight ?? GameConfig.roomHeight,
      maxPlacementAttempts: config.maxPlacementAttempts ?? 30,
      minRoomSpacing: config.minRoomSpacing ?? 2,
      corridorWidth: config.corridorWidth ?? 3,
    };
  }

  /**
   * Generate a dungeon with the specified number of rooms
   * Ensures all rooms are connected via corridors
   * @param count Number of rooms to generate (overrides config if provided)
   * @returns Array of generated rooms
   */
  generateRooms(count?: number): Room[] {
    this.rooms = [];
    this.corridors = [];
    const targetRoomCount = count ?? this.config.roomCount;

    // Ensure at least one room is generated
    const actualRoomCount = Math.max(1, targetRoomCount);

    // Generate the first room at the origin
    const firstRoom = this.createRoom(0, 0);
    this.rooms.push(firstRoom);

    // Generate additional rooms
    for (let i = 1; i < actualRoomCount; i++) {
      const newRoom = this.placeNewRoom();
      if (newRoom) {
        this.rooms.push(newRoom);
        // Connect the new room to the nearest existing room
        this.connectRoomToNearest(newRoom);
      }
    }

    return this.rooms;
  }

  /**
   * Create a room with randomized dimensions
   * @param centerX Approximate center x position in tile units
   * @param centerY Approximate center y position in tile units
   * @returns A new room
   */
  private createRoom(centerX: number, centerY: number): Room {
    const width =
      this.config.minRoomWidth +
      Math.floor(Math.random() * (this.config.maxRoomWidth - this.config.minRoomWidth + 1));
    const height =
      this.config.minRoomHeight +
      Math.floor(Math.random() * (this.config.maxRoomHeight - this.config.minRoomHeight + 1));

    return {
      x: Math.floor(centerX - width / 2),
      y: Math.floor(centerY - height / 2),
      width,
      height,
    };
  }

  /**
   * Attempt to place a new room that doesn't overlap with existing rooms
   * @returns A new room or null if placement failed
   */
  private placeNewRoom(): Room | null {
    for (let attempt = 0; attempt < this.config.maxPlacementAttempts; attempt++) {
      // Pick a random existing room to place the new room near
      const existingRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];

      // Generate random offset from the existing room
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 20; // Distance in tiles

      const centerX = Math.floor(
        existingRoom.x + existingRoom.width / 2 + Math.cos(angle) * distance
      );
      const centerY = Math.floor(
        existingRoom.y + existingRoom.height / 2 + Math.sin(angle) * distance
      );

      const newRoom = this.createRoom(centerX, centerY);

      // Check if the new room overlaps with any existing room
      if (!this.hasOverlap(newRoom)) {
        return newRoom;
      }
    }

    return null;
  }

  /**
   * Check if a room overlaps with any existing rooms (including spacing)
   * @param room Room to check
   * @returns true if there is an overlap, false otherwise
   */
  private hasOverlap(room: Room): boolean {
    const spacing = this.config.minRoomSpacing;

    for (const existingRoom of this.rooms) {
      // Check if rooms overlap (with spacing buffer)
      if (
        room.x - spacing < existingRoom.x + existingRoom.width &&
        room.x + room.width + spacing > existingRoom.x &&
        room.y - spacing < existingRoom.y + existingRoom.height &&
        room.y + room.height + spacing > existingRoom.y
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Connect a room to the nearest existing room via a corridor
   * @param room Room to connect
   */
  private connectRoomToNearest(room: Room): void {
    let nearestRoom: Room | null = null;
    let minDistance = Infinity;

    // Find the nearest room
    for (const existingRoom of this.rooms) {
      if (existingRoom === room) continue;

      const distance = this.getDistanceBetweenRooms(room, existingRoom);
      if (distance < minDistance) {
        minDistance = distance;
        nearestRoom = existingRoom;
      }
    }

    if (nearestRoom) {
      this.createCorridor(room, nearestRoom);
    }
  }

  /**
   * Calculate the distance between two room centers
   * @param room1 First room
   * @param room2 Second room
   * @returns Distance between room centers
   */
  private getDistanceBetweenRooms(room1: Room, room2: Room): number {
    const center1X = room1.x + room1.width / 2;
    const center1Y = room1.y + room1.height / 2;
    const center2X = room2.x + room2.width / 2;
    const center2Y = room2.y + room2.height / 2;

    return Math.sqrt(Math.pow(center2X - center1X, 2) + Math.pow(center2Y - center1Y, 2));
  }

  /**
   * Create a corridor connecting two rooms
   * Uses L-shaped corridors (horizontal then vertical or vice versa)
   * @param room1 First room
   * @param room2 Second room
   */
  private createCorridor(room1: Room, room2: Room): void {
    const center1X = Math.floor(room1.x + room1.width / 2);
    const center1Y = Math.floor(room1.y + room1.height / 2);
    const center2X = Math.floor(room2.x + room2.width / 2);
    const center2Y = Math.floor(room2.y + room2.height / 2);

    // Randomly choose to go horizontal first or vertical first
    if (Math.random() < 0.5) {
      // Horizontal then vertical
      this.corridors.push({ x1: center1X, y1: center1Y, x2: center2X, y2: center1Y });
      this.corridors.push({ x1: center2X, y1: center1Y, x2: center2X, y2: center2Y });
    } else {
      // Vertical then horizontal
      this.corridors.push({ x1: center1X, y1: center1Y, x2: center1X, y2: center2Y });
      this.corridors.push({ x1: center1X, y1: center2Y, x2: center2X, y2: center2Y });
    }
  }

  /**
   * Get all generated rooms
   * @returns Array of rooms
   */
  getRooms(): Room[] {
    return this.rooms;
  }

  /**
   * Get all generated corridors
   * @returns Array of corridors
   */
  getCorridors(): Corridor[] {
    return this.corridors;
  }

  /**
   * Get a random position inside a room (avoiding walls)
   * @param room Room to get position from
   * @param minMargin Minimum margin from walls in tiles (default: 2)
   * @returns Position in world coordinates (pixels)
   */
  getRandomPositionInRoom(room: Room, minMargin: number = 2): { x: number; y: number } {
    const { tileSize } = GameConfig;
    const margin = Math.min(minMargin, Math.floor(room.width / 3), Math.floor(room.height / 3));

    return {
      x: (room.x + margin + Math.floor(Math.random() * (room.width - margin * 2))) * tileSize,
      y: (room.y + margin + Math.floor(Math.random() * (room.height - margin * 2))) * tileSize,
    };
  }

  /**
   * Get multiple random positions in a room
   * Useful for spawning multiple enemies or loot items
   * @param room Room to get positions from
   * @param count Number of positions to generate
   * @param minDistance Minimum distance between positions in pixels (default: 64)
   * @returns Array of positions in world coordinates
   */
  getMultiplePositionsInRoom(
    room: Room,
    count: number,
    minDistance: number = 64
  ): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const maxAttempts = count * 10; // Prevent infinite loops
    let attempts = 0;

    while (positions.length < count && attempts < maxAttempts) {
      const newPos = this.getRandomPositionInRoom(room);

      // Check distance from all existing positions
      let validPosition = true;
      for (const existingPos of positions) {
        const distance = Math.sqrt(
          Math.pow(newPos.x - existingPos.x, 2) + Math.pow(newPos.y - existingPos.y, 2)
        );
        if (distance < minDistance) {
          validPosition = false;
          break;
        }
      }

      if (validPosition) {
        positions.push(newPos);
      }

      attempts++;
    }

    return positions;
  }

  /**
   * Get a position in a room that is far from a given point
   * Useful for spawning enemies away from player
   * @param room Room to get position from
   * @param fromX X coordinate to be far from (in pixels)
   * @param fromY Y coordinate to be far from (in pixels)
   * @param minDistance Minimum distance in pixels (default: 200)
   * @param maxAttempts Maximum placement attempts (default: 20)
   * @returns Position in world coordinates or null if no valid position found
   */
  getPositionFarFrom(
    room: Room,
    fromX: number,
    fromY: number,
    minDistance: number = 200,
    maxAttempts: number = 20
  ): { x: number; y: number } | null {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const pos = this.getRandomPositionInRoom(room);
      const distance = Math.sqrt(Math.pow(pos.x - fromX, 2) + Math.pow(pos.y - fromY, 2));

      if (distance >= minDistance) {
        return pos;
      }
    }

    // If we can't find a position far enough, return the farthest position we can find
    return this.getRandomPositionInRoom(room);
  }

  /**
   * Check if a tile position is a wall
   * Considers both room walls and corridor walls
   * @param tileX Tile x coordinate
   * @param tileY Tile y coordinate
   * @returns true if the tile is a wall, false otherwise
   */
  isWall(tileX: number, tileY: number): boolean {
    const halfCorridorWidth = Math.floor(this.config.corridorWidth / 2);

    // Check if inside a corridor
    for (const corridor of this.corridors) {
      if (this.isInCorridor(tileX, tileY, corridor, halfCorridorWidth)) {
        return false; // Inside corridor, not a wall
      }
    }

    // Check if inside a room
    for (const room of this.rooms) {
      if (
        tileX >= room.x &&
        tileX < room.x + room.width &&
        tileY >= room.y &&
        tileY < room.y + room.height
      ) {
        // Inside room - check if it's a border
        const isLeftWall = tileX === room.x;
        const isRightWall = tileX === room.x + room.width - 1;
        const isTopWall = tileY === room.y;
        const isBottomWall = tileY === room.y + room.height - 1;

        return isLeftWall || isRightWall || isTopWall || isBottomWall;
      }
    }

    // Outside all rooms and corridors = wall
    return true;
  }

  /**
   * Check if a tile is inside a corridor
   * @param tileX Tile x coordinate
   * @param tileY Tile y coordinate
   * @param corridor Corridor to check
   * @param halfWidth Half of corridor width
   * @returns true if inside corridor, false otherwise
   */
  private isInCorridor(
    tileX: number,
    tileY: number,
    corridor: Corridor,
    halfWidth: number
  ): boolean {
    const { x1, y1, x2, y2 } = corridor;

    // Horizontal corridor
    if (y1 === y2) {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      return (
        tileX >= minX &&
        tileX <= maxX &&
        tileY >= y1 - halfWidth &&
        tileY <= y1 + halfWidth
      );
    }

    // Vertical corridor
    if (x1 === x2) {
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      return (
        tileY >= minY &&
        tileY <= maxY &&
        tileX >= x1 - halfWidth &&
        tileX <= x1 + halfWidth
      );
    }

    return false;
  }
}
