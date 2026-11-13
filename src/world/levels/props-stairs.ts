import type { BuildContext } from '../context';
import {
  NICHE_NORTH_CENTER,
  STAIR_FLIGHT_WIDTH,
  STAIR_NICHE_NORTH,
  STAIR_OPENINGS,
  STAIR_RISE,
  STAIR_RUN,
  STAIR_STEPS,
  STAIR_TREAD,
  STAIR_WAIST,
  stairBottomZ,
  stairFlightFootprint,
  stairFlightX,
  stairLanding,
  stairTopZ,
  type StairRect,
} from './stairs';

/**
 * Единственная лестничная шахта комплекса.
 * Марш занимает восточную половину ниши и поднимается к северу; вдоль западной
 * стены остаётся проход, по которому подходят к низу марша (вверх) или к его
 * верху у проёма (вниз). Направление перехода решает LevelTransitions.
 *
 * Ступени не сплошные столбы от пола: у марша открытый низ и косоур,
 * поэтому проём в перекрытии читается как настоящий выход наверх.
 */

/** Толщина поручня, стойки и косоура, м. */
const RAIL = 0.05;

/** Видимый марш плюс его коллизия; одна и та же коробка для обеих задач. */
function flight(c: BuildContext, niche: StairRect): void {
  const cx = stairFlightX(niche);
  const width = STAIR_FLIGHT_WIDTH;
  const zTop = stairTopZ(niche);
  const z0 = stairBottomZ(niche);
  const climb = STAIR_STEPS * STAIR_RISE;
  const run = STAIR_RUN;

  for (let k = 0; k < STAIR_STEPS; k += 1) {
    const top = (k + 1) * STAIR_RISE;
    const z = z0 - k * STAIR_TREAD;
    // Открытый низ: блок висит на косоуре, под верхними ступенями остаётся проход
    const bottom = Math.max(0, top - STAIR_WAIST);
    const h = top - bottom;
    c.detail('stair', width, h, STAIR_TREAD + 0.02, cx, bottom + h / 2, z, { tile: 1 });
    // носок ступени: тонкая полоса по передней кромке — читается и в темноте
    c.detail('metal', width - 0.04, 0.02, 0.04, cx, top - 0.01, z + STAIR_TREAD / 2, { tile: 1 });
  }

  const len = Math.hypot(run, climb);
  const angle = Math.atan2(climb, run);
  const zMid = zTop + run / 2;

  // Косоур вдоль открытого низа марша
  c.detail(
    'metal',
    0.07,
    0.24,
    len,
    cx - width / 2 + 0.03,
    climb / 2 - 0.2,
    zMid,
    { rot: [angle, 0, 0], tile: 1 },
  );

  // Поручни по обеим сторонам марша со стойками
  for (const side of [-1, 1]) {
    const x = cx + side * (width / 2 - 0.05);
    c.detail('metal', RAIL, RAIL, len, x, climb / 2 + 0.95, zMid, { rot: [angle, 0, 0], tile: 1 });
    for (const k of [0, 4, STAIR_STEPS - 1]) {
      const top = (k + 1) * STAIR_RISE;
      const z = z0 - k * STAIR_TREAD;
      c.detail('metal', RAIL, 0.95, RAIL, x, top + 0.475, z, { tile: 1 });
    }
  }

  // Коллизия строго по видимому маршу: footprint совпадает с габаритом ступеней
  // (x 46.05..46.95), поэтому невидимого барьера в проходе нет, а проём закрыт.
  const f = stairFlightFootprint(niche);
  c.block(f.w, f.d, f.x, f.z);
}

export function buildStairShaft(c: BuildContext): void {
  const niche = STAIR_NICHE_NORTH;
  flight(c, niche);

  // Рамка проёма в перекрытии: тонкий металл по краю, чтобы дыра читалась
  // как выход шахты, а не как дыра в текстуре
  const hole = STAIR_OPENINGS.find((o) => o.z >= niche.z && o.z < niche.z + niche.d);
  if (hole) {
    for (const z of [hole.z - 0.03, hole.z + hole.d + 0.03]) {
      c.detail('metal', hole.w, 0.06, 0.06, hole.x + hole.w / 2, c.H - 0.03, z, { tile: 1 });
    }
    c.detail('metal', 0.06, 0.06, hole.d, hole.x + 0.03, c.H - 0.03, hole.z + hole.d / 2);
  }

  // Указатели на концах прохода: куда ведёт каждый конец марша
  c.signs.add(c.batch, 'ВНИЗ', niche.x + niche.w * 0.25, 2.3, niche.z + 0.03, 0, 1, 0.72, 0.18);
  c.signs.add(c.batch, 'ВВЕРХ', niche.x + niche.w * 0.25, 2.3, niche.z + niche.d - 0.03, 0, -1, 0.72, 0.18);

  // Основной свет: иначе марш не видно и лестница читается как тёмный тупик.
  // Светильник — над проходом (западная половина), чтобы не тонуть в ступенях.
  c.lamp({ x: 45.5, z: NICHE_NORTH_CENTER.z, kind: 'tube', color: 0xdfe8d0, intensity: 16, distance: 8, mode: 'steady' });

  // Подсветка шахты у проёма и под верхними ступенями
  c.lamp({ x: 46.5, z: niche.z + 1.1, y: 1.9, kind: 'none', color: 0xcfd8c4, intensity: 8, distance: 5, mode: 'steady' });

  // Красная аварийная лампа у входа в нишу — ориентир в темноте
  c.lamp({ x: 45.5, z: niche.z + 3.7, y: 2.4, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 6, mode: 'pulse' });

  // Свет на площадке приземления — игрок сразу понимает, где он
  const p = stairLanding(niche);
  c.lamp({ x: p.x, z: p.z, y: c.H - 0.5, color: 0xdfe8d0, intensity: 9, distance: 7, mode: 'steady' });

  // Осмотр лестницы: зона у проёма, видна из прохода
  c.proxy(0.6, 0.9, 1.2, 46.4, 2.2, NICHE_NORTH_CENTER.z - 1, 'Осмотреть лестницу', 'Ступени покрыты пылью. Вверх ведут следы, оставленные недавно.');
}
