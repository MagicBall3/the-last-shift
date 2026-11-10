import type { BuildContext } from '../context';

/** Металлические столбы ограждения вдоль линии (сверху бетонной стены). */
function fenceRun(c: BuildContext, x0: number, z0: number, x1: number, z1: number): void {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ex = (x1 - x0) / len;
  const ez = (z1 - z0) / len;
  const step = 5;
  for (let t = 1; t < len - 0.5; t += step) {
    const x = x0 + ex * t;
    const z = z0 + ez * t;
    c.batch.cyl('pipe', 0.05, 0.7, 'y', x, 3.55, z, 6);
    c.batch.cyl('pipeRust', 0.035, 0.24, 'y', x, 3.82, z, 6);
  }
}

/** Опора освещения: столб + лампа наверху. */
function lightPole(c: BuildContext, x: number, z: number, color = 0xdfe8d0): void {
  c.batch.cyl('concrete', 0.12, 5.2, 'y', x, 2.6, z, 8);
  c.batch.cyl('metal', 0.05, 0.6, 'x', x + 0.25, 4.9, z, 6);
  c.batch.box('lampOn', 0.5, 0.12, 0.16, x + 0.55, 4.9, z, { tile: 1 });
  c.lamp({ x: x + 0.55, z, y: 4.9, color, intensity: 14, distance: 12, kind: 'none' });
}

/** Простой автомобиль (припаркованный). */
function car(c: BuildContext, x: number, z: number, yaw: number): void {
  c.batch.box('metal', 1.8, 0.6, 4.2, x, 0.55, z, { rot: [0, yaw, 0], tile: 1 });
  c.batch.box('screenOff', 1.6, 0.4, 2.4, x, 0.85, z, { rot: [0, yaw, 0], tile: 1 });
  c.batch.box('metal', 1.9, 0.3, 4.4, x, 0.18, z, { rot: [0, yaw, 0], tile: 1 });
  c.block(2.0, 4.4, x, z);
}

/** Трансформатор подстанции. */
function transformer(c: BuildContext, x: number, z: number): void {
  c.solid('metal', 1.4, 1.6, 1.2, x, z);
  for (const dz of [-0.4, 0.4]) c.batch.cyl('concrete', 0.1, 0.35, 'y', x, 1.78, z + dz);
  c.detail('hazard', 1.5, 0.006, 0.2, x, 0.005, z + 0.7, { tile: 0.6 });
  c.batch.cyl('pipe', 0.07, 2.2, 'y', x + 0.7, 1.1, z);
}

/** Строим всю внешнюю территорию. */
export function buildExteriorProps(c: BuildContext): void {
  const H = c.H;

  // ── Ограждение по периметру (север, восток, юг) ──
  fenceRun(c, 49, 2, 125, 2); // северная стена
  fenceRun(c, 126, 2, 126, 93); // восточная стена
  fenceRun(c, 49, 93, 125, 93); // южная стена

  // ── Главные ворота (восточная стена, у дороги) ──
  c.solid('concrete', 0.8, H + 1.0, 0.8, 125.4, 44.6);
  c.solid('concrete', 0.8, H + 1.0, 0.8, 125.4, 49.4);
  c.detail('hazard', 0.9, 0.4, 0.9, 125.4, 0.5, 44.6, { tile: 0.3 });
  c.detail('hazard', 0.9, 0.4, 0.9, 125.4, 0.5, 49.4, { tile: 0.3 });
  c.batch.box('metal', 3.4, 0.5, 0.3, 125.6, 2.4, 47, { tile: 1 });
  c.batch.cyl('pipe', 0.08, 2.0, 'y', 125.4, 3.2, 44.6, 6);
  c.batch.cyl('pipe', 0.08, 2.0, 'y', 125.4, 3.2, 49.4, 6);
  c.lamp({ x: 125.6, z: 47, y: 4.6, color: 0xff2a1a, intensity: 8, distance: 10, mode: 'pulse', kind: 'em' });
  c.signs.add(c.batch, 'КОНТРОЛЬ ДОСТУПА', 125.0, 3.4, 44.0, -1, 0, 1.0, 0.25);
  c.proxy(4.0, 2.6, 0.6, 125.6, 1.3, 47, 'Осмотреть ворота', 'Ворота заварены. Снаружи — тьма и снег по колено.');

  // ── Освещение дороги и площади ──
  lightPole(c, 62, 47);
  lightPole(c, 74, 47);
  lightPole(c, 86, 47);
  lightPole(c, 98, 47);
  lightPole(c, 110, 47);
  lightPole(c, 52, 32);
  lightPole(c, 52, 20);

  // Разметка дороги: осевая пунктирная линия
  for (let t = 60; t < 124; t += 6) {
    c.decal('paper', 0.25, 1.4, t, 47, 0);
  }

  // ── КПП ──
  c.solid('metal', 1.6, 0.8, 0.7, 115.5, 40.0);
  c.detail('screenOff', 0.45, 0.3, 0.05, 114.9, 1.15, 40.0);
  c.detail('screenOn', 0.4, 0.27, 0.04, 116.2, 1.15, 40.0);
  c.solid('fabric', 0.45, 0.5, 0.45, 115.5, 41.3);
  c.detail('metal', 0.3, 0.9, 0.05, 115.5, 0.45, 38.2);
  c.proxy(1.6, 1.0, 0.8, 115.5, 0.5, 40.0, 'Осмотреть пост', 'Журнал допуска. Последняя запись: «Смена 07, выход не зафиксирован».');
  c.lamp({ x: 115.5, z: 39.2, intensity: 14, distance: 8, mode: 'fluoro' });

  // ── Парковка ──
  for (let k = 0; k < 4; k += 1) {
    const x = 66 + k * 7;
    const z = 60 + (k % 2) * 8;
    car(c, x, z, k % 2 ? Math.PI / 2 : 0);
  }
  // разметка парковочных мест
  for (let x = 64; x <= 88; x += 6) {
    c.decal('paper', 0.12, 4.0, x, 56.5, Math.PI / 2);
  }

  // ── Подстанция ──
  transformer(c, 72, 20);
  transformer(c, 76, 20);
  c.solid('metal', 0.5, 1.4, 0.9, 79.2, 22.5);
  c.detail('hazard', 0.06, 0.4, 0.06, 79.0, 1.0, 22.3, { tile: 0.3 });
  c.signs.add(c.batch, 'ВЫСОКОЕ НАПРЯЖЕНИЕ', 79.5, 2.4, 22.5, -1, 0, 1.0, 0.25);
  c.proxy(0.6, 1.5, 1.0, 79.2, 0.75, 22.5, 'Осмотреть рубильник', 'Питание отключено. Но подстанция тёплая на ощупь.');

  // ── Вентиляционные сооружения ──
  c.solid('concrete', 8.0, H, 8.0, 96, 26);
  c.detail('vent', 3.0, 1.2, 0.08, 96, 1.6, 22.1);
  c.detail('vent', 3.0, 1.2, 0.08, 96, 1.6, 29.9);
  c.solid('concrete', 6.0, H, 6.0, 107, 29);
  c.detail('vent', 2.2, 1.0, 0.08, 107, 1.6, 26.1);
  c.detail('vent', 2.2, 1.0, 0.08, 107, 1.6, 31.9);
  c.proxy(8.0, 2.6, 8.0, 96, 1.3, 26, 'Осмотреть вентиляцию', 'Из шахты тянет холодом. Где-то внизу что-то работает.');

  // ── Служебный двор и погрузочная зона у здания ──
  c.solid('concrete', 14.0, 0.9, 4.0, 57, 31);
  c.solid('crate', 1.2, 1.2, 1.2, 52, 30, 0, 0.8);
  c.solid('crate', 1.0, 1.0, 1.0, 53.4, 31.2, 0, 0.8);
  c.solid('metal', 6.0, 2.4, 2.4, 64, 30);
  c.solid('metal', 6.0, 2.4, 2.4, 64, 34);
  c.batch.cyl('pipeRust', 0.3, 0.9, 'y', 68, 0.45, 32, 10);
  c.block(0.6, 0.6, 68, 32);
  c.proxy(6.0, 2.4, 2.4, 64, 1.2, 30, 'Осмотреть контейнер', 'Контейнер пуст. На стенке мелом: «Оно слышит шаги».');

  // ── Мусор и следы пребывания ──
  for (let n = 0; n < 26; n += 1) {
    const x = 50 + c.rnd() * 76;
    const z = 2 + c.rnd() * 91;
    if (Math.abs(z - 47) < 3 && x > 58) continue; // не на дороге
    c.batch.box('paper', 0.21, 0.004, 0.29, x, 0.007, z, { rot: [0, c.rnd() * Math.PI, 0], tile: 1 });
  }
  for (let n = 0; n < 12; n += 1) {
    const x = 50 + c.rnd() * 76;
    const z = 2 + c.rnd() * 91;
    c.decal('stain', 0.6 + c.rnd() * 1.2, 0.5 + c.rnd() * 1.0, x, z, c.rnd() * Math.PI);
  }
  for (let n = 0; n < 6; n += 1) {
    const x = 50 + c.rnd() * 76;
    const z = 2 + c.rnd() * 91;
    c.batch.cyl('pipeRust', 0.28, 0.85, 'y', x, 0.42, z, 10);
    c.block(0.56, 0.56, x, z);
  }
}
