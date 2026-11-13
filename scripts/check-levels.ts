import { Grid, defaultGridData, type GridData } from '../src/world/grid';
import { SPAWN } from '../src/world/layout';
import { exteriorGridData, exteriorDoors, exteriorZones } from '../src/world/levels/layout-exterior';
import { floor2GridData, floor3GridData, floor4GridData } from '../src/world/levels/layouts-upper';
import {
  underground1GridData,
  underground2GridData,
  underground3GridData,
} from '../src/world/levels/layouts-underground';
import { STAIR_NICHE_NORTH, stairLanding } from '../src/world/levels/stairs';

const NORTH_LANDING = stairLanding(STAIR_NICHE_NORTH);

interface Case {
  name: string;
  data: GridData;
  seeds: [number, number][];
}

const base = defaultGridData();
const ext = exteriorGridData();

const cases: Case[] = [
  {
    name: 'уровень 0 (наземный + территория)',
    data: { width: ext.width, depth: ext.depth, zones: [...base.zones, ...exteriorZones], doors: [...base.doors, ...exteriorDoors] },
    seeds: [
      [SPAWN.x, SPAWN.z],
      [NORTH_LANDING.x, NORTH_LANDING.z],
    ],
  },
  { name: 'этаж 2', data: floor2GridData(), seeds: [[NORTH_LANDING.x, NORTH_LANDING.z]] },
  { name: 'этаж 3', data: floor3GridData(), seeds: [[NORTH_LANDING.x, NORTH_LANDING.z]] },
  { name: 'этаж 4', data: floor4GridData(), seeds: [[NORTH_LANDING.x, NORTH_LANDING.z]] },
  { name: 'уровень −1', data: underground1GridData(), seeds: [[NORTH_LANDING.x, NORTH_LANDING.z]] },
  { name: 'уровень −2', data: underground2GridData(), seeds: [[NORTH_LANDING.x, NORTH_LANDING.z]] },
  { name: 'уровень −3', data: underground3GridData(), seeds: [[NORTH_LANDING.x, NORTH_LANDING.z]] },
];

let failed = 0;
for (const c of cases) {
  const g = new Grid(c.data);
  const W = g.width;
  const D = g.depth;
  const reach = new Uint8Array(W * D);
  const queue: number[] = [];

  for (const [sx, sz] of c.seeds) {
    const i = Math.floor(sx);
    const j = Math.floor(sz);
    if (g.isFloor(i, j) && !reach[j * W + i]) {
      reach[j * W + i] = 1;
      queue.push(j * W + i);
    }
  }

  while (queue.length) {
    const k = queue.pop()!;
    const i = k % W;
    const j = Math.floor(k / W);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ni = i + dx;
      const nj = j + dz;
      if (g.isFloor(ni, nj) && !reach[nj * W + ni]) {
        reach[nj * W + ni] = 1;
        queue.push(nj * W + ni);
      }
    }
  }

  let totalFloor = 0;
  const islands: string[] = [];
  for (let j = 0; j < D; j += 1) {
    for (let i = 0; i < W; i += 1) {
      if (g.isFloor(i, j)) {
        totalFloor += 1;
        if (!reach[j * W + i]) islands.push(`${i},${j}`);
      }
    }
  }

  const ok = islands.length === 0;
  if (!ok) failed += 1;
  console.log(
    `${ok ? 'OK ' : 'FAIL'} ${c.name}: пола ${totalFloor}, достижимо ${totalFloor - islands.length}` +
      (islands.length ? `, недостижимо: ${islands.slice(0, 12).join(' ')}` : ''),
  );
}

console.log(failed === 0 ? '\nВсе уровни связны.' : `\nПроблемные уровни: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
