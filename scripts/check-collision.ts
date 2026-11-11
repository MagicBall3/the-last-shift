/*
 * Проверка многоуровневых коллизий — то, чего не видят check-layout/check-walk:
 *   1) MultiLevelCollision выбирает именно тот этаж, на котором стоит игрок
 *      (раньше для подземных уровней бралась коллизия наземного этажа);
 *   2) на каждом уровне из лестничных ниш достижима каждая зона
 *      (раньше мебель в дверных проёмах запирала кабинеты).
 *
 * Ходит «игрок» радиусом CONFIG.player.radius по сетке с шагом 0,25 м,
 * двери открыты — проверяется геометрия и обстановка, а не замки.
 */
function makeCtx(): any {
  const grad = { addColorStop() {} };
  return new Proxy(
    {
      measureText: () => ({ width: 100 }),
      createLinearGradient: () => grad,
      getImageData: () => ({ data: new Uint8ClampedArray(256 * 256 * 4) }),
      putImageData() {},
      createRadialGradient: () => grad,
    },
    {
      get(target, prop) {
        if (prop in target) return (target as any)[prop];
        return () => {};
      },
      set(target, prop, value) {
        (target as any)[prop] = value;
        return true;
      },
    },
  );
}

(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return { width: 256, height: 256, getContext: () => makeCtx(), style: {} };
    }
    return {};
  },
};

import { CONFIG } from '../src/core/config';
import { World } from '../src/world/World';
import { NICHE_DOWN_CENTER, NICHE_UP_CENTER } from '../src/world/levels/stairs';

/** Шаг проверки, м. */
const STEP = 0.25;
/** Допустимая доля недостижимых клеток этажа (углы за мебелью). */
const MAX_LOST = 0.15;

const world = new World();
const radius = CONFIG.player.radius;
const probe = world.spawn.clone();
world.attachPlayer(probe);
const levels = world.levels;
let failed = 0;

// ── 1. Выбор активного этажа по высоте ──────────────────────────────────────
console.log('=== Выбор этажа по высоте игрока ===');
for (let i = 0; i < levels.length; i += 1) {
  probe.set(0, levels[i].baseY, 0);
  world.update(0);
  const got = world.activeLevel;
  const ok = got === i;
  if (!ok) failed += 1;
  console.log(
    `${ok ? 'OK  ' : 'FAIL'} y=${levels[i].baseY.toFixed(1).padStart(5)} → этаж ${got} (${levels[got].name})${ok ? '' : `, ожидался ${i}`}`,
  );
}

// ── 2. Достижимость зон каждого уровня ──────────────────────────────────────
console.log('\n=== Достижимость зон (двери открыты, шаг 0,25 м) ===');
for (let li = 0; li < levels.length; li += 1) {
  const lvl = levels[li];
  const grid = lvl.grid;

  for (const item of lvl.interactables) {
    if (item.prompt === 'Открыть дверь') item.onInteract();
  }

  probe.set(0, lvl.baseY, 0);

  const W = Math.ceil(grid.width / STEP);
  const D = Math.ceil(grid.depth / STEP);
  const seen = new Uint8Array(W * D);
  const free = (ix: number, iz: number): boolean => {
    const x = (ix + 0.5) * STEP;
    const z = (iz + 0.5) * STEP;
    return grid.isFloor(Math.floor(x), Math.floor(z)) && !world.collision.isBlocked(x, z, radius);
  };

  const seeds: [number, number][] = [
    [NICHE_UP_CENTER.x, NICHE_UP_CENTER.z],
    [NICHE_DOWN_CENTER.x, NICHE_DOWN_CENTER.z],
  ];
  if (li === 0) seeds.push([world.spawn.x, world.spawn.z]);

  const stack: number[] = [];
  for (const [sx, sz] of seeds) {
    for (let dz = -1; dz <= 1; dz += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const ix = Math.floor((sx + dx) / STEP);
        const iz = Math.floor((sz + dz) / STEP);
        if (ix < 0 || iz < 0 || ix >= W || iz >= D) continue;
        const key = iz * W + ix;
        if (seen[key] || !free(ix, iz)) continue;
        seen[key] = 1;
        stack.push(key);
      }
    }
  }
  if (stack.length === 0) {
    failed += 1;
    console.log(`FAIL ${lvl.name}: не найдено свободной стартовой точки у лестницы`);
    continue;
  }
  while (stack.length) {
    const cur = stack.pop()!;
    const ix = cur % W;
    const iz = (cur - ix) / W;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = ix + dx;
      const nz = iz + dz;
      if (nx < 0 || nz < 0 || nx >= W || nz >= D) continue;
      const key = nz * W + nx;
      if (seen[key]) continue;
      if (!free(nx, nz)) continue;
      seen[key] = 1;
      stack.push(key);
    }
  }

  const perCell = Math.round(1 / STEP);
  const zones = new Map<string, { reach: number; total: number }>();
  for (let j = 0; j < grid.depth; j += 1) {
    for (let i = 0; i < grid.width; i += 1) {
      if (!grid.isFloor(i, j)) continue;
      let reachable = false;
      for (let dz = 0; dz < perCell && !reachable; dz += 1) {
        for (let dx = 0; dx < perCell; dx += 1) {
          if (seen[(j * perCell + dz) * W + (i * perCell + dx)]) {
            reachable = true;
            break;
          }
        }
      }
      const zone = grid.zoneAt(i, j) ?? '?';
      const rec = zones.get(zone) ?? { reach: 0, total: 0 };
      rec.total += 1;
      if (reachable) rec.reach += 1;
      zones.set(zone, rec);
    }
  }

  // Углы за столами и стеллажами недостижимы всегда; критично, когда из-за
  // обстановки или чужой коллизии отваливается заметная часть этажа.
  let total = 0;
  let reach = 0;
  for (const r of zones.values()) {
    total += r.total;
    reach += r.reach;
  }
  const lostShare = total === 0 ? 0 : (total - reach) / total;
  const emptyZones = [...zones.entries()].filter(([, r]) => r.reach === 0);
  const ok = emptyZones.length === 0 && lostShare <= MAX_LOST;

  if (!ok) failed += 1;
  const summary = [...zones.entries()]
    .map(([z, r]) => `${z} ${r.reach}/${r.total}`)
    .join(', ');
  console.log(
    `${ok ? 'OK  ' : 'FAIL'} ${lvl.name}: достижимо ${reach}/${total} клеток (${((1 - lostShare) * 100).toFixed(0)}%) — ${summary}`,
  );
  if (emptyZones.length) console.log(`     недостижимые зоны: ${emptyZones.map(([z]) => z).join(', ')}`);
  if (lostShare > MAX_LOST) console.log(`     потеряно ${(lostShare * 100).toFixed(0)}% этажа`);
}

console.log(failed === 0 ? '\nКоллизии уровней корректны.' : `\nПроблем: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
