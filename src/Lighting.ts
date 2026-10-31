import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { GameModule } from '../core/types';
import type { LightDef } from './LightDef';

interface Slot {
  light: THREE.PointLight;
  source: number;
  fade: number;
}

interface Runtime {
  level: number;
  next: number;
  left: number;
  phase: number;
}

const tmpColor = new THREE.Color();

/**
 * Десятки ламп по зданию, но реальных точечных источников всего `poolSize`.
 * Они переходят к ближайшим лампам игрока; смена происходит через плавное затухание,
 * а число источников на сцене постоянно — шейдеры не перекомпилируются.
 */
export class Lighting implements GameModule {
  private readonly slots: Slot[] = [];
  private readonly runtime: Runtime[];
  private readonly dist: number[];
  private readonly candidates: number[] = [];

  constructor(
    scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly defs: readonly LightDef[],
    poolSize: number,
  ) {
    scene.add(new THREE.HemisphereLight(0x6f8077, 0x0e100f, CONFIG.lighting.hemisphereIntensity));
    for (let i = 0; i < poolSize; i += 1) {
      const light = new THREE.PointLight(0xffffff, 0, 10, 2);
      scene.add(light);
      this.slots.push({ light, source: -1, fade: 0 });
    }
    this.runtime = defs.map((_, i) => ({ level: 1, next: 2 + (i % 5) * 1.7, left: 0, phase: i * 1.91 }));
    this.dist = new Array(defs.length).fill(0);
  }

  update(dt: number, elapsed: number): void {
    const { defs, runtime } = this;
    for (let i = 0; i < defs.length; i += 1) {
      const rt = runtime[i];
      const def = defs[i];
      switch (def.mode) {
        case 'steady':
          rt.level = 1;
          break;
        case 'pulse':
          rt.level = 0.7 + 0.3 * Math.sin(elapsed * 2.2 + rt.phase);
          break;
        case 'fluoro':
          rt.level = 0.97 + 0.03 * Math.sin(elapsed * 55 + rt.phase);
          if (rt.left > 0) {
            rt.left -= dt;
            rt.level = Math.random() < 0.5 ? 0.08 : 0.65;
          } else {
            rt.next -= dt;
            if (rt.next <= 0) {
              rt.left = 0.1 + Math.random() * 0.3;
              rt.next = 4 + Math.random() * 9;
            }
          }
          break;
        case 'broken': {
          const v = Math.sin(elapsed * 2.9 + rt.phase) * Math.sin(elapsed * 7.1 + rt.phase * 2.3);
          rt.level = v > 0.35 ? 0.75 + 0.25 * Math.random() : 0.04;
          break;
        }
      }
      if (def.fixture) def.fixture.color.copy(tmpColor.setHex(def.color)).multiplyScalar(0.12 + 0.88 * rt.level);
    }

    // Кандидаты: лампы в радиусе действия, ближайшие первыми
    const cam = this.camera.position;
    this.candidates.length = 0;
    for (let i = 0; i < defs.length; i += 1) {
      const d = defs[i];
      const dx = d.x - cam.x;
      const dy = d.y - cam.y;
      const dz = d.z - cam.z;
      const sq = dx * dx + dy * dy + dz * dz;
      this.dist[i] = sq;
      const reach = d.distance + 3;
      if (sq < reach * reach) this.candidates.push(i);
    }
    this.candidates.sort((a, b) => this.dist[a] - this.dist[b]);
    const wanted = this.candidates.slice(0, this.slots.length);

    for (const slot of this.slots) {
      const keep = slot.source >= 0 && wanted.includes(slot.source);
      const target = keep ? 1 : 0;
      const step = dt * CONFIG.lighting.fadeSpeed;
      slot.fade += Math.max(-step, Math.min(step, target - slot.fade));

      if (!keep && slot.fade <= 0.001) {
        const next = wanted.find((i) => !this.slots.some((o) => o.source === i));
        if (next === undefined) {
          slot.source = -1;
        } else {
          const d = defs[next];
          slot.source = next;
          slot.fade = 0;
          slot.light.position.set(d.x, d.y, d.z);
          slot.light.color.setHex(d.color);
          slot.light.distance = d.distance;
        }
      }
      slot.light.intensity = slot.source >= 0 ? defs[slot.source].intensity * runtime[slot.source].level * slot.fade : 0;
    }
  }

  dispose(): void {}
}
