/**
 * Проверка планировки без Three.js: npx tsx scripts/check-layout.ts
 * Проверяет: наложение зон здания, проёмы дверей, запертые двери, связность,
 * а также двери и связность объединённой сетки «здание + внешняя территория».
 */
import { Grid, SOLID, DOOR } from '../src/world/grid';
import { DOORS, GRID_D, GRID_W, LOCKED_DOORS, SPAWN, ZONES } from '../src/world/layout';
import { exteriorDoors, exteriorGridData, exteriorZones } from '../src/world/levels/layout-exterior';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

const ext = exteriorGridData();
const W = ext.width;
const D = ext.depth;
const allDoors = [...DOORS, ...exteriorDoors];
const grid = new Grid({ width: W, depth: D, zones: [...ZONES, ...exteriorZones], doors: allDoors });

// 1. Наложение зон здания и выход за границы объединённой сетки
const owner = new Map<string, string>();
for (const z of ZONES) {
  for (const r of z.rects) {
    if (r.x < 1 || r.z < 1 || r.x + r.w > W - 1 || r.z + r.d > D - 1) {
      err(`Зона ${z.id} вылезает за границы: ${JSON.stringify(r)}`);
    }
    for (let j = r.z; j < r.z + r.d; j += 1) {
      for (let i = r.x; i < r.x + r.w; i += 1) {
        const k = `${i},${j}`;
        if (owner.has(k) && owner.get(k) !== z.id) err(`Наложение ${z.id}/${owner.get(k)} в (${i},${j})`);
        owner.set(k, z.id);
      }
    }
  }
}
for (const z of exteriorZones) {
  for (const r of z.rects) {
    if (r.x < 1 || r.z < 1 || r.x + r.w > W - 1 || r.z + r.d > D - 1) {
      err(`Зона территории ${z.id} вылезает за границы: ${JSON.stringify(r)}`);
    }
  }
}

// 2. Двери: по оси прохода — пол, поперёк — бетон; клетка не внутри зоны здания
const buildingOwner = new Map<string, string>();
for (const z of ZONES) {
  for (const r of z.rects) {
    for (let j = r.z; j < r.z + r.d; j += 1) {
      for (let i = r.x; i < r.x + r.w; i += 1) buildingOwner.set(`${i},${j}`, z.id);
    }
  }
}
for (const d of allDoors) {
  const [ax, az] = d.axis === 'z' ? [0, 1] : [1, 0];
  const [px, pz] = [1 - ax, 1 - az];
  const inside = buildingOwner.get(`${d.x},${d.z}`);
  if (inside) err(`Дверь (${d.x},${d.z}) стоит внутри зоны ${inside}`);
  if (!grid.isFloor(d.x - ax, d.z - az) || !grid.isFloor(d.x + ax, d.z + az)) {
    err(`Дверь (${d.x},${d.z}) ${d.axis}: нет пола по обе стороны`);
  }
  if (grid.zoneAt(d.x - ax, d.z - az) === 'door' || grid.zoneAt(d.x + ax, d.z + az) === 'door') {
    err(`Дверь (${d.x},${d.z}) вплотную к другой двери`);
  }
  if (!grid.isSolid(d.x - px, d.z - pz) || !grid.isSolid(d.x + px, d.z + pz)) {
    err(`Дверь (${d.x},${d.z}): сбоку не бетон — щель в стене`);
  }
}

// 3. Запертые двери: клетка — бетон, лицом в пол
const FACE = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] } as const;
for (const d of LOCKED_DOORS) {
  const [fx, fz] = FACE[d.face];
  if (!grid.isSolid(d.x, d.z)) err(`Запертая «${d.label}» (${d.x},${d.z}) не на бетоне`);
  if (!grid.isFloor(d.x + fx, d.z + fz)) err(`Запертая «${d.label}» смотрит не в пол`);
}

// 4. Связность объединённой сетки: BFS от спауна (двери считаем открытыми)
const seen = new Set<string>();
const q: [number, number][] = [[Math.floor(SPAWN.x), Math.floor(SPAWN.z)]];
seen.add(q[0].join(','));
while (q.length) {
  const [x, z] = q.pop()!;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n: [number, number] = [x + dx, z + dz];
    const k = n.join(',');
    if (!seen.has(k) && grid.isFloor(n[0], n[1])) {
      seen.add(k);
      q.push(n);
    }
  }
}
let total = 0;
for (let j = 0; j < D; j += 1) {
  for (let i = 0; i < W; i += 1) {
    if (grid.isFloor(i, j)) {
      total += 1;
      if (!seen.has(`${i},${j}`)) err(`Недостижимая клетка (${i},${j}) зона ${grid.zoneAt(i, j)}`);
    }
  }
}

// 5. Карта здания (первые GRID_W × GRID_D клеток)
const CH: Record<string, string> = {
  lobby: 'v', corridor: '=', service: 's', security: 'g', lab: 'L', storage: 'W', electrical: 'E',
  office: 'o', staff: 'p', server: 'S', medical: 'M', isolation: 'i', tech: 'T', airlock: 'a',
  door: 'D', exterior: '.', road: ':', parking: 'P',
};
const lines: string[] = [];
for (let j = 0; j < GRID_D; j += 1) {
  let row = String(j).padStart(2) + ' ';
  for (let i = 0; i < GRID_W; i += 1) row += grid.cells[j * W + i] === SOLID ? '#' : CH[grid.zoneAt(i, j) ?? 'corridor'];
  lines.push(row);
}
console.log('   ' + Array.from({ length: GRID_W }, (_, i) => (i % 10 === 0 ? String(i / 10) : ' ')).join(''));
console.log(lines.join('\n'));
console.log(
  `\nКлеток пола: ${total}, достижимо: ${seen.size}, дверей: ${allDoors.length} (запертых: ${LOCKED_DOORS.length}), DOOR-клеток: ${grid.cells.filter((c) => c === DOOR).length}`,
);
if (errors.length) {
  console.error('\nОШИБКИ:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('Планировка корректна.');
