import Phaser from 'phaser';
import { InputController } from './InputController';

/**
 * Wraps Phaser cursor keys so they satisfy the InputController interface.
 * Returns -1/0/1 axis values based on which arrow keys are pressed.
 */
export class KeyboardInputController implements InputController {
  constructor(private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys) {}

  getHorizontal(): number {
    if (this.cursors.left.isDown) return -1;
    if (this.cursors.right.isDown) return 1;
    return 0;
  }

  getVertical(): number {
    if (this.cursors.up.isDown) return -1;
    if (this.cursors.down.isDown) return 1;
    return 0;
  }

  isActive(): boolean {
    return (
      this.cursors.left.isDown ||
      this.cursors.right.isDown ||
      this.cursors.up.isDown ||
      this.cursors.down.isDown
    );
  }
}
