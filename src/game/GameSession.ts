import { FirstPersonCamera } from '../camera/FirstPersonCamera';
import type { TouchControls } from '../controls/TouchControls';
import { InputManager } from '../controls/InputManager';
import { KeyboardMouseControls } from '../controls/KeyboardMouseControls';
import { audio } from '../audio/AudioManager';
import { CONFIG } from '../core/config';
import { Engine } from '../core/Engine';
import type { GameEvents, Settings } from '../core/types';
import { InteractionSystem } from '../interactions/InteractionSystem';
import { Flashlight } from '../lighting/Flashlight';
import { Lighting } from '../lighting/Lighting';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { World } from '../world/World';
import { LevelTransitions } from '../world/levels/LevelTransitions';

export interface SessionOptions {
  container: HTMLElement;
  settings: Settings;
  touch: TouchControls;
  isTouch: boolean;
  events: GameEvents;
}

/**
 * Корень композиции: собирает движок и все игровые модули.
 * React ничего не знает о Three.js — он только создаёт/уничтожает сессию и вызывает pause/resume.
 * ПОРЯДОК update(): ввод -> игрок -> камера -> взаимодействия -> мир (двери) -> фонарь -> освещение.
 */
export class GameSession {
  private readonly engine: Engine;
  private readonly input: InputManager;
  private readonly keyboard: KeyboardMouseControls;
  private readonly resizeObserver: ResizeObserver;
  private settings: Settings;

  static create(options: SessionOptions): GameSession {
    const canvas = document.createElement('canvas');
    canvas.className = 'game-canvas';
    options.container.appendChild(canvas);
    try {
      return new GameSession(canvas, options);
    } catch (error) {
      canvas.remove();
      throw error;
    }
  }

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: SessionOptions,
  ) {
    this.settings = options.settings;
    this.engine = new Engine(canvas, options.settings.quality);

    const world = new World();
    this.engine.scene.add(world.group);
    const player = new Player(world.spawn, world.spawnYaw, world.collision);
    world.attachPlayer(player.position);

    this.keyboard = new KeyboardMouseControls(canvas, options.events.onLockLost);
    this.input = new InputManager([this.keyboard, options.touch]);
    const getSettings = (): Settings => this.settings;

    this.engine.addModule(new PlayerController(player, this.input, getSettings));
    this.engine.addModule(new LevelTransitions(world.levels, player));
    this.engine.addModule(new FirstPersonCamera(this.engine.camera, player, getSettings));
    this.engine.addModule(
      new InteractionSystem(this.engine.camera, world.interactables, this.input, options.events),
    );
    this.engine.addModule(world);
    this.engine.addModule(new Flashlight(this.engine.camera, this.input));
    this.engine.addModule(
      new Lighting(
        this.engine.scene,
        this.engine.camera,
        world.lights,
        CONFIG.lighting.pool[options.settings.quality],
        () => world.activeLevel,
      ),
    );

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(options.container);
    this.handleResize();
  }

  applySettings(settings: Settings): void {
    this.settings = settings;
    this.engine.setQuality(settings.quality);
  }

  resume(): void {
    this.input.reset();
    this.input.attach();
    this.engine.start();
    audio.resume();
    if (!this.options.isTouch) this.keyboard.requestLock();
  }

  pause(): void {
    this.engine.stop();
    this.input.detach();
    this.input.reset();
    this.keyboard.exitLock();
    audio.suspend();
  }

  dispose(): void {
    this.input.detach();
    this.keyboard.exitLock();
    this.resizeObserver.disconnect();
    this.engine.dispose();
    this.canvas.remove();
  }

  private handleResize(): void {
    const { clientWidth, clientHeight } = this.options.container;
    if (clientWidth > 0 && clientHeight > 0) this.engine.resize(clientWidth, clientHeight);
  }
}
