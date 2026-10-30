import { CONFIG } from '../core/config';
import type { InputFrame, InputSource } from './InputTypes';

/**
 * Источник ввода для тач-экрана. DOM-часть (джойстик, кнопки) — в ui/TouchOverlay.tsx,
 * она только вызывает методы этого класса.
 */
export class TouchControls implements InputSource {
  private moveRight = 0;
  private moveForward = 0;
  private lookX = 0;
  private lookY = 0;
  private running = false;
  private interactQueued = false;

  attach(): void {}
  detach(): void {}

  setMove(right: number, forward: number): void {
    this.moveRight = right;
    this.moveForward = forward;
  }

  addLook(dx: number, dy: number): void {
    this.lookX += dx * CONFIG.player.touchLookScale;
    this.lookY += dy * CONFIG.player.touchLookScale;
  }

  setRun(value: boolean): void {
    this.running = value;
  }

  queueInteract(): void {
    this.interactQueued = true;
  }

  reset(): void {
    this.moveRight = 0;
    this.moveForward = 0;
    this.lookX = 0;
    this.lookY = 0;
    this.running = false;
    this.interactQueued = false;
  }

  poll(out: InputFrame): void {
    out.moveRight += this.moveRight;
    out.moveForward += this.moveForward;
    out.lookX += this.lookX;
    out.lookY += this.lookY;
    this.lookX = 0;
    this.lookY = 0;
    if (this.running) out.run = true;
    if (this.interactQueued) {
      out.interact = true;
      this.interactQueued = false;
    }
  }
}
