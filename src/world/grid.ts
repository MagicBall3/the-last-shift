import { DOORS, GRID_D, GRID_W, ZONES, type CellZone } from './layout';

export const SOLID = 0;
export const FLOOR = 1;
export const DOOR = 2;

/** Сетка клеток: пол, дверной проём или бетон. Единственный источник правды для стен и коллизий. */
export class Grid {
  readonly width = GRID_W;
  readonly depth = GRID_D;
  readonly cells = new Uint8Array(GRID_W * GRID_D);
  private readonly zones: (CellZone | null)[] = new Array(GRID_W * GRID_D).fill(null);

  constructor() {
    for (const zone of ZONES) {
      for (const r of zone.rects) {
        for (let j = r.z; j < r.z + r.d; j += 1) {
          for (let i = r.x; i < r.x + r.w; i += 1) {
            this.cells[j * GRID_W + i] = FLOOR;
            this.zones[j * GRID_W + i] = zone.id;
          }
        }
      }
    }
    for (const door of DOORS) {
      const k = door.z * GRID_W + door.x;
      this.cells[k] = DOOR;
      this.zones[k] = 'door';
    }
  }

  inside(i: number, j: number): boolean {
    return i >= 0 && j >= 0 && i < GRID_W && j < GRID_D;
  }

  isSolid(i: number, j: number): boolean {
    return !this.inside(i, j) || this.cells[j * GRID_W + i] === SOLID;
  }

  isFloor(i: number, j: number): boolean {
    return !this.isSolid(i, j);
  }

  zoneAt(i: number, j: number): CellZone | null {
    return this.inside(i, j) ? this.zones[j * GRID_W + i] : null;
  }
}
