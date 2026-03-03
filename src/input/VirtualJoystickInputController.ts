import Phaser from 'phaser';
import { InputController } from './InputController';

export interface VirtualJoystickConfig {
  /** Screen-space X of the joystick base centre (pixels from left). */
  baseX: number;
  /** Screen-space Y of the joystick base centre (pixels from top). */
  baseY: number;
  /** Maximum distance (px) the knob travels from the centre. */
  maxRadius: number;
  /**
   * Minimum normalised stick distance [0-1] before input registers.
   * Prevents accidental tiny movements being treated as intentional input.
   */
  deadzone: number;
  /** Visual radius of the static base ring (px). */
  baseRadius: number;
  /** Visual radius of the movable knob (px). */
  knobRadius: number;
}

const DEFAULTS: VirtualJoystickConfig = {
  baseX: 90,
  baseY: 0, // overridden at construction time using camera height
  maxRadius: 60,
  deadzone: 0.1,
  baseRadius: 60,
  knobRadius: 28,
};

/**
 * Custom fixed-position virtual joystick built with Phaser Graphics and Pointer events.
 *
 * Architecture decisions:
 *  - Uses screen-space coordinates (pointer.x / pointer.y, not worldX/worldY) so the
 *    joystick stays in the bottom-left corner regardless of camera scroll.
 *  - setScrollFactor(0) anchors graphics to the camera viewport.
 *  - Pointer event handlers are stored as bound class methods so they can be cleanly
 *    removed in destroy() – no memory leaks.
 *  - Deadzone and maxRadius are configurable; getHorizontal/getVertical return
 *    values in [-1, 1], fully normalised.
 */
export class VirtualJoystickInputController implements InputController {
  private readonly cfg: VirtualJoystickConfig;

  private readonly baseGfx: Phaser.GameObjects.Graphics;
  private readonly knobGfx: Phaser.GameObjects.Graphics;

  private horz: number = 0;
  private vert: number = 0;
  private touching: boolean = false;
  private activePointerId: number | null = null;

  // Bound handlers kept as fields so they can be removed from the emitter.
  private readonly boundDown: (p: Phaser.Input.Pointer) => void;
  private readonly boundMove: (p: Phaser.Input.Pointer) => void;
  private readonly boundUp: (p: Phaser.Input.Pointer) => void;
  private readonly boundResize: () => void;

  constructor(
    private readonly scene: Phaser.Scene,
    config: Partial<VirtualJoystickConfig> = {},
  ) {
    this.cfg = {
      ...DEFAULTS,
      baseY: scene.cameras.main.height - 90,
      ...config,
    };

    // Graphics rendered in screen-space (camera-fixed).
    this.baseGfx = scene.add.graphics().setScrollFactor(0).setDepth(200);
    this.knobGfx = scene.add.graphics().setScrollFactor(0).setDepth(201);

    this.drawBase();
    this.drawKnob(0, 0);

    // Bind once so the same function reference can be passed to both on() and off().
    this.boundDown = this.handlePointerDown.bind(this);
    this.boundMove = this.handlePointerMove.bind(this);
    this.boundUp = this.handlePointerUp.bind(this);
    this.boundResize = this.handleResize.bind(this);

    scene.input.on('pointerdown', this.boundDown);
    scene.input.on('pointermove', this.boundMove);
    scene.input.on('pointerup', this.boundUp);
    // Reposition joystick when the browser window is resized.
    scene.scale.on('resize', this.boundResize);
  }

  // ─── InputController interface ───────────────────────────────────────────

  getHorizontal(): number {
    return this.horz;
  }

  getVertical(): number {
    return this.vert;
  }

  isActive(): boolean {
    return this.touching && (Math.abs(this.horz) > 0 || Math.abs(this.vert) > 0);
  }

  // ─── Public helpers ───────────────────────────────────────────────────────

  /**
   * Returns true when the given screen-space point falls inside the joystick
   * hit area.  Used by the scene's pointer handler to skip world-space
   * interactions while the joystick is being touched.
   */
  isPointerInArea(screenX: number, screenY: number): boolean {
    const dx = screenX - this.cfg.baseX;
    const dy = screenY - this.cfg.baseY;
    // Slightly enlarged hit area improves thumb usability.
    return Math.sqrt(dx * dx + dy * dy) <= this.cfg.baseRadius * 1.5;
  }

  /** Removes all event listeners and destroys Phaser graphics objects. */
  destroy(): void {
    this.scene.input.off('pointerdown', this.boundDown);
    this.scene.input.off('pointermove', this.boundMove);
    this.scene.input.off('pointerup', this.boundUp);
    this.scene.scale.off('resize', this.boundResize);
    this.baseGfx.destroy();
    this.knobGfx.destroy();
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    // Only grab the first pointer that touches the joystick area.
    if (this.activePointerId !== null) return;
    if (!this.isPointerInArea(pointer.x, pointer.y)) return;

    this.activePointerId = pointer.id;
    this.touching = true;
    this.updateFromScreen(pointer.x, pointer.y);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId || !pointer.isDown) return;
    this.updateFromScreen(pointer.x, pointer.y);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId) return;
    this.release();
  }

  private handleResize(): void {
    this.cfg.baseY = this.scene.cameras.main.height - 90;
    this.drawBase();
    this.drawKnob(0, 0);
  }

  /**
   * Converts raw screen-space pointer position into a normalised axis vector,
   * applies the deadzone, clamps to maxRadius, and redraws the knob.
   * No heap allocations per call – all maths uses primitive numbers.
   */
  private updateFromScreen(screenX: number, screenY: number): void {
    const dx = screenX - this.cfg.baseX;
    const dy = screenY - this.cfg.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Direction unit vector (safe: avoids division by zero).
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;

    // Clamped knob offset in pixels.
    const clamped = Math.min(dist, this.cfg.maxRadius);

    // Normalised [0, 1] magnitude after deadzone.
    const magnitude = clamped / this.cfg.maxRadius;
    if (magnitude < this.cfg.deadzone) {
      this.horz = 0;
      this.vert = 0;
    } else {
      this.horz = nx * magnitude;
      this.vert = ny * magnitude;
    }

    this.drawKnob(nx * clamped, ny * clamped);
  }

  private release(): void {
    this.horz = 0;
    this.vert = 0;
    this.touching = false;
    this.activePointerId = null;
    this.drawKnob(0, 0);
  }

  private drawBase(): void {
    this.baseGfx.clear();
    this.baseGfx.fillStyle(0x000000, 0.35);
    this.baseGfx.lineStyle(2, 0xffffff, 0.4);
    this.baseGfx.fillCircle(this.cfg.baseX, this.cfg.baseY, this.cfg.baseRadius);
    this.baseGfx.strokeCircle(this.cfg.baseX, this.cfg.baseY, this.cfg.baseRadius);
  }

  private drawKnob(offsetX: number, offsetY: number): void {
    this.knobGfx.clear();
    this.knobGfx.fillStyle(0xffffff, 0.65);
    this.knobGfx.fillCircle(
      this.cfg.baseX + offsetX,
      this.cfg.baseY + offsetY,
      this.cfg.knobRadius,
    );
  }
}
