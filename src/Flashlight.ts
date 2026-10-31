import * as THREE from 'three';
import { audio } from '../audio/AudioManager';
import type { InputManager } from '../controls/InputManager';
import { CONFIG } from '../core/config';
import type { GameModule } from '../core/types';

/** Фонарь на камере. Включение — F или кнопка на экране. Лампа всегда есть на сцене (яркость 0 = выключен). */
export class Flashlight implements GameModule {
  private readonly spot: THREE.SpotLight;
  private on = true;
  private level = 1;

  constructor(
    camera: THREE.PerspectiveCamera,
    private readonly input: InputManager,
  ) {
    const cfg = CONFIG.flashlight;
    this.spot = new THREE.SpotLight(cfg.color, cfg.intensity, cfg.distance, cfg.angle, cfg.penumbra, 2);
    this.spot.position.set(0.12, -0.1, 0);
    this.spot.target.position.set(0, 0, -5);
    camera.add(this.spot);
    camera.add(this.spot.target);
  }

  update(dt: number): void {
    if (this.input.frame.flashlight) {
      this.on = !this.on;
      audio.playClick();
    }
    const target = this.on ? 1 : 0;
    this.level += Math.max(-dt * 12, Math.min(dt * 12, target - this.level));
    this.spot.intensity = CONFIG.flashlight.intensity * this.level;
  }

  dispose(): void {}
}
