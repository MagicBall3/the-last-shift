import type { InputManager } from '../controls/InputManager';
import type { GameModule, Settings } from '../core/types';
import type { Player } from './Player';

/** Связывает ввод и игрока. Единственное место, где опрашивается InputManager. */
export class PlayerController implements GameModule {
  constructor(
    private readonly player: Player,
    private readonly input: InputManager,
    private readonly getSettings: () => Settings,
  ) {}

  update(dt: number): void {
    const frame = this.input.poll();
    const settings = this.getSettings();
    this.player.look(frame.lookX, frame.lookY, settings.sensitivity, settings.invertY);
    if (!this.player.transitioning) this.player.move(dt, frame.moveForward, frame.moveRight, frame.run);
  }

  dispose(): void {}
}
