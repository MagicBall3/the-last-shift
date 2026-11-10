import { DOORS, GRID_D, GRID_W, ZONES, type CellZone, type DoorDef, type Rect, type ZoneId } from './layout';

export const SOLID = 0;
export const FLOOR = 1;
export const DOOR = 2;

/** Описание одного уровня (этажа): размеры сетки, зоны и двери. */
export interface ZoneDef {
  id: ZoneId;
  rects: Rect[];
}

export interface GridData {
  width: number;
  depth: number;
  zones: ZoneDef[];
  doors: DoorDef[];
}

/** Сетка главного здания (этаж 1) — используется по умолчанию и проверочными скриптами. */
export function defaultGridData(): GridData {
  return { width: GRID_W, depth: GRID_D, zones: ZONES, doors: DOORS };
}

/**
 * Сетка клеток: пол, дверной проём или бетон. Единственный источник правды для стен и коллизий.
 * Уровень = своя сетка; высота этажа задаётся снаружи (смещение группы по Y).
 */
export class Grid {
  readonly width: number;
  readonly depth: number;
  readonly cells: Uint8Array;
  private readonly zones: (CellZone | null)[];

  constructor(data: GridData = defaultGridData()) {
    this.width = data.width;
    this.depth = data.depth;
    this.cells = new Uint8Array(data.width * data.depth);
    this.zones = new Array(data.width * data.depth).fill(null);

    for (const zone of data.zones) {
      for (const r of zone.rects) {
        for (let j = r.z; j < r.z + r.d; j += 1) {
          for (let i = r.x; i < r.x + r.w; i += 1) {
            this.cells[j * data.width + i] = FLOOR;
            this.zones[j * data.width + i] = zone.id;
          }
        }
      }
    }
    for (const door of data.doors) {
      const k = door.z * data.width + door.x;
      this.cells[k] = DOOR;
      this.zones[k] = 'door';
    }
  }

  inside(i: number, j: number): boolean {
    return i >= 0 && j >= 0 && i < this.width && j < this.depth;
  }

  isSolid(i: number, j: number): boolean {
    return !this.inside(i, j) || this.cells[j * this.width + i] === SOLID;
  }

  isFloor(i: number, j: number): boolean {
    return !this.isSolid(i, j);
  }

  zoneAt(i: number, j: number): CellZone | null {
    return this.inside(i, j) ? this.zones[j * this.width + i] : null;
  }
}
