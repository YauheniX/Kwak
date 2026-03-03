/**
 * Abstraction layer for player movement input.
 *
 * Architecture decision: decoupling movement logic from input source allows
 * keyboard and virtual joystick to share a single update path in the Player
 * without either knowing about the other.
 */
export interface InputController {
  /** Horizontal axis value in the range [-1, 1]. Negative = left, positive = right. */
  getHorizontal(): number;

  /** Vertical axis value in the range [-1, 1]. Negative = up, positive = down. */
  getVertical(): number;

  /** True when any directional input is currently being applied. */
  isActive(): boolean;
}
