import * as THREE from 'three';
import type { Grid } from './grid';
import type { CellZone } from './layout';
import { StaticBatch, withColor } from './StaticBatch';
import { TILE } from './textures';
import { CONFIG } from '../core/config';
import { isStairOpening } from './levels/stairs';

/** Непрерывный участок стены; по ним расставляются трубы, вентиляция и прочие детали. */
export interface WallRun {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  /** Нормаль, направленная внутрь помещения */
  nx: number;
  nz: number;
  zone: CellZone;
}

interface Style {
  wall: string;
  floor: string;
}

const STYLE: Record<CellZone, Style> = {
  lobby: { wall: 'wallConcrete', floor: 'floorTile' },
  corridor: { wall: 'wallConcrete', floor: 'floorConcrete' },
  service: { wall: 'wallDark', floor: 'floorConcrete' },
  security: { wall: 'wallConcrete', floor: 'floorTile' },
  lab: { wall: 'wallTile', floor: 'floorTile' },
  storage: { wall: 'wallDark', floor: 'floorConcrete' },
  electrical: { wall: 'wallMetal', floor: 'floorMetal' },
  office: { wall: 'wallOffice', floor: 'floorOffice' },
  staff: { wall: 'wallStaff', floor: 'floorStaff' },
  server: { wall: 'wallServer', floor: 'floorServer' },
  medical: { wall: 'wallMed', floor: 'floorMed' },
  isolation: { wall: 'wallMed', floor: 'floorConcrete' },
  tech: { wall: 'wallTech', floor: 'floorMetal' },
  airlock: { wall: 'wallTile', floor: 'floorMetal' },
  door: { wall: 'wallMetal', floor: 'floorMetal' },
  // открытая территория: без потолка, земля/асфальт, по периметру — бетонная стена
  exterior: { wall: 'wallExterior', floor: 'floorExterior' },
  road: { wall: 'wallExterior', floor: 'floorAsphalt' },
  parking: { wall: 'wallExterior', floor: 'floorAsphalt' },
};

/** Полы открытых зон: потолок над ними не строится. */
const OUTDOOR_FLOORS = new Set(['floorExterior', 'floorAsphalt']);

const TEXTURE_OF: Record<string, string> = {
  wallConcrete: 'concreteWall', wallDark: 'concreteDark', wallTile: 'tileWall', wallMetal: 'metalWall',
  floorConcrete: 'floorConcrete', floorTile: 'tileFloor', floorMetal: 'diamond', ceiling: 'ceiling',
  // этап 3: те же текстуры, другой оттенок материала
  wallOffice: 'concreteWall', wallStaff: 'concreteWall', wallServer: 'metalWall', wallMed: 'tileWall', wallTech: 'metalWall',
  floorOffice: 'floorConcrete', floorStaff: 'floorConcrete', floorServer: 'tileFloor', floorMed: 'tileFloor',
  wallExterior: 'concreteWall', floorExterior: 'floorExterior', floorAsphalt: 'floorAsphalt',
};

// Затемнение стены сверху вниз: у потолка и особенно у пола грязнее (дёшево имитирует затенение углов)
const WALL_SHADE = [0.62, 0.95, 0.88, 0.42];

function horizontalQuad(batch: StaticBatch, key: string, x0: number, z0: number, x1: number, z1: number, y: number, up: boolean): void {
  const w = x1 - x0;
  const d = z1 - z0;
  const tile = TILE[TEXTURE_OF[key]];
  const g = new THREE.PlaneGeometry(w, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, (uv.getX(i) * w + x0) / tile, (uv.getY(i) * d + z0) / tile);
  g.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
  g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  batch.addRaw(key, withColor(g));
}

function wallQuad(batch: StaticBatch, key: string, run: WallRun, height: number): void {
  const len = Math.hypot(run.bx - run.ax, run.bz - run.az);
  const tile = TILE[TEXTURE_OF[key]];
  const g = new THREE.PlaneGeometry(len, height, 1, 3);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const col = new Float32Array(g.attributes.position.count * 3);
  const offset = (run.ax + run.az) * 0.37;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, (uv.getX(i) * len) / tile + offset, (uv.getY(i) * height) / tile);
    const shade = WALL_SHADE[Math.floor(i / 2)];
    col[i * 3] = shade;
    col[i * 3 + 1] = shade;
    col[i * 3 + 2] = shade;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.rotateY(Math.atan2(run.nx, run.nz));
  g.translate((run.ax + run.bx) / 2, height / 2, (run.az + run.bz) / 2);
  batch.addRaw(key, g);
}

/** Строит пол, потолок и стены по сетке. Возвращает участки стен для расстановки деталей. */
export function buildShell(grid: Grid, batch: StaticBatch): WallRun[] {
  const H = CONFIG.world.height;
  const runs: WallRun[] = [];
  const zoneOf = (i: number, j: number): CellZone => grid.zoneAt(i, j) ?? 'corridor';

  // Пол и потолок: горизонтальные полосы одинакового материала.
  // В клетках лестничных проёмов не строится ни пол, ни потолок: потолок этажа
  // совпадает с полом следующего, поэтому шахта получается сквозной.
  for (let j = 0; j < grid.depth; j += 1) {
    let start = -1;
    let key = '';
    for (let i = 0; i <= grid.width; i += 1) {
      const k =
        i < grid.width && grid.isFloor(i, j) && !isStairOpening(i, j) ? STYLE[zoneOf(i, j)].floor : '';
      if (start >= 0 && k !== key) {
        horizontalQuad(batch, key, start, j, i, j + 1, 0, true);
        if (!OUTDOOR_FLOORS.has(key)) horizontalQuad(batch, 'ceiling', start, j, i, j + 1, H, false);
        start = -1;
      }
      if (k && start < 0) {
        start = i;
        key = k;
      }
    }
  }

  // Стены вдоль оси X (север/юг клетки)
  for (const side of [-1, 1]) {
    for (let j = 0; j < grid.depth; j += 1) {
      let start = -1;
      let key = '';
      for (let i = 0; i <= grid.width; i += 1) {
        const exposed = i < grid.width && grid.isFloor(i, j) && grid.isSolid(i, j + side);
        const k = exposed ? STYLE[zoneOf(i, j)].wall : '';
        if (start >= 0 && k !== key) {
          const z = side < 0 ? j : j + 1;
          const run: WallRun = { ax: start, az: z, bx: i, bz: z, nx: 0, nz: -side, zone: zoneOf(start, j) };
          runs.push(run);
          wallQuad(batch, key, run, H);
          start = -1;
        }
        if (k && start < 0) {
          start = i;
          key = k;
        }
      }
    }
  }

  // Стены вдоль оси Z (запад/восток клетки)
  for (const side of [-1, 1]) {
    for (let i = 0; i < grid.width; i += 1) {
      let start = -1;
      let key = '';
      for (let j = 0; j <= grid.depth; j += 1) {
        const exposed = j < grid.depth && grid.isFloor(i, j) && grid.isSolid(i + side, j);
        const k = exposed ? STYLE[zoneOf(i, j)].wall : '';
        if (start >= 0 && k !== key) {
          const x = side < 0 ? i : i + 1;
          const run: WallRun = { ax: x, az: start, bx: x, bz: j, nx: -side, nz: 0, zone: zoneOf(i, start) };
          runs.push(run);
          wallQuad(batch, key, run, H);
          start = -1;
        }
        if (k && start < 0) {
          start = j;
          key = k;
        }
      }
    }
  }
  return runs;
}
