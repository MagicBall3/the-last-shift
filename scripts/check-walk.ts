/**
 * Проверка проходимости без Three.js: npx tsx scripts/check-walk.ts
 * Строит мир с «записывающим» контекстом, затем ищет путь круга игрока (r=0.3) по шагу 0.1 м
 * от спауна до каждого помещения и через каждую дверь. Двери считаются открытыми.
 */
import { Grid } from '../src/world/grid';
import { DOORS, GRID_D, GRID_W, SPAWN } from '../src/world/layout';
import { buildProps } from '../src/world/props';
import { buildDoorFrames, buildLockedDoors } from '../src/world/structures';

type B = { x0: number; z0: number; x1: number; z1: number };
const boxes: B[] = [];
const grid = new Grid();
const H = 3.2;
let seed = 1338;
const rnd = (): number => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const noop = (): void => {};
const ctx: any = {
  H, grid, rnd, runs: [], lights: [] as unknown[],
  batch: new Proxy({}, { get: () => noop }),
  signs: { add: noop },
  solid: (_m: string, w: number, _h: number, d: number, x: number, z: number) => boxes.push({ x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2 }),
  block: (w: number, d: number, x: number, z: number) => boxes.push({ x0: x - w / 2, z0: z - d / 2, x1: x + w / 2, z1: z + d / 2 }),
  detail: noop, decal: noop, wallBox: noop, proxy: noop, lamp: (o: any) => ctx.lights.push(o), deadLamp: noop,
};
buildDoorFrames(ctx);
buildLockedDoors(ctx);
buildProps(ctx);


const R = 0.3;
const blocked = (x: number, z: number): boolean => {
  for (let j = Math.floor(z - R); j <= Math.floor(z + R); j += 1) for (let i = Math.floor(x - R); i <= Math.floor(x + R); i += 1) {
    if (!grid.isSolid(i, j)) continue;
    const dx = x - Math.max(i, Math.min(x, i + 1));
    const dz = z - Math.max(j, Math.min(z, j + 1));
    if (dx * dx + dz * dz < R * R) return true;
  }
  return boxes.some((b) => x > b.x0 - R && x < b.x1 + R && z > b.z0 - R && z < b.z1 + R);
};

const STEP = 0.1;
const W = Math.round(GRID_W / STEP);
const D = Math.round(GRID_D / STEP);
const reach = new Uint8Array(W * D);
const stack: number[] = [Math.round(SPAWN.x / STEP) + Math.round(SPAWN.z / STEP) * W];
if (blocked(SPAWN.x, SPAWN.z)) { console.error('Спаун заблокирован!'); process.exit(1); }
reach[stack[0]] = 1;
while (stack.length) {
  const k = stack.pop()!;
  const i = k % W; const j = (k - i) / W;
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ni = i + di; const nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= W || nj >= D) continue;
    const nk = ni * 1 + nj * W;
    if (reach[nk] || blocked(ni * STEP, nj * STEP)) continue;
    reach[nk] = 1; stack.push(nk);
  }
}
const at = (x: number, z: number): boolean => reach[Math.round(x / STEP) + Math.round(z / STEP) * W] === 1;
const errors: string[] = [];

// каждая дверь: оба подхода достижимы и сам проём проходим
for (const d of DOORS) {
  const cx = d.x + 0.5; const cz = d.z + 0.5;
  const [ax, az] = d.axis === 'z' ? [0, 1] : [1, 0];
  for (const s of [-1, 1]) {
    const px = cx + ax * s * 1.0; const pz = cz + az * s * 1.0;
    if (!at(px, pz)) errors.push(`Дверь (${d.x},${d.z}): подход ${s > 0 ? 'с большей' : 'с меньшей'} стороны недостижим`);
  }
  if (!at(cx, cz)) errors.push(`Дверь (${d.x},${d.z}): сам проём непроходим для игрока`);
}
// доля достижимого пола в каждой зоне (центры клеток вне предметов)
const stat = new Map<string, [number, number]>();
for (let j = 0; j < GRID_D; j += 1) for (let i = 0; i < GRID_W; i += 1) {
  if (!grid.isFloor(i, j)) continue;
  const z = grid.zoneAt(i, j)!;
  const s = stat.get(z) ?? [0, 0];
  const free = !blocked(i + 0.5, j + 0.5);
  if (free) { s[0] += 1; if (!at(i + 0.5, j + 0.5)) errors.push(`Свободная точка (${i + 0.5},${j + 0.5}) в «${z}» отрезана предметами`); }
  s[1] += 1; stat.set(z, s);
}
for (const [z, [free, all]] of stat) console.log(`${z.padEnd(11)} клеток ${String(all).padStart(4)}, свободно под игрока ${free}`);
// предметы не должны торчать в бетоне
for (const b of boxes) {
  for (const [x, z] of [[b.x0 + 0.01, b.z0 + 0.01], [b.x1 - 0.01, b.z1 - 0.01], [b.x0 + 0.01, b.z1 - 0.01], [b.x1 - 0.01, b.z0 + 0.01]]) {
    if (grid.isSolid(Math.floor(x), Math.floor(z))) { errors.push(`Предмет (${b.x0.toFixed(2)},${b.z0.toFixed(2)})–(${b.x1.toFixed(2)},${b.z1.toFixed(2)}) заходит в бетон`); break; }
  }
}
console.log(`Ламп: ${ctx.lights.length}, коллизионных коробок: ${boxes.length}`);
if (errors.length) { console.error('\nОШИБКИ:\n' + [...new Set(errors)].join('\n')); process.exit(1); }
console.log('Проходимость корректна.');
