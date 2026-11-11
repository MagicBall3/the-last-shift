import type { BuildContext } from '../context';
import { NICHE_DOWN_CENTER, NICHE_UP_CENTER, STAIR_DOWN_NICHE, STAIR_UP_NICHE, type StairRect } from './stairs';

/**
 * Визуальные лестницы в двух нишах. Сам переход выполняет LevelTransitions,
 * геометрия декоративная — но она должна читаться как настоящий марш:
 * сплошные ступени (от пола до проступи), косоур, поручень и проём в перекрытии.
 *
 * Раньше ступени были отдельными плитами из материала стены, висящими в воздухе.
 */

/** Сколько ступеней в марше. */
const STEPS = 9;
/** Высота подступенка, м: 9 × 0,31 ≈ 2,8 м — верх марша почти под перекрытием. */
const RISE = 0.31;
/** Глубина проступи, м. */
const TREAD = 0.26;
/** Толщина поручня и стоек, м. */
const RAIL = 0.05;

/** Марш в нише: `toward = -1` — подъём на север, `+1` — на юг. */
function flight(c: BuildContext, niche: StairRect, toward: 1 | -1): void {
  const H = c.H;
  const cx = niche.x + niche.w / 2;
  const width = niche.w - 0.1;
  const run = STEPS * TREAD;
  const climb = STEPS * RISE;
  // z первой (нижней) ступени — у входа в нишу
  const z0 = toward < 0 ? niche.z + niche.d - TREAD / 2 : niche.z + TREAD / 2;

  for (let k = 0; k < STEPS; k += 1) {
    const top = (k + 1) * RISE;
    // `toward` задаёт направление подъёма: −1 — на север (z уменьшается), +1 — на юг
    const z = z0 + toward * k * TREAD;
    // ступень — сплошной блок от пола до проступи: получаются настоящие подступенки
    c.detail('stair', width, top, TREAD + 0.02, cx, top / 2, z, { tile: 1 });
    // носок ступени: тонкая полоса по передней кромке — читается даже в темноте
    c.detail('metal', width - 0.04, 0.025, 0.05, cx, top - 0.0125, z - toward * (TREAD / 2), { tile: 1 });
  }

  // Поручень вдоль марша: идёт параллельно линии проступей
  const len = Math.hypot(run, climb);
  const angle = Math.atan2(climb, run) * -toward;
  const zMid = z0 + toward * ((STEPS - 1) * TREAD) / 2;
  for (const x of [cx - width / 2 + RAIL, cx + width / 2 - RAIL]) {
    c.detail('metal', RAIL, RAIL, len, x, climb / 2 + 0.95, zMid, { rot: [angle, 0, 0], tile: 1 });
    // стойки поручня
    for (const k of [0, Math.floor(STEPS / 2), STEPS - 1]) {
      const z = z0 + toward * k * TREAD;
      const top = (k + 1) * RISE;
      c.detail('metal', RAIL, 0.95, RAIL, x, top + 0.475, z, { tile: 1 });
    }
  }

  // Проём в перекрытии над верхней ступенью: тёмный квадрат в рамке.
  // Настоящую дыру в потолке не вырезать (потолок — часть оболочки этажа),
  // но тёмный люк в раме читается как выход наверх и объясняет, куда ведёт марш.
  const zTop = z0 + toward * (STEPS - 1) * TREAD;
  // Проём делаем на всю ширину марша: иначе верхние ступени уходят в бетон
  // рядом с люком, а поручни протыкают потолок вне проёма.
  const open = width + 0.06;
  c.detail('stain', open, 0.02, open, cx, H - 0.04, zTop);
  for (const [dx, dz, w, d] of [
    [0, -open / 2, open + 0.16, 0.08],
    [0, open / 2, open + 0.16, 0.08],
    [-open / 2, 0, 0.08, open],
    [open / 2, 0, 0.08, open],
  ] as const) {
    c.detail('metal', w, 0.07, d, cx + dx, H - 0.03, zTop + dz, { tile: 1 });
  }
}

export function buildStairShaft(c: BuildContext): void {
  const H = c.H;

  // Северная ниша — подъём; южная — спуск (марш развёрнут в другую сторону)
  flight(c, STAIR_UP_NICHE, -1);
  flight(c, STAIR_DOWN_NICHE, 1);

  // Указатели направления над входами в ниши
  c.signs.add(c.batch, 'ВЫХОД', 46, 2.4, STAIR_UP_NICHE.z + STAIR_UP_NICHE.d + 0.05, 0, 1, 0.9, 0.22);
  c.signs.add(c.batch, 'ВЫХОД', 46, 2.4, STAIR_DOWN_NICHE.z - 0.05, 0, -1, 0.9, 0.22);

  // Основной свет ядер: иначе марш не видно и лестница читается как тёмный тупик
  c.lamp({ x: 46, z: 14, kind: 'tube', color: 0xdfe8d0, intensity: 16, distance: 8, mode: 'steady' });
  c.lamp({ x: 46, z: 23, kind: 'tube', color: 0xdfe8d0, intensity: 16, distance: 8, mode: 'steady' });

  // Подсветка подступенков снизу: без неё видны только освещённые проступи,
  // и марш читается как ряд белых полос в темноте
  c.lamp({ x: 46, z: 16.4, y: 2.3, kind: 'none', color: 0xcfd8c4, intensity: 8, distance: 5, mode: 'steady' });
  c.lamp({ x: 46, z: 20.6, y: 2.3, kind: 'none', color: 0xcfd8c4, intensity: 8, distance: 5, mode: 'steady' });

  // Красная аварийная лампа — акцент и ориентир в темноте
  c.lamp({ x: 46, z: 13, y: 2.4, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 6, mode: 'pulse' });
  c.lamp({ x: 46, z: 24, y: 2.4, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 6, mode: 'pulse' });

  // Свет на площадках приземления — чтобы игрок сразу понимал, где он
  c.lamp({ x: NICHE_UP_CENTER.x, z: NICHE_UP_CENTER.z, y: H - 0.5, color: 0xdfe8d0, intensity: 9, distance: 7, mode: 'steady' });
  c.lamp({ x: NICHE_DOWN_CENTER.x, z: NICHE_DOWN_CENTER.z, y: H - 0.5, color: 0xdfe8d0, intensity: 9, distance: 7, mode: 'steady' });

  // Осмотр обеих лестниц
  c.proxy(1.9, 2.2, 4.0, 46, 1.1, 14.0, 'Осмотреть лестницу', 'Ступени покрыты пылью. Вверх ведут следы, оставленные недавно.');
  c.proxy(1.9, 2.2, 4.0, 46, 1.1, 23.0, 'Осмотреть лестницу', 'Снизу тянет холодом и запахом сырости. Где-то далеко капает вода.');
}
