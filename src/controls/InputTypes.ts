/** Единый формат ввода кадра: клавиатура, мышь и тач пишут в один и тот же объект. */
export interface InputFrame {
  /** -1..1, вперёд положительно */
  moveForward: number;
  /** -1..1, вправо положительно */
  moveRight: number;
  /** Смещение обзора в «пикселях» с прошлого кадра */
  lookX: number;
  lookY: number;
  run: boolean;
  interact: boolean;
}

export function createInputFrame(): InputFrame {
  return { moveForward: 0, moveRight: 0, lookX: 0, lookY: 0, run: false, interact: false };
}

export interface InputSource {
  attach(): void;
  detach(): void;
  reset(): void;
  /** Добавляет накопленный ввод в frame (суммирует, не перезаписывает). */
  poll(out: InputFrame): void;
}
