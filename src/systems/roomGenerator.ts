import { GameConfig } from '../config/gameConfig';

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Tile {
  x: number;
  y: number;
  isWall: boolean;
}

export class RoomGenerator {
  private rooms: Room[] = [];

  generateRooms(count: number): Room[] {
    this.rooms = [];
    const { roomWidth, roomHeight } = GameConfig;

    for (let i = 0; i < count; i++) {
      const room: Room = {
        x: Math.floor(Math.random() * 5) * roomWidth,
        y: Math.floor(Math.random() * 5) * roomHeight,
        width: roomWidth,
        height: roomHeight,
      };

      // Avoid exact overlaps (simple check)
      const overlapping = this.rooms.some((r) => r.x === room.x && r.y === room.y);

      if (!overlapping) {
        this.rooms.push(room);
      }
    }

    // Ensure at least one room
    if (this.rooms.length === 0) {
      this.rooms.push({
        x: 0,
        y: 0,
        width: roomWidth,
        height: roomHeight,
      });
    }

    return this.rooms;
  }

  getRooms(): Room[] {
    return this.rooms;
  }

  getRandomPositionInRoom(room: Room): { x: number; y: number } {
    const { tileSize } = GameConfig;
    return {
      x: (room.x + 2 + Math.floor(Math.random() * (room.width - 4))) * tileSize,
      y: (room.y + 2 + Math.floor(Math.random() * (room.height - 4))) * tileSize,
    };
  }

  isWall(tileX: number, tileY: number): boolean {
    // Check if position is within any room
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
    // Outside all rooms = wall
    return true;
  }
}
