/**
 * Проверка лестничных переходов без браузера: npx tsx scripts/check-stairs.ts
 * 1) карта «откуда → куда» для всех уровней;
 * 2) обе ниши существуют как пол на каждом уровне;
 * 3) приземление находится внутри ниши (иначе игрок застревал бы в стене);
 * 4) полный маршрут: земля → все этажи вверх → земля → все уровни вниз → обратно.
 */
import { Grid } from '../src/world/grid';
import { defaultGridData } from '../src/world/grid';
import { exteriorDoors, exteriorGridData, exteriorZones } from '../src/world/levels/layout-exterior';
import { floor2GridData, floor3GridData, floor4GridData } from '../src/world/levels/layouts-upper';
import { underground1GridData, underground2GridData, underground3GridData } from '../src/world/levels/layouts-underground';
import { NICHE_DOWN_CENTER, NICHE_UP_CENTER, STAIR_DOWN_NICHE, STAIR_UP_NICHE, stairTarget } from '../src/world/levels/stairs';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

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
  for (const [name, r] of [['вверх', STAIR_UP_NICHE], ['вниз', STAIR_DOWN_NICHE]] as const) {
    let floorCells = 0;
    for (let j = r.z; j < r.z + r.d; j += 1) {
      for (let x = r.x; x < r.x + r.w; x += 1) if (g.isFloor(x, j)) floorCells += 1;
    }
    if (floorCells !== r.w * r.d) err(`Уровень ${i}: ниша «${name}» не вся пол (${floorCells}/${r.w * r.d})`);
  }
  for (const [name, c] of [['вверх', NICHE_UP_CENTER], ['вниз', NICHE_DOWN_CENTER]] as const) {
    if (!g.isFloor(Math.floor(c.x), Math.floor(c.z))) err(`Уровень ${i}: приземление «${name}» (${c.x},${c.z}) не пол`);
  }
});

// 4. Полный маршрут
let idx = 0;
const route: string[] = ['0'];
for (let step = 0; step < 3; step += 1) {
  const next = stairTarget(idx, 1);
  if (next === null) { err(`Не удалось подняться с уровня ${idx}`); break; }
  idx = next;
  route.push(String(idx));
}
for (let step = 0; step < 6; step += 1) {
  const next = stairTarget(idx, -1);
  if (next === null) { err(`Не удалось спуститься с уровня ${idx}`); break; }
  idx = next;
  route.push(String(idx));
}
for (let step = 0; step < 6; step += 1) {
  const next = stairTarget(idx, 1);
  if (next === null) break;
  idx = next;
  route.push(String(idx));
}

const upRoute = route.slice(0, 4).join(' → ');
const downRoute = route.slice(3).join(' → ');
console.log(`Вверх: ${upRoute}`);
console.log(`Вниз:  ${downRoute}`);
console.log(`Уровней: ${grids.length}`);

if (errors.length) {
  console.error('\nОШИБКИ:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nЛестничные переходы корректны.');
