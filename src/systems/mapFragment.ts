import Phaser from 'phaser';
import { Room } from './roomGenerator';
import { VisualStyle } from '../config/visualStyle';

/**
 * Fragment location type
 */
export enum FragmentLocationType {
  ROOM = 'ROOM',
  MERCHANT = 'MERCHANT',
}

/**
 * Fragment state
 */
export enum FragmentState {
  UNCOLLECTED = 'UNCOLLECTED',
  COLLECTED = 'COLLECTED',
  AVAILABLE_FOR_PURCHASE = 'AVAILABLE_FOR_PURCHASE',
  PURCHASED = 'PURCHASED',
}

/**
 * Fragment data structure with type safety
 */
export interface MapFragmentData {
  id: number;
  state: FragmentState;
  locationType: FragmentLocationType;
  roomId?: number;
  x: number;
  y: number;
  cost?: number; // Cost if available for purchase
}

/**
 * Map fragment configuration
 */
export interface MapFragmentConfig {
  minFragments?: number; // Minimum fragments per game (default: 3)
  maxFragments?: number; // Maximum fragments per game (default: 5)
  merchantFragmentChance?: number; // Chance merchant has fragment (default: 0.5)
  fragmentPurchaseCost?: number; // Cost to purchase from merchant (default: 100)
  collectedColor?: number; // Color for collected fragments
  uncollectedColor?: number; // Color for uncollected fragments
  purchasableColor?: number; // Color for purchasable fragments
  fragmentSize?: number; // Size of fragment visual
}

/**
 * Visual representation of a map fragment
 */
export class MapFragmentSprite {
  public sprite: Phaser.GameObjects.Arc;
  public fragmentData: MapFragmentData;
  private glowEffect?: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, data: MapFragmentData, size: number, color: number) {
    this.fragmentData = data;
    
    // Create main sprite
    this.sprite = scene.add.circle(data.x, data.y, size, color);
    scene.physics.add.existing(this.sprite, true); // static body
    
    // Add glow effect for uncollected fragments
    if (data.state === FragmentState.UNCOLLECTED) {
      this.glowEffect = scene.add.circle(data.x, data.y, size + 4, color, 0.3);
      this.glowEffect.setDepth(this.sprite.depth - 1);
      
      // Pulsing animation
      scene.tweens.add({
        targets: this.glowEffect,
        alpha: { from: 0.3, to: 0.6 },
        scale: { from: 1, to: 1.2 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  /**
   * Update fragment visual state
   */
  updateState(newState: FragmentState, color: number): void {
    this.fragmentData.state = newState;
    this.sprite.setFillStyle(color);
    
    // Remove glow effect when collected
    if (newState === FragmentState.COLLECTED && this.glowEffect) {
      this.glowEffect.destroy();
      this.glowEffect = undefined;
    }
  }

  /**
   * Destroy the fragment sprite
   */
  destroy(): void {
    this.sprite.destroy();
    if (this.glowEffect) {
      this.glowEffect.destroy();
    }
  }
}

/**
 * Map Fragment System
 * Manages fragment generation, placement, collection, and purchasing
 */
export class MapFragmentSystem {
  private fragments: MapFragmentData[] = [];
  private fragmentSprites: Map<number, MapFragmentSprite> = new Map();
  private config: Required<MapFragmentConfig>;
  private fragmentIdCounter: number = 0;
  private collectedCount: number = 0;

  constructor(config: MapFragmentConfig = {}) {
    this.config = {
      minFragments: config.minFragments ?? 3,
      maxFragments: config.maxFragments ?? 5,
      merchantFragmentChance: config.merchantFragmentChance ?? 0.5,
      fragmentPurchaseCost: config.fragmentPurchaseCost ?? 100,
      collectedColor: config.collectedColor ?? VisualStyle.ColorNumbers.fragmentCollected,
      uncollectedColor: config.uncollectedColor ?? VisualStyle.ColorNumbers.fragmentUncollected,
      purchasableColor: config.purchasableColor ?? VisualStyle.ColorNumbers.fragmentPurchasable,
      fragmentSize: config.fragmentSize ?? VisualStyle.FragmentVisual.size,
    };
  }

  /**
   * Generate fragment distribution across rooms and merchant
   */
  generateFragments(rooms: Room[], shopRoomId: number): MapFragmentData[] {
    this.fragments = [];
    this.fragmentIdCounter = 0;

    // Determine total number of fragments for this game
    const totalFragments = Math.floor(
      Math.random() * (this.config.maxFragments - this.config.minFragments + 1) + 
      this.config.minFragments
    );

    // Determine if merchant will have a fragment
    const merchantHasFragment = Math.random() < this.config.merchantFragmentChance;
    const fragmentsInRooms = merchantHasFragment ? totalFragments - 1 : totalFragments;

    // Distribute fragments across rooms (excluding shop room)
    const availableRooms = rooms.filter(room => room.id !== shopRoomId);
    
    for (let i = 0; i < fragmentsInRooms; i++) {
      const room = availableRooms[i % availableRooms.length];
      this.fragments.push({
        id: this.fragmentIdCounter++,
        state: FragmentState.UNCOLLECTED,
        locationType: FragmentLocationType.ROOM,
        roomId: room.id,
        x: 0, // Will be set during placement
        y: 0, // Will be set during placement
      });
    }

    // Add merchant fragment if applicable
    if (merchantHasFragment) {
      const shopRoom = rooms.find(r => r.id === shopRoomId);
      if (shopRoom) {
        this.fragments.push({
          id: this.fragmentIdCounter++,
          state: FragmentState.AVAILABLE_FOR_PURCHASE,
          locationType: FragmentLocationType.MERCHANT,
          roomId: shopRoom.id,
          x: 0, // Will be set during merchant creation
          y: 0, // Will be set during merchant creation
          cost: this.config.fragmentPurchaseCost,
        });
      }
    }

    return this.fragments;
  }

  /**
   * Create visual sprites for fragments
   */
  createFragmentSprites(scene: Phaser.Scene): Map<number, MapFragmentSprite> {
    this.fragmentSprites.clear();

    for (const fragmentData of this.fragments) {
      let color: number;
      
      switch (fragmentData.state) {
        case FragmentState.COLLECTED:
        case FragmentState.PURCHASED:
          color = this.config.collectedColor;
          break;
        case FragmentState.AVAILABLE_FOR_PURCHASE:
          color = this.config.purchasableColor;
          break;
        case FragmentState.UNCOLLECTED:
        default:
          color = this.config.uncollectedColor;
          break;
      }

      const sprite = new MapFragmentSprite(
        scene,
        fragmentData,
        this.config.fragmentSize,
        color
      );
      
      this.fragmentSprites.set(fragmentData.id, sprite);
    }

    return this.fragmentSprites;
  }

  /**
   * Collect a fragment
   */
  collectFragment(fragmentId: number): boolean {
    const fragment = this.fragments.find(f => f.id === fragmentId);
    if (!fragment || fragment.state !== FragmentState.UNCOLLECTED) {
      return false;
    }

    fragment.state = FragmentState.COLLECTED;
    this.collectedCount++;

    // Update sprite visual
    const sprite = this.fragmentSprites.get(fragmentId);
    if (sprite) {
      sprite.destroy();
      this.fragmentSprites.delete(fragmentId);
    }

    return true;
  }

  /**
   * Purchase a fragment from merchant
   */
  purchaseFragment(fragmentId: number): { success: boolean; cost: number } {
    const fragment = this.fragments.find(f => f.id === fragmentId);
    
    if (!fragment || fragment.state !== FragmentState.AVAILABLE_FOR_PURCHASE) {
      return { success: false, cost: 0 };
    }

    const cost = fragment.cost ?? this.config.fragmentPurchaseCost;
    
    // Note: Currency check should be done by caller
    fragment.state = FragmentState.PURCHASED;
    this.collectedCount++;

    // Update sprite visual
    const sprite = this.fragmentSprites.get(fragmentId);
    if (sprite) {
      sprite.destroy();
      this.fragmentSprites.delete(fragmentId);
    }

    return { success: true, cost };
  }

  /**
   * Get total number of fragments
   */
  getTotalFragments(): number {
    return this.fragments.length;
  }

  /**
   * Get collected fragment count
   */
  getCollectedCount(): number {
    return this.collectedCount;
  }

  /**
   * Get all fragments
   */
  getFragments(): MapFragmentData[] {
    return [...this.fragments];
  }

  /**
   * Get fragment by ID
   */
  getFragment(fragmentId: number): MapFragmentData | undefined {
    return this.fragments.find(f => f.id === fragmentId);
  }

  /**
   * Get fragments by room
   */
  getFragmentsByRoom(roomId: number): MapFragmentData[] {
    return this.fragments.filter(f => f.roomId === roomId);
  }

  /**
   * Get merchant fragments (purchasable)
   */
  getMerchantFragments(): MapFragmentData[] {
    return this.fragments.filter(f => f.locationType === FragmentLocationType.MERCHANT);
  }

  /**
   * Check if all fragments are collected
   */
  areAllFragmentsCollected(): boolean {
    return this.collectedCount === this.fragments.length;
  }

  /**
   * Get fragment sprite by ID
   */
  getFragmentSprite(fragmentId: number): MapFragmentSprite | undefined {
    return this.fragmentSprites.get(fragmentId);
  }

  /**
   * Update fragment position (useful for procedural placement)
   */
  updateFragmentPosition(fragmentId: number, x: number, y: number): void {
    const fragment = this.fragments.find(f => f.id === fragmentId);
    if (fragment) {
      fragment.x = x;
      fragment.y = y;
    }
  }

  /**
   * Reset the system (for new game)
   */
  reset(): void {
    // Destroy all sprites
    this.fragmentSprites.forEach(sprite => sprite.destroy());
    this.fragmentSprites.clear();
    
    this.fragments = [];
    this.fragmentIdCounter = 0;
    this.collectedCount = 0;
  }
}
