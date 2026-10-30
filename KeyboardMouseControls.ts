import type { InputFrame, InputSource } from './InputTypes';

const FORWARD = ['KeyW', 'ArrowUp'] as const;
const BACK = ['KeyS', 'ArrowDown'] as const;
const LEFT = ['KeyA', 'ArrowLeft'] as const;
const RIGHT = ['KeyD', 'ArrowRight'] as const;
const RUN = ['ShiftLeft', 'ShiftRight'] as const;
// Коды физических клавиш: WASD работает и на русской раскладке.
const BLOCKED_DEFAULTS = new Set<string>([...FORWARD, ...BACK, ...LEFT, ...RIGHT, 'Space']);
const MAX_MOUSE_STEP = 250; // защита от скачков movementX при захвате указателя

export class KeyboardMouseControls implements InputSource {
  private readonly pressed = new Set<string>();
  private interactQueued = false;
  private lookX = 0;
  private lookY = 0;
  private attached = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onLockLost: () => void,
  ) {}

  attach(): void {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onLockChange);
    document.addEventListener('pointerlockerror', this.onLockError);
    this.canvas.addEventListener('click', this.onCanvasClick);
  }

  detach(): void {
    if (!this.attached) return;
    this.attached = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    document.removeEventListener('pointerlockerror', this.onLockError);
    this.canvas.removeEventListener('click', this.onCanvasClick);
    this.reset();
  }

  reset(): void {
    this.pressed.clear();
    this.interactQueued = false;
    this.lookX = 0;
    this.lookY = 0;
  }

  requestLock(): void {
    if (document.pointerLockElement === this.canvas) return;
    try {
      Promise.resolve(this.canvas.requestPointerLock() as unknown).catch(() => this.onLockLost());
    } catch {
      this.onLockLost();
    }
  }

  exitLock(): void {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  poll(out: InputFrame): void {
    out.moveForward += (this.down(FORWARD) ? 1 : 0) - (this.down(BACK) ? 1 : 0);
    out.moveRight += (this.down(RIGHT) ? 1 : 0) - (this.down(LEFT) ? 1 : 0);
    out.lookX += this.lookX;
    out.lookY += this.lookY;
    this.lookX = 0;
    this.lookY = 0;
    if (this.down(RUN)) out.run = true;
    if (this.interactQueued) {
      out.interact = true;
      this.interactQueued = false;
    }
  }

  private down(codes: readonly string[]): boolean {
    return codes.some((code) => this.pressed.has(code));
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (BLOCKED_DEFAULTS.has(e.code)) e.preventDefault();
    if (e.code === 'KeyE' && !e.repeat) this.interactQueued = true;
    this.pressed.add(e.code);
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.pressed.delete(e.code);
  };

  private readonly onBlur = (): void => {
    this.pressed.clear();
  };

  private readonly onMouseMove = (e: MouseEvent): void => {
    if (document.pointerLockElement !== this.canvas) return;
    this.lookX += Math.max(-MAX_MOUSE_STEP, Math.min(MAX_MOUSE_STEP, e.movementX));
    this.lookY += Math.max(-MAX_MOUSE_STEP, Math.min(MAX_MOUSE_STEP, e.movementY));
  };

  private readonly onLockChange = (): void => {
    if (document.pointerLockElement !== this.canvas) {
      this.pressed.clear();
      this.onLockLost();
    }
  };

  private readonly onLockError = (): void => {
    this.onLockLost();
  };

  private readonly onCanvasClick = (): void => {
    if (document.pointerLockElement !== this.canvas) this.requestLock();
  };
}
