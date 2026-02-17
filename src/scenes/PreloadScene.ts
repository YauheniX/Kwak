import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Create loading text
    const { width, height } = this.cameras.main;
    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '32px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5);

    // Dungeon tile textures from kenney_monochrome-pirates pack
    // Menu background (preview) used by MenuScene
    this.load.image('menu-background', '/assets/preview.png');
    this.load.image(
      'dungeon-wall-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0018.png'
    );
    this.load.image(
      'dungeon-floor-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0021.png'
    );
    this.load.image(
      'player-ship-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0124.png'
    );
    this.load.image(
      'player-shovel-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0087.png'
    );
    this.load.image(
      'enemy-weak-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0127.png'
    );
    this.load.image(
      'enemy-fast-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0125.png'
    );
    this.load.image(
      'enemy-tank-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0126.png'
    );
    this.load.image(
      'merchant-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0127.png'
    );
    this.load.image(
      'treasure-locked-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0134.png'
    );
    this.load.image(
      'treasure-unlocked-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0135.png'
    );
    this.load.image(
      'treasure-chest-tile',
      'assets/kenney_monochrome-pirates/Monochrome/Tiles/tile_0101.png'
    );
  }

  create(): void {
    // Move to menu
    this.scene.start('MenuScene');
  }
}
