import { InputController } from './InputController';

/**
 * Delegates to `primary` when it is active; falls back to `secondary` otherwise.
 *
 * Architecture decision: CombinedInputController lets us prioritise the virtual
 * joystick on touch devices while transparently falling back to keyboard on
 * desktop – neither the Player nor individual controllers need to know about
 * each other.
 */
export class CombinedInputController implements InputController {
  constructor(
    private readonly primary: InputController,
    private readonly secondary: InputController,
  ) {}

  getHorizontal(): number {
    return this.primary.isActive()
      ? this.primary.getHorizontal()
      : this.secondary.getHorizontal();
  }

  getVertical(): number {
    return this.primary.isActive()
      ? this.primary.getVertical()
      : this.secondary.getVertical();
  }

  isActive(): boolean {
    return this.primary.isActive() || this.secondary.isActive();
  }
}
