import { GameConfig } from '../config/gameConfig';

/**
 * Represents a room in the dungeon
 */
export interface Room {
  id: number; // Unique room identifier
  x: number; // Top-left x coordinate in tile units
  y: number; // Top-left y coordinate in tile units
  width: number; // Width in tile units
  height: number; // Height in tile units
  centerX: number; // Center x coordinate (computed)
  centerY: number; // Center y coordinate (computed)
  type: RoomType; // Room classification
  depth: number; // Graph distance from spawn (for difficulty scaling)
}

/**
 * Room classification types
 */
export enum RoomType {
  SPAWN = 'SPAWN',
  BOSS = 'BOSS',
  TREASURE = 'TREASURE',
  ELITE = 'ELITE',
  SHOP = 'SHOP',
  COMBAT = 'COMBAT',
  SECRET = 'SECRET',
}

/**
 * Represents a corridor connecting two rooms
 */
export interface Corridor {
  x1: number; // Start x coordinate in tile units
  y1: number; // Start y coordinate in tile units
  x2: number; // End x coordinate in tile units
  y2: number; // End y coordinate in tile units
  room1Id: number; // ID of first connected room
  room2Id: number; // ID of second connected room
}

/**
 * Edge in Delaunay triangulation
 */
interface Edge {
  room1Id: number;
  room2Id: number;
  weight: number; // Distance between rooms
}

/**
 * Dungeon structure with all generation data
 */
export interface Dungeon {
  rooms: Room[];
  corridors: Corridor[];
  graph: Map<number, number[]>; // Adjacency list: roomId -> connected roomIds
  spawnRoomId: number;
  bossRoomId: number;
  treasureRoomId: number;
  shopRoomId: number;
  eliteRoomIds: number[];
  secretRoomIds: number[];
}

/**
 * Configuration for room generation
 */
export interface RoomGenerationConfig {
  roomCount?: number; // Total rooms to generate (default: 5)
  minRoomSize?: number; // Minimum room dimension (default: 6)
  maxRoomSize?: number; // Maximum room dimension (default: 20)
  mapWidth?: number; // Map bounds width in tiles (default: 100)
  mapHeight?: number; // Map bounds height in tiles (default: 100)
  roomSpacing?: number; // Minimum spacing between rooms (default: 2)
  corridorWidth?: number; // Corridor width (default: 3)
  loopEdgePercentage?: number; // Percentage of extra edges to add (default: 15)
  eliteRoomPercentage?: number; // Percentage of elite rooms (default: 10)
  secretRoomChance?: number; // Chance to generate secret room (default: 5)
  seed?: number; // Random seed for deterministic generation
  difficultyScaling?: number; // Difficulty increase per depth (default: 1.0)
}

/**
 * Seeded random number generator for deterministic dungeon generation
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
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
 * Enhanced procedural dungeon generator using graph-based approach
 * 
 * ALGORITHM:
 * 1. Generate N random rectangular rooms with collision detection
 * 2. Build connectivity graph using Delaunay triangulation
 * 3. Create Minimum Spanning Tree (Prim's algorithm)
 * 4. Add 15-20% extra edges for loops
 * 5. Generate L-shaped corridors between connected rooms
 * 6. Classify rooms (SPAWN, BOSS, TREASURE, etc.)
 * 7. Compute depth-based difficulty scaling
 */
export class RoomGenerator {
  private rooms: Room[] = [];
  private corridors: Corridor[] = [];
  private graph: Map<number, number[]> = new Map();
  private config: Required<RoomGenerationConfig>;
  private rng: SeededRandom;
  private roomIdCounter: number = 0;

  constructor(config: RoomGenerationConfig = {}) {
    // Initialize configuration with defaults
    this.config = {
      roomCount: config.roomCount ?? GameConfig.maxRooms,
      minRoomSize: config.minRoomSize ?? 6,
      maxRoomSize: config.maxRoomSize ?? GameConfig.roomWidth,
      mapWidth: config.mapWidth ?? 100,
      mapHeight: config.mapHeight ?? 100,
      roomSpacing: config.roomSpacing ?? 2,
      corridorWidth: config.corridorWidth ?? 3,
      loopEdgePercentage: config.loopEdgePercentage ?? 15,
      eliteRoomPercentage: config.eliteRoomPercentage ?? 10,
      secretRoomChance: config.secretRoomChance ?? 5,
      seed: config.seed ?? Date.now(),
      difficultyScaling: config.difficultyScaling ?? 1.0,
    };

    this.rng = new SeededRandom(this.config.seed);
  }

  /**
   * Generate complete dungeon with all features
   * @returns Dungeon structure with rooms, corridors, and metadata
   */
  generateDungeon(): Dungeon {
    // Step 1: Generate random rooms
    this.generateRooms();

    if (this.rooms.length === 0) {
      throw new Error('Failed to generate any rooms');
    }

    // Step 2: Build connectivity graph
    this.buildConnectivityGraph();

    // Step 3: Generate corridors from graph
    this.generateCorridorsFromGraph();

    // Step 4: Classify rooms
    const classification = this.classifyRooms();

    // Step 5: Compute depth and difficulty
    this.computeRoomDepth(classification.spawnRoomId);

    // Step 6: Generate secret rooms (5% chance)
    if (this.rng.next() * 100 < this.config.secretRoomChance) {
      this.generateSecretRoom();
    }

    return {
      rooms: this.rooms,
      corridors: this.corridors,
      graph: this.graph,
      spawnRoomId: classification.spawnRoomId,
      bossRoomId: classification.bossRoomId,
      treasureRoomId: classification.treasureRoomId,
      shopRoomId: classification.shopRoomId,
      eliteRoomIds: classification.eliteRoomIds,
      secretRoomIds: this.rooms.filter((r) => r.type === RoomType.SECRET).map((r) => r.id),
    };
  }

  /**
   * Step 1: Generate N random rectangular rooms
   * Reject rooms that overlap with existing rooms
   */
  private generateRooms(): void {
    this.rooms = [];
    this.roomIdCounter = 0;
    const maxAttempts = this.config.roomCount * 10;
    let attempts = 0;

    while (this.rooms.length < this.config.roomCount && attempts < maxAttempts) {
      const room = this.createRandomRoom();

      if (!this.hasOverlap(room)) {
        this.rooms.push(room);
      }

      attempts++;
    }
  }

  /**
   * Create a random room with random dimensions and position
   */
  private createRandomRoom(): Room {
    const width = this.rng.nextInt(this.config.minRoomSize, this.config.maxRoomSize);
    const height = this.rng.nextInt(this.config.minRoomSize, this.config.maxRoomSize);
    const x = this.rng.nextInt(0, this.config.mapWidth - width);
    const y = this.rng.nextInt(0, this.config.mapHeight - height);

    return {
      id: this.roomIdCounter++,
      x,
      y,
      width,
      height,
      centerX: x + width / 2,
      centerY: y + height / 2,
      type: RoomType.COMBAT, // Default, will be classified later
      depth: 0,
    };
  }

  /**
   * Check if room overlaps with any existing room (with spacing buffer)
   */
  private hasOverlap(room: Room): boolean {
    const spacing = this.config.roomSpacing;

    for (const existing of this.rooms) {
      if (
        room.x - spacing < existing.x + existing.width &&
        room.x + room.width + spacing > existing.x &&
        room.y - spacing < existing.y + existing.height &&
        room.y + room.height + spacing > existing.y
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Step 2: Build connectivity graph using Delaunay + MST + loops
   */
  private buildConnectivityGraph(): void {
    this.graph = new Map();

    // Initialize adjacency list
    for (const room of this.rooms) {
      this.graph.set(room.id, []);
    }

    // Compute Delaunay triangulation edges
    const triangulationEdges = this.computeDelaunayTriangulation();

    // Build Minimum Spanning Tree using Prim's algorithm
    const mstEdges = this.computeMinimumSpanningTree(triangulationEdges);

    // Add MST edges to graph
    for (const edge of mstEdges) {
      this.addEdgeToGraph(edge.room1Id, edge.room2Id);
    }

    // Add loop edges (percentage configured via loopEdgePercentage, default 15%)
    const remainingEdges = triangulationEdges.filter(
      (e) => !mstEdges.find((m) => this.edgesEqual(e, m))
    );
    const loopCount = Math.floor(
      (remainingEdges.length * this.config.loopEdgePercentage) / 100
    );

    for (let i = 0; i < Math.min(loopCount, remainingEdges.length); i++) {
      const edge = remainingEdges[i];
      this.addEdgeToGraph(edge.room1Id, edge.room2Id);
    }
  }

  /**
   * Compute Delaunay triangulation using Bowyer-Watson algorithm
   * (Simplified version - creates edges between nearby rooms)
   */
  private computeDelaunayTriangulation(): Edge[] {
    const edges: Edge[] = [];

    // For each pair of rooms, create an edge
    for (let i = 0; i < this.rooms.length; i++) {
      for (let j = i + 1; j < this.rooms.length; j++) {
        const room1 = this.rooms[i];
        const room2 = this.rooms[j];
        const distance = Math.sqrt(
          Math.pow(room2.centerX - room1.centerX, 2) +
            Math.pow(room2.centerY - room1.centerY, 2)
        );

        edges.push({
          room1Id: room1.id,
          room2Id: room2.id,
          weight: distance,
        });
      }
    }

    // Sort by distance
    edges.sort((a, b) => a.weight - b.weight);

    return edges;
  }

  /**
   * Compute Minimum Spanning Tree using Prim's algorithm
   */
  private computeMinimumSpanningTree(edges: Edge[]): Edge[] {
    if (this.rooms.length === 0) return [];

    const mstEdges: Edge[] = [];
    const visited = new Set<number>();
    visited.add(this.rooms[0].id);

    while (visited.size < this.rooms.length) {
      let minEdge: Edge | null = null;
      let minWeight = Infinity;

      // Find minimum edge connecting visited to unvisited
      for (const edge of edges) {
        const hasRoom1 = visited.has(edge.room1Id);
        const hasRoom2 = visited.has(edge.room2Id);

        // Edge connects visited to unvisited
        if (hasRoom1 !== hasRoom2 && edge.weight < minWeight) {
          minEdge = edge;
          minWeight = edge.weight;
        }
      }

      if (!minEdge) break; // No more connections possible

      mstEdges.push(minEdge);
      visited.add(minEdge.room1Id);
      visited.add(minEdge.room2Id);
    }

    return mstEdges;
  }

  /**
   * Add edge to adjacency list (bidirectional)
   */
  private addEdgeToGraph(room1Id: number, room2Id: number): void {
    this.graph.get(room1Id)?.push(room2Id);
    this.graph.get(room2Id)?.push(room1Id);
  }

  /**
   * Check if two edges are equal (order-independent)
   */
  private edgesEqual(e1: Edge, e2: Edge): boolean {
    return (
      (e1.room1Id === e2.room1Id && e1.room2Id === e2.room2Id) ||
      (e1.room1Id === e2.room2Id && e1.room2Id === e2.room1Id)
    );
  }

  /**
   * Step 3: Generate corridors from connectivity graph
   */
  private generateCorridorsFromGraph(): void {
    this.corridors = [];
    const processedEdges = new Set<string>();

    for (const [roomId, connectedIds] of this.graph) {
      for (const connectedId of connectedIds) {
        const edgeKey = this.getEdgeKey(roomId, connectedId);

        if (!processedEdges.has(edgeKey)) {
          processedEdges.add(edgeKey);
          this.createCorridor(roomId, connectedId);
        }
      }
    }
  }

  /**
   * Create unique edge key (order-independent)
   */
  private getEdgeKey(room1Id: number, room2Id: number): string {
    return room1Id < room2Id ? `${room1Id}-${room2Id}` : `${room2Id}-${room1Id}`;
  }

  /**
   * Create L-shaped corridor between two rooms
   */
  private createCorridor(room1Id: number, room2Id: number): void {
    const room1 = this.rooms.find((r) => r.id === room1Id);
    const room2 = this.rooms.find((r) => r.id === room2Id);

    if (!room1 || !room2) return;

    const center1X = Math.floor(room1.centerX);
    const center1Y = Math.floor(room1.centerY);
    const center2X = Math.floor(room2.centerX);
    const center2Y = Math.floor(room2.centerY);

    // Randomly choose horizontal-first or vertical-first
    if (this.rng.next() < 0.5) {
      // Horizontal then vertical
      if (center1X !== center2X) {
        this.corridors.push({
          x1: center1X,
          y1: center1Y,
          x2: center2X,
          y2: center1Y,
          room1Id,
          room2Id,
        });
      }
      if (center1Y !== center2Y) {
        this.corridors.push({
          x1: center2X,
          y1: center1Y,
          x2: center2X,
          y2: center2Y,
          room1Id,
          room2Id,
        });
      }
    } else {
      // Vertical then horizontal
      if (center1Y !== center2Y) {
        this.corridors.push({
          x1: center1X,
          y1: center1Y,
          x2: center1X,
          y2: center2Y,
          room1Id,
          room2Id,
        });
      }
      if (center1X !== center2X) {
        this.corridors.push({
          x1: center1X,
          y1: center2Y,
          x2: center2X,
          y2: center2Y,
          room1Id,
          room2Id,
        });
      }
    }
  }

  /**
   * Step 4: Classify rooms based on graph structure
   */
  private classifyRooms(): {
    spawnRoomId: number;
    bossRoomId: number;
    treasureRoomId: number;
    shopRoomId: number;
    eliteRoomIds: number[];
  } {
    // First room = SPAWN
    const spawnRoom = this.rooms[0];
    spawnRoom.type = RoomType.SPAWN;

    // Farthest room from spawn (by graph distance) = BOSS
    const distances = this.computeGraphDistances(spawnRoom.id);
    let maxDistance = 0;
    let bossRoomId = spawnRoom.id;

    for (const [roomId, distance] of distances) {
      if (distance > maxDistance) {
        maxDistance = distance;
        bossRoomId = roomId;
      }
    }

    const bossRoom = this.rooms.find((r) => r.id === bossRoomId);
    if (bossRoom) bossRoom.type = RoomType.BOSS;

    // Random mid-depth room = TREASURE
    const midDepthRooms = this.rooms.filter((r) => {
      const depth = distances.get(r.id) ?? 0;
      return depth > maxDistance * 0.3 && depth < maxDistance * 0.7;
    });

    const treasureRoom =
      midDepthRooms.length > 0
        ? midDepthRooms[Math.floor(this.rng.next() * midDepthRooms.length)]
        : this.rooms[Math.min(1, this.rooms.length - 1)];
    treasureRoom.type = RoomType.TREASURE;

    // 1 room = SHOP
    const availableRooms = this.rooms.filter(
      (r) => r.type !== RoomType.SPAWN && r.type !== RoomType.BOSS && r.type !== RoomType.TREASURE
    );
    const shopRoom =
      availableRooms.length > 0
        ? availableRooms[Math.floor(this.rng.next() * availableRooms.length)]
        : null;
    if (shopRoom) shopRoom.type = RoomType.SHOP;

    // 10% of rooms = ELITE
    const eliteCount = Math.max(
      0,
      Math.floor((this.rooms.length * this.config.eliteRoomPercentage) / 100)
    );
    const eliteRoomIds: number[] = [];

    const remainingRooms = this.rooms.filter(
      (r) =>
        r.type !== RoomType.SPAWN &&
        r.type !== RoomType.BOSS &&
        r.type !== RoomType.TREASURE &&
        r.type !== RoomType.SHOP
    );

    const shuffled = this.rng.shuffle(remainingRooms);
    for (let i = 0; i < Math.min(eliteCount, shuffled.length); i++) {
      shuffled[i].type = RoomType.ELITE;
      eliteRoomIds.push(shuffled[i].id);
    }

    return {
      spawnRoomId: spawnRoom.id,
      bossRoomId,
      treasureRoomId: treasureRoom.id,
      shopRoomId: shopRoom?.id ?? spawnRoom.id,
      eliteRoomIds,
    };
  }

  /**
   * Compute graph distances from source room using BFS
   */
  private computeGraphDistances(sourceId: number): Map<number, number> {
    const distances = new Map<number, number>();
    const queue: number[] = [sourceId];
    distances.set(sourceId, 0);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentDistance = distances.get(currentId) ?? 0;

      const neighbors = this.graph.get(currentId) ?? [];
      for (const neighborId of neighbors) {
        if (!distances.has(neighborId)) {
          distances.set(neighborId, currentDistance + 1);
          queue.push(neighborId);
        }
      }
    }

    return distances;
  }

  /**
   * Step 5: Compute room depth for difficulty scaling
   */
  private computeRoomDepth(spawnRoomId: number): void {
    const distances = this.computeGraphDistances(spawnRoomId);

    for (const room of this.rooms) {
      room.depth = distances.get(room.id) ?? 0;
    }
  }

  /**
   * Step 6: Generate secret room connected to random corridor
   */
  private generateSecretRoom(): void {
    if (this.corridors.length === 0) return;

    // Pick random corridor
    const corridor = this.corridors[Math.floor(this.rng.next() * this.corridors.length)];

    // Create small secret room near corridor midpoint
    const midX = Math.floor((corridor.x1 + corridor.x2) / 2);
    const midY = Math.floor((corridor.y1 + corridor.y2) / 2);

    const secretRoom: Room = {
      id: this.roomIdCounter++,
      x: midX - 3,
      y: midY - 3,
      width: 6,
      height: 6,
      centerX: midX,
      centerY: midY,
      type: RoomType.SECRET,
      depth: 0,
    };

    this.rooms.push(secretRoom);
    this.graph.set(secretRoom.id, [corridor.room1Id]);
    this.graph.get(corridor.room1Id)?.push(secretRoom.id);
  }

  /**
   * Get all rooms
   */
  getRooms(): Room[] {
    return this.rooms;
  }

  /**
   * Get all corridors
   */
  getCorridors(): Corridor[] {
    return this.corridors;
  }

  /**
   * Get corridor width configuration
   */
  getCorridorWidth(): number {
    return this.config.corridorWidth;
  }

  /**
   * Get random position inside a room (avoiding walls)
   */
  getRandomPositionInRoom(room: Room, minMargin: number = 2): { x: number; y: number } {
    const { tileSize } = GameConfig;
    const margin = Math.min(minMargin, Math.floor(room.width / 3), Math.floor(room.height / 3));

    // Ensure valid range
    const maxOffsetX = Math.max(0, room.width - margin * 2);
    const maxOffsetY = Math.max(0, room.height - margin * 2);

    return {
      x: (room.x + margin + Math.floor((this.rng?.next() ?? Math.random()) * maxOffsetX)) * tileSize,
      y: (room.y + margin + Math.floor((this.rng?.next() ?? Math.random()) * maxOffsetY)) * tileSize,
    };
  }

  /**
   * Get multiple random positions in a room with minimum distance
   */
  getMultiplePositionsInRoom(
    room: Room,
    count: number,
    minDistance: number = 64
  ): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const maxAttempts = count * 10;
    let attempts = 0;

    while (positions.length < count && attempts < maxAttempts) {
      const newPos = this.getRandomPositionInRoom(room);

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
   * Get position far from a given point
   * Always returns a position - if minDistance cannot be met, returns the farthest position found
   */
  getPositionFarFrom(
    room: Room,
    fromX: number,
    fromY: number,
    minDistance: number = 200,
    maxAttempts: number = 20
  ): { x: number; y: number } | null {
    let bestPos = this.getRandomPositionInRoom(room);
    let bestDistance = Math.sqrt(Math.pow(bestPos.x - fromX, 2) + Math.pow(bestPos.y - fromY, 2));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const pos = this.getRandomPositionInRoom(room);
      const distance = Math.sqrt(Math.pow(pos.x - fromX, 2) + Math.pow(pos.y - fromY, 2));

      if (distance > bestDistance) {
        bestDistance = distance;
        bestPos = pos;
      }

      if (distance >= minDistance) {
        return pos;
      }
    }

    // Return best position found (maintains backward compatibility)
    // For strict validation, caller should check distance separately
    return bestPos;
  }

  /**
   * Check if a tile position is a wall
   */
  isWall(tileX: number, tileY: number): boolean {
    const halfCorridorWidth = Math.floor(this.config.corridorWidth / 2);

    // Check if inside a corridor
    for (const corridor of this.corridors) {
      if (this.isInCorridor(tileX, tileY, corridor, halfCorridorWidth)) {
        return false;
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
        const isLeftWall = tileX === room.x;
        const isRightWall = tileX === room.x + room.width - 1;
        const isTopWall = tileY === room.y;
        const isBottomWall = tileY === room.y + room.height - 1;

        return isLeftWall || isRightWall || isTopWall || isBottomWall;
      }
    }

    return true;
  }

  /**
   * Check if tile is inside corridor
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

  /**
   * Get enemy level based on room depth and difficulty scaling
   */
  getEnemyLevel(room: Room): number {
    return 1 + Math.floor(room.depth * this.config.difficultyScaling);
  }

  /**
   * Get loot rarity based on room depth (1-5 scale)
   */
  getLootRarity(room: Room): number {
    return Math.min(5, 1 + Math.floor(room.depth / 2));
  }
}
