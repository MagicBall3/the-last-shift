import type * as THREE from 'three';
import type { CollisionQuery } from '../core/types';
import { CONFIG } from '../core/config';
import type { Grid } from './grid';

/**
 * Столкновения: круг игрока против клеток бетона (точно, по сетке) и коробок предметов/дверей.
 * Пустая Box3 (двери открыты) ничего не блокирует.
 */
export class LevelCollision implements CollisionQuery {
  constructor(
    private readonly grid: Grid,
    private readonly boxes: readonly THREE.Box3[],
  ) {}

  isBlocked(x: number, z: number, r: number): boolean {
    const i0 = Math.floor(x - r);
    const i1 = Math.floor(x + r);
    const j0 = Math.floor(z - r);
    const j1 = Math.floor(z + r);
    for (let j = j0; j <= j1; j += 1) {
      for (let i = i0; i <= i1; i += 1) {
        if (!this.grid.isSolid(i, j)) continue;
        const dx = x - Math.max(i, Math.min(x, i + 1));
        const dz = z - Math.max(j, Math.min(z, j + 1));
        if (dx * dx + dz * dz < r * r) return true;
      }
    }
    for (const b of this.boxes) {
      if (x > b.min.x - r && x < b.max.x + r && z > b.min.z - r && z < b.max.z + r) return true;
    }
    return false;
  }

  /** Границы этажа по высоте (в локальных координатах уровня: пол 0, потолок H). */
  getBounds(_y: number): { floor: number; ceiling: number } {
    return { floor: 0, ceiling: CONFIG.world.height };
  }
}
