import type { BuildContext } from '../context';
import { NICHE_DOWN_CENTER, NICHE_UP_CENTER, STAIR_DOWN_NICHE, STAIR_UP_NICHE } from './stairs';

/**
 * Визуальные лестницы в двух нишах: марш ступеней, перила и указатели.
 * Геометрия декоративная — сам переход выполняет LevelTransitions.
 */
export function buildStairShaft(c: BuildContext): void {
  const H = c.H;

  // Северная ниша: ступени уходят вверх к северу
  for (let k = 0; k < 7; k += 1) {
    const z = STAIR_UP_NICHE.z + 3.6 - k * 0.26;
    const y = 0.1 + k * 0.28;
    c.detail('concrete', 1.9, 0.16, 0.26, 46, y, z, { tile: 1 });
  }
  // Южная ниша: ступени уходят вниз к югу
  for (let k = 0; k < 7; k += 1) {
    const z = STAIR_DOWN_NICHE.z + 0.4 + k * 0.26;
    const y = 0.1 + k * 0.28;
    c.detail('concrete', 1.9, 0.16, 0.26, 46, y, z, { tile: 1 });
  }

  // Перила вдоль обеих ниш
  for (const x of [45.12, 46.88]) {
    c.detail('metal', 0.06, 0.9, 4.0, x, 0.95, 14.0, { tile: 1 });
    c.detail('metal', 0.05, 0.05, 4.0, x, 1.4, 14.0, { tile: 1 });
    c.detail('metal', 0.06, 0.9, 4.0, x, 0.95, 23.0, { tile: 1 });
    c.detail('metal', 0.05, 0.05, 4.0, x, 1.4, 23.0, { tile: 1 });
  }

  // Указатели направления над входами в ниши
  c.signs.add(c.batch, 'ВЫХОД', 46, 2.4, STAIR_UP_NICHE.z + STAIR_UP_NICHE.d + 0.05, 0, 1, 0.9, 0.22);
  c.signs.add(c.batch, 'ВЫХОД', 46, 2.4, STAIR_DOWN_NICHE.z - 0.05, 0, -1, 0.9, 0.22);

  // Аварийное освещение ядер
  c.lamp({ x: 46, z: 14, y: H - 0.5, kind: 'em', color: 0xff2a1a, intensity: 6, distance: 7, mode: 'pulse' });
  c.lamp({ x: 46, z: 23, y: H - 0.5, kind: 'em', color: 0xff2a1a, intensity: 6, distance: 7, mode: 'pulse' });

  // Осмотр обеих лестниц
  c.proxy(1.9, 2.2, 4.0, 46, 1.1, 14.0, 'Осмотреть лестницу', 'Ступени покрыты пылью. Вверх ведут следы, оставленные недавно.');
  c.proxy(1.9, 2.2, 4.0, 46, 1.1, 23.0, 'Осмотреть лестницу', 'Снизу тянет холодом и запахом сырости. Где-то далеко капает вода.');

  // Свет на площадках приземления — чтобы игрок сразу понимал, где он
  c.lamp({ x: NICHE_UP_CENTER.x, z: NICHE_UP_CENTER.z, y: H - 0.5, color: 0xdfe8d0, intensity: 9, distance: 7, mode: 'broken' });
  c.lamp({ x: NICHE_DOWN_CENTER.x, z: NICHE_DOWN_CENTER.z, y: H - 0.5, color: 0xdfe8d0, intensity: 9, distance: 7, mode: 'broken' });
}
