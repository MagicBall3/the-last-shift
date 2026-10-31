import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { GameModule, Settings } from '../core/types';
import type { Player } from '../player/Player';

/** Ставит камеру в глаза игрока и добавляет лёгкое покачивание при ходьбе. */
export class FirstPersonCamera implements GameModule {
  private phase = 0;
  private amplitude = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly player: Player,
    private readonly getSettings: () => Settings,
  ) {
    camera.rotation.order = 'YXZ';
  }

  update(dt: number): void {
    const cfg = CONFIG.player;
    const target = this.getSettings().headBob ? Math.min(this.player.speed / cfg.walkSpeed, 1.5) : 0;
    this.amplitude += (target - this.amplitude) * Math.min(1, dt * 8);
    this.phase = (this.phase + dt * (this.player.speed / cfg.stepLength) * Math.PI * 2) % (Math.PI * 4);

    const bobY = Math.sin(this.phase) * cfg.bobAmplitude * this.amplitude;
    const roll = Math.sin(this.phase / 2) * 0.004 * this.amplitude;

    const p = this.player.position;
    this.camera.position.set(p.x, p.y + cfg.eyeHeight + bobY, p.z);
    this.camera.rotation.set(this.player.pitch, this.player.yaw, roll);
    this.camera.updateMatrixWorld();
  }

  dispose(): void {}
}
