/**
 * Проверка лестничных переходов без браузера: npx tsx scripts/check-stairs.ts
 *
 * 1) карта «откуда → куда» для всех уровней;
 * 2) обе ниши целиком пол на каждом уровне (isFloor не тронут);
 * 3) приземление внутри прохода и вне зон активации;
 * 4) проём в перекрытии целый и полностью накрыт коллизией марша;
 * 5) марш не задевает проход, проход шире игрока, ступени доходят до потолка.
 */
import { CONFIG } from '../src/core/config';
import { Grid, defaultGridData } from '../src/world/grid';
import { exteriorDoors, exteriorGridData, exteriorZones } from '../src/world/levels/layout-exterior';
import { floor2GridData, floor3GridData, floor4GridData } from '../src/world/levels/layouts-upper';
import { underground1GridData, underground2GridData, underground3GridData } from '../src/world/levels/layouts-underground';
import {
  insideRect,
  isStairOpening,
  stairBottomZ,
  stairFlightFootprint,
  stairLanding,
  stairTarget,
  stairTopZ,
  stairZone,
  STAIR_NICHE_NORTH,
  STAIR_OPENINGS,
  STAIR_RISE,
  STAIR_STEPS,
  STAIR_TREAD,
  STAIR_ZONE_DEPTH,
  type StairRect,
} from '../src/world/levels/stairs';

const errors: string[] = [];
const err = (m: string) => errors.push(m);
const NICHE_NAMES: [string, StairRect][] = [['северная', STAIR_NICHE_NORTH]];

const base = defaultGridData();
const ext = exteriorGridData();
const grids = [
  new Grid({ width: ext.width, depth: ext.depth, zones: [...base.zones, ...exteriorZones], doors: [...base.doors, ...exteriorDoors] }),
  new Grid(floor2GridData()),
  new Grid(floor3GridData()),
  new Grid(floor4GridData()),
  new Grid(underground1GridData()),
  new Grid(underground2GridData()),
  new Grid(underground3GridData()),
];

// 1. Карта переходов
const expected: Record<string, string> = {
  '0:up': '1', '0:down': '4',
  '1:up': '2', '1:down': '0',
  '2:up': '3', '2:down': '1',
  '3:up': 'нет', '3:down': '2',
  '4:up': '0', '4:down': '5',
  '5:up': '4', '5:down': '6',
  '6:up': '5', '6:down': 'нет',
};
for (let i = 0; i < grids.length; i += 1) {
  for (const dir of [1, -1] as const) {
    const got = stairTarget(i, dir);
    const key = `${i}:${dir === 1 ? 'up' : 'down'}`;
    const want = expected[key];
    const gotText = got === null ? 'нет' : String(got);
    if (gotText !== want) err(`Переход ${key}: ожидалось ${want}, получено ${gotText}`);
  }
}

// 2–3. Ниши и приземления на каждом уровне
grids.forEach((g, i) => {
  for (const [name, r] of NICHE_NAMES) {
    let floorCells = 0;
    for (let j = r.z; j < r.z + r.d; j += 1) {
      for (let x = r.x; x < r.x + r.w; x += 1) if (g.isFloor(x, j)) floorCells += 1;
    }
    if (floorCells !== r.w * r.d) err(`Уровень ${i}: ниша «${name}» не вся пол (${floorCells}/${r.w * r.d})`);

    const c = stairLanding(r);
    if (!g.isFloor(Math.floor(c.x), Math.floor(c.z))) err(`Уровень ${i}: приземление «${name}» (${c.x},${c.z}) не пол`);
    if (insideRect(stairZone(r, 1), c.x, c.z) || insideRect(stairZone(r, -1), c.x, c.z)) {
      err(`Приземление «${name}» попадает в зону активации — переход сработает повторно`);
    }
  }
});

// 4. Проёмы и коллизия марша
const radius = CONFIG.player.radius;
const openingCells: string[] = [];
for (let j = 0; j < grids[0].depth; j += 1) {
  for (let i = 0; i < grids[0].width; i += 1) if (isStairOpening(i, j)) openingCells.push(`${i},${j}`);
}
if (openingCells.length !== STAIR_OPENINGS.reduce((sum, o) => sum + o.w * o.d, 0)) {
  err(`Клеток проёма ${openingCells.length}, ожидалось ${STAIR_OPENINGS.reduce((sum, o) => sum + o.w * o.d, 0)}: ${openingCells.join(' ')}`);
}

for (const [name, r] of NICHE_NAMES) {
  const hole = STAIR_OPENINGS.find((o) => o.z >= r.z && o.z < r.z + r.d);
  if (!hole) {
    err(`Ниша «${name}»: нет клетки проёма`);
    continue;
  }
  if (!Number.isInteger(hole.x) || !Number.isInteger(hole.z) || !Number.isInteger(hole.w) || !Number.isInteger(hole.d)) {
    err(`Проём «${name}» не совпадает с сеткой (${hole.x},${hole.z},${hole.w}×${hole.d})`);
  }
  if (hole.x < r.x + r.w / 2 || hole.x + hole.w > r.x + r.w) err(`Проём «${name}» выходит за восточную половину ниши по x`);
  if (hole.z < r.z || hole.z + hole.d > r.z + r.d) err(`Проём «${name}» выходит за нишу по z`);
  for (let j = hole.z; j < hole.z + hole.d; j += 1) {
    for (let i = hole.x; i < hole.x + hole.w; i += 1) {
      if (!isStairOpening(i, j)) err(`Клетка проёма «${name}» (${i},${j}) не отмечена isStairOpening`);
    }
  }

  const top = stairTopZ(r);
  const bottom = stairBottomZ(r);
  if (top < hole.z || top > hole.z + hole.d) {
    err(`Проём «${name}» не накрывает верхнюю ступень (${top.toFixed(2)} вне ${hole.z}–${hole.z + hole.d})`);
  }
  if (bottom - STAIR_TREAD / 2 < r.z || bottom + STAIR_TREAD / 2 > r.z + r.d) {
    err(`Марш «${name}» выходит за нишу по z (низ ${bottom.toFixed(2)})`);
  }

  // Габарит марша обязан полностью накрывать проём: иначе игрок встанет над дырой.
  const f = stairFlightFootprint(r);
  const fx0 = f.x - f.w / 2;
  const fx1 = f.x + f.w / 2;
  const fz0 = f.z - f.d / 2;
  const fz1 = f.z + f.d / 2;
  if (!(fx0 <= hole.x + 1e-9 && fx1 >= hole.x + hole.w - 1e-9)) err(`Коллизия марша «${name}» не накрывает проём по x`);
  if (!(fz0 <= hole.z + 1e-9 && fz1 >= hole.z + hole.d - 1e-9)) err(`Коллизия марша «${name}» не накрывает проём по z`);

  // Коллизия марша не должна заходить в проход (западную половину).
  if (fx0 < r.x + r.w / 2 - 1e-9) err(`Коллизия марша «${name}» заходит в проход (${fx0.toFixed(2)} < ${r.x + r.w / 2})`);

  // Проход вдоль западной стены: 1 м, игрок проходит, но не залезает в марш.
  const passageW = fx0 - r.x;
  if (passageW < 0.9) err(`Проход «${name}» уже 0,9 м: ${passageW.toFixed(2)} м`);
  const walkX = r.x + passageW / 2;
  if (fx0 - walkX < radius) err(`Проход «${name}»: центру игрока не хватает места (${(fx0 - walkX).toFixed(2)} < ${radius})`);
  if (walkX + radius > fx0) err(`Игрок в проходе «${name}» задевает марш`);

  // Зоны активации: только проход, не перекрываются, лежат внутри ниши.
  const up = stairZone(r, 1);
  const down = stairZone(r, -1);
  for (const [label, zone] of [['вверх', up], ['вниз', down]] as const) {
    if (zone.x < r.x || zone.x + zone.w > r.x + r.w) err(`Зона «${label}» «${name}» выходит за нишу по x`);
    if (zone.z < r.z || zone.z + zone.d > r.z + r.d) err(`Зона «${label}» «${name}» выходит за нишу по z`);
    if (zone.x + zone.w > fx0) err(`Зона «${label}» «${name}» заходит на марш`);
  }
  // Зоны не должны перекрываться, независимо от того, какая выше.
  if (up.z < down.z + down.d && down.z < up.z + up.d) {
    err(`Зоны «${name}» перекрываются`);
  }
  const c = stairLanding(r);
  const topZone = up.z > down.z ? up : down;
  const bottomZone = up.z > down.z ? down : up;
  const between = c.z > bottomZone.z + bottomZone.d && c.z < topZone.z;
  if (!between) err(`Приземление «${name}» не между зонами (z=${c.z})`);
  if (STAIR_ZONE_DEPTH * 2 >= r.d) err(`Зоны «${name}» не оставляют нейтральной середины`);

  // Ступени доходят ровно до потолка этажа: верхняя проступь = пол следующего уровня.
  if (Math.abs(STAIR_STEPS * STAIR_RISE - CONFIG.world.height) > 1e-6) err('Марш не равен высоте этажа');
}

// 5. Полный маршрут по переходам
let idx = 0;
const route: string[] = ['0'];
for (let step = 0; step < 3; step += 1) {
  const next = stairTarget(idx, 1);
  if (next === null) break;
  idx = next;
  route.push(String(idx));
}
for (let step = 0; step < 6; step += 1) {
  const next = stairTarget(idx, -1);
  if (next === null) { err(`Не удалось спуститься с уровня ${idx}`); break; }
  idx = next;
  route.push(String(idx));
}

console.log(`Вверх: ${route.slice(0, 4).join(' → ')}`);
console.log(`Вниз:  ${route.slice(3).join(' → ')}`);
console.log(`Уровней: ${grids.length}, ниш: ${NICHE_NAMES.length}, проёмов: ${openingCells.length}`);
console.log(`Проём: x ${STAIR_OPENINGS[0].x}–${STAIR_OPENINGS[0].x + STAIR_OPENINGS[0].w}, z ${STAIR_OPENINGS[0].z}–${STAIR_OPENINGS[0].z + STAIR_OPENINGS[0].d}`);
console.log(`Марш: ${STAIR_STEPS} ступеней × ${STAIR_RISE.toFixed(2)} м, проступь ${STAIR_TREAD} м, проход ${(STAIR_NICHE_NORTH.w / 2).toFixed(1)} м`);

if (errors.length) {
  console.error('\nОШИБКИ:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nЛестничные переходы корректны.');
