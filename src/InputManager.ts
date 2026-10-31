import { createInputFrame, type InputFrame, type InputSource } from './InputTypes';

export class InputManager {
  /** Последний опрошенный кадр. Читают модули, идущие после PlayerController. */
  readonly frame: InputFrame = createInputFrame();

  constructor(private readonly sources: readonly InputSource[]) {}

  attach(): void {
    for (const source of this.sources) source.attach();
  }

  detach(): void {
    for (const source of this.sources) source.detach();
  }

  reset(): void {
    for (const source of this.sources) source.reset();
    Object.assign(this.frame, createInputFrame());
  }

  poll(): InputFrame {
    const f = this.frame;
    f.moveForward = 0;
    f.moveRight = 0;
    f.lookX = 0;
    f.lookY = 0;
    f.run = false;
    f.interact = false;
    f.flashlight = false;
    for (const source of this.sources) source.poll(f);

    const length = Math.hypot(f.moveForward, f.moveRight);
    if (length > 1) {
      f.moveForward /= length;
      f.moveRight /= length;
    }
    return f;
  }
}
