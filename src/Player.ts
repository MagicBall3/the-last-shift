import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { CollisionQuery } from '../core/types';

/** Состояние и физика игрока: позиция на полу, углы обзора, движение с простыми столкновениями. */
export class Player {
  /** Позиция ног. Высота глаз добавляется в FirstPersonCamera. */
  readonly position: THREE.Vector3;
  yaw: number;
  pitch = 0;
  /** Текущая горизонтальная скорость, м/с (для покачивания камеры и будущих шагов). */
  speed = 0;

  private vx = 0;
  private vz = 0;

  constructor(
    spawn: THREE.Vector3,
    yaw: number,
    private readonly collision: CollisionQuery,
  ) {
    this.position = spawn.clone();
    this.yaw = yaw;
  }

  look(dx: number, dy: number, sensitivity: number, invertY: boolean): void {
    const k = CONFIG.player.lookRadPerPixel * sensitivity;
    this.yaw -= dx * k;
    this.pitch -= (invertY ? -dy : dy) * k;
    const max = CONFIG.player.maxPitch;
    this.pitch = Math.max(-max, Math.min(max, this.pitch));
  }

  move(dt: number, forward: number, right: number, run: boolean): void {
    const cfg = CONFIG.player;
    const target = run ? cfg.runSpeed : cfg.walkSpeed;

    let f = forward;
    let r = right;
    const length = Math.hypot(f, r);
    if (length > 1) {
      f /= length;
      r /= length;
    }

    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const tx = (-sin * f + cos * r) * target;
    const tz = (-cos * f - sin * r) * target;

    const k = 1 - Math.exp(-cfg.acceleration * dt);
    this.vx += (tx - this.vx) * k;
    this.vz += (tz - this.vz) * k;

    // Движение по осям раздельно — игрок скользит вдоль стен
    const nx = this.position.x + this.vx * dt;
    if (this.isBlocked(nx, this.position.z)) this.vx = 0;
    else this.position.x = nx;

    const nz = this.position.z + this.vz * dt;
    if (this.isBlocked(this.position.x, nz)) this.vz = 0;
    else this.position.z = nz;

    this.speed = Math.hypot(this.vx, this.vz);
  }

  private isBlocked(x: number, z: number): boolean {
    return this.collision.isBlocked(x, z, CONFIG.player.radius);
  }
}
