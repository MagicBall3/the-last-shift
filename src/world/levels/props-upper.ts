import type { BuildContext } from '../context';
import type { Rect } from '../layout';

/** Характер этажа: разные акценты, свет и обстановка. */
export type FloorTheme = 'admin' | 'analysis' | 'command';

/** Стол с монитором и стулом в кабинете. */
function desk(c: BuildContext, x: number, z: number, chairZ: number): void {
  c.solid('crate', 1.4, 0.75, 0.7, x, z, 0, 1);
  c.detail('screenOff', 0.36, 0.28, 0.05, x - 0.3, 0.9, z);
  c.detail('paper', 0.3, 0.02, 0.4, x + 0.3, 0.76, z + 0.05, { rot: [0, c.rnd() * 3, 0] });
  c.solid('fabric', 0.45, 0.5, 0.45, x + 0.6, chairZ);
}

/** Стойка серверов. */
function rack(c: BuildContext, x: number, z: number): void {
  c.solid('cabinet', 0.9, 2.2, 0.9, x, z);
  c.detail('ledGreen', 0.06, 0.06, 0.02, x + 0.47, 1.9, z - 0.2);
  c.detail('ledRed', 0.06, 0.06, 0.02, x + 0.47, 1.4, z);
}

/** Коридор этажа: светильники и следы эвакуации. */
function corridor(c: BuildContext, theme: FloorTheme): void {
  const cold = theme === 'command';
  for (let x = 11; x < 46; x += 7) {
    c.lamp({ x, z: 19, intensity: cold ? 15 : 13, distance: 9, mode: x % 14 === 11 ? 'fluoro' : 'steady', color: cold ? 0xcfe0f0 : 0xdfe8d0 });
  }
  c.deadLamp(25, 19);
  c.deadLamp(39, 19);
  c.lamp({ x: 44, z: 17, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 7, mode: 'pulse', y: 2.6 });

  // Следы спешной эвакуации: разбросанные бумаги и опрокинутый стул
  for (let n = 0; n < 10; n += 1) {
    const x = 10 + c.rnd() * 36;
    const z = 18.3 + c.rnd() * 2.4;
    c.batch.box('paper', 0.21, 0.004, 0.29, x, 0.007, z, { rot: [0, c.rnd() * Math.PI, 0], tile: 1 });
  }
  c.detail('fabric', 0.45, 0.5, 0.45, 30, 0.24, 19.4, { rot: [1.4, 0.4, 0] });
  c.decal('stain', 1.4, 1.0, 34, 19.2, 0.5);
}

/** Кабинет: стол, шкаф, кресло и рабочие мелочи. */
function officeRoom(c: BuildContext, r: Rect, theme: FloorTheme): void {
  const cx = r.x + r.w / 2;
  desk(c, cx, r.z + 1.6, r.z + 2.6);
  c.solid('cabinet', 0.4, 1.8, 1.0, r.x + 0.5, r.z + r.d - 0.9);
  c.solid('cabinet', 1.0, 1.8, 0.4, r.x + r.w - 0.8, r.z + 0.6);
  c.lamp({
    x: cx,
    z: r.z + r.d / 2,
    intensity: theme === 'command' ? 13 : 11,
    distance: 7,
    mode: theme === 'analysis' ? 'broken' : 'fluoro',
  });

  // Акцент этажа
  if (theme === 'admin') {
    // Архивный шкаф с картотекой
    c.solid('cabinet', 1.4, 2.0, 0.5, cx, r.z + r.d - 0.4);
    c.proxy(1.4, 2.0, 0.5, cx, 1.0, r.z + r.d - 0.4, 'Осмотреть картотеку', 'Папки подписаны от руки. Последние три изъяты — остались только пустые обложки.');
  } else if (theme === 'analysis') {
    // Аналитический стол с приборами
    c.solid('metal', 1.6, 0.9, 0.9, cx, r.z + r.d - 1.6);
    for (const dx of [-0.5, 0, 0.5]) c.batch.cyl('tank', 0.06, 0.26, 'y', cx + dx, 1.03, r.z + r.d - 1.6);
    c.detail('screenOn', 0.4, 0.3, 0.04, cx, 1.2, r.z + r.d - 1.9);
    c.proxy(1.6, 1.0, 0.9, cx, 0.6, r.z + r.d - 1.6, 'Осмотреть приборы', 'Спектрометр выключен. На панели горит одна ошибка: «ОБРАЗЕЦ 7-Б — РАСХОЖДЕНИЕ».');
  } else {
    // Пост наблюдения: пульт и стена мониторов
    c.solid('metal', 2.2, 0.9, 0.8, cx, r.z + r.d - 1.4);
    for (const dx of [-0.7, 0, 0.7]) c.detail('screenOff', 0.55, 0.4, 0.05, cx + dx, 1.75, r.z + 0.1);
    c.detail('ledGreen', 0.05, 0.05, 0.02, cx, 1.2, r.z + r.d - 1.7);
    c.proxy(2.2, 2.0, 0.8, cx, 1.0, r.z + r.d - 1.4, 'Осмотреть пульт', 'Пульт обесточен. На стекле отпечаток ладони — свежий.');
  }

  // Мусор
  for (let n = 0; n < 3; n += 1) {
    const px = r.x + 0.5 + c.rnd() * (r.w - 1);
    const pz = r.z + 0.5 + c.rnd() * (r.d - 1);
    c.batch.box('paper', 0.21, 0.004, 0.29, px, 0.007, pz, { rot: [0, c.rnd() * Math.PI, 0], tile: 1 });
  }
  c.decal('stain', 0.6 + c.rnd() * 0.8, 0.5 + c.rnd() * 0.6, r.x + 0.8 + c.rnd() * (r.w - 1.6), r.z + 0.8 + c.rnd() * (r.d - 1.6), c.rnd() * Math.PI);
}

/** Обстановка этажей 2–4. Каждый этаж имеет собственный характер. */
export function buildOfficeFloorProps(
  c: BuildContext,
  offices: Rect[],
  servers: Rect[],
  staff: Rect[],
  theme: FloorTheme,
): void {
  corridor(c, theme);

  for (const r of offices) officeRoom(c, r, theme);

  for (const r of servers) {
    for (let z = r.z + 1.2; z < r.z + r.d - 0.5; z += 1.9) rack(c, r.x + r.w / 2, z);
    c.lamp({ x: r.x + r.w / 2, z: r.z + r.d / 2, color: 0x7fb6ff, intensity: 14, distance: 8, mode: 'fluoro' });
    c.detail('hazard', 0.1, 0.006, r.d - 1.0, r.x + r.w / 2 - 0.9, 0.005, r.z + r.d / 2, { tile: 0.6 });
    c.proxy(r.w - 1, 2.2, r.d - 1, r.x + r.w / 2, 1.1, r.z + r.d / 2, 'Осмотреть стойки', 'Серверы гудят. Журнал показывает запись, сделанную спустя два года после эвакуации.');
  }

  for (const r of staff) {
    // Комната персонала: диван, стол, шкафчики, автомат с едой
    c.solid('fabric', 2.0, 0.45, 0.8, r.x + r.w / 2, r.z + 1.2);
    c.solid('crate', 1.8, 0.75, 0.9, r.x + r.w / 2, r.z + r.d - 2.0, 0, 1);
    c.detail('screenOff', 0.3, 0.2, 0.04, r.x + r.w / 2 - 0.4, 0.85, r.z + r.d - 2.3);
    for (let k = 0; k < 3; k += 1) c.solid('cabinet', 0.5, 1.9, 0.55, r.x + 0.5 + k * 0.6, r.z + r.d - 0.5, 0, 1);
    c.lamp({ x: r.x + r.w / 2, z: r.z + r.d / 2, color: 0xffe2b0, intensity: 12, distance: 8 });
    c.proxy(2.0, 1.0, 0.9, r.x + r.w / 2, 0.5, r.z + r.d - 2.0, 'Осмотреть стол', 'Три кружки, все недопиты. На стене — график смен с обведённой датой.');
  }
}
