import { LOCKED_DOORS, ZONES, type Rect, type ZoneId } from './layout';
import type { BuildContext } from './context';
import { faceFrame } from './structures';

const INDUSTRIAL: readonly string[] = ['corridor', 'service', 'storage', 'electrical', 'tech', 'airlock', 'server'];

/** Расстановка света: светлые участки, аварийные лампы и участки почти полной темноты. */
function placeLights(c: BuildContext): void {
  // Вестибюль
  c.lamp({ x: 5.5, z: 19.5, intensity: 20, distance: 11 });
  c.lamp({ x: 2.8, z: 19.5, kind: 'em', color: 0xff2a1a, intensity: 6, distance: 7, mode: 'pulse', y: 2.6 });
  // Главный коридор: свет у входа, потом провал в темноту
  c.lamp({ x: 12, z: 19.5, intensity: 22, distance: 12 });
  c.lamp({ x: 20, z: 19.5, intensity: 22, distance: 12, mode: 'fluoro' });
  c.deadLamp(29, 19.5);
  c.lamp({ x: 33, z: 19.5, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 8, mode: 'pulse', y: 2.6 });
  c.deadLamp(37, 19.5);
  c.lamp({ x: 41, z: 19.5, kind: 'em', color: 0xff2a1a, intensity: 6, distance: 8, mode: 'pulse', y: 2.6 });
  c.lamp({ x: 45, z: 19.5, intensity: 20, distance: 10, mode: 'broken' });
  // Охрана
  c.lamp({ x: 12.5, z: 13.5, intensity: 16, distance: 9, mode: 'fluoro' });
  c.lamp({ x: 11.4, z: 10.5, y: 1.3, kind: 'none', color: 0xffc070, intensity: 5, distance: 5 });
  // Лаборатория
  c.lamp({ x: 21, z: 12, intensity: 20, distance: 10, mode: 'fluoro' });
  c.lamp({ x: 27, z: 12, intensity: 18, distance: 10, mode: 'broken' });
  c.deadLamp(24, 12);
  c.lamp({ x: 29.1, z: 9.9, y: 1.7, kind: 'none', color: 0x4cff9a, intensity: 9, distance: 6, mode: 'pulse' });
  // Склад
  c.lamp({ x: 14, z: 26, intensity: 15, distance: 10, alongZ: true });
  c.lamp({ x: 18, z: 30, intensity: 16, distance: 10, mode: 'broken', alongZ: true });
  c.deadLamp(15.5, 31, true);
  c.lamp({ x: 11, z: 23, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 7, mode: 'pulse', y: 2.6 });
  // Электрощитовая
  c.lamp({ x: 26.5, z: 24.5, color: 0xbfd4ff, intensity: 20, distance: 9, mode: 'fluoro' });
  c.lamp({ x: 24.8, z: 26.8, kind: 'em', color: 0xff2a1a, intensity: 6, distance: 7, mode: 'pulse', y: 2.6 });
  // Сервисные коридоры
  c.lamp({ x: 36, z: 12, intensity: 12, distance: 9 });
  c.deadLamp(41, 12);
  c.lamp({ x: 28, z: 30, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 8, mode: 'pulse', y: 2.6 });
  c.lamp({ x: 40, z: 30, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 8, mode: 'pulse', y: 2.6 });
  c.lamp({ x: 44, z: 15.5, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 7, mode: 'pulse', y: 2.6 });
  c.lamp({ x: 44, z: 25, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 7, mode: 'pulse', y: 2.6 });
  c.lamp({ x: 4, z: 29.5, intensity: 14, distance: 9, mode: 'broken', alongZ: true });
  c.lamp({ x: 4, z: 33.5, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 7, mode: 'pulse', y: 2.6 });
}

/** Свет новых помещений (этап 3). Оттенок зоны: серверная — холодный синий, медблок — бледно-зелёный, техзона — янтарный. */
function placeLightsStage3(c: BuildContext): void {
  // Северный коридор и галерея
  c.lamp({ x: 4, z: 10, intensity: 12, distance: 9, mode: 'fluoro', alongZ: true });
  c.deadLamp(4, 12.5, true);
  c.lamp({ x: 6, z: 6, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 7, mode: 'pulse', y: 2.6 });
  c.lamp({ x: 21, z: 6, intensity: 14, distance: 10, mode: 'fluoro' });
  c.deadLamp(25, 6);
  c.lamp({ x: 28.5, z: 6, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 7, mode: 'pulse', y: 2.6 });
  // Комната персонала, кладовая
  c.lamp({ x: 12, z: 6, color: 0xffe2b0, intensity: 15, distance: 9 });
  c.lamp({ x: 14.2, z: 7.4, y: 1.0, kind: 'none', color: 0xffc070, intensity: 4, distance: 4, mode: 'broken' });
  c.deadLamp(7, 10, true);
  // Кабинеты
  c.lamp({ x: 20, z: 2.5, intensity: 10, distance: 6, mode: 'fluoro' });
  c.lamp({ x: 25.9, z: 1.5, y: 1.25, kind: 'none', color: 0xffc070, intensity: 6, distance: 5 });
  c.lamp({ x: 35, z: 15.5, intensity: 10, distance: 7, mode: 'fluoro' });
  c.deadLamp(40, 15.5);
  // Медблок и изолятор
  c.lamp({ x: 35, z: 6.5, color: 0xd8f0e4, intensity: 18, distance: 10 });
  c.lamp({ x: 33.2, z: 8.4, color: 0xd8f0e4, intensity: 10, distance: 7, mode: 'broken' });
  c.lamp({ x: 35, z: 4.3, y: 2.1, kind: 'none', color: 0x4cff9a, intensity: 6, distance: 5, mode: 'pulse' });
  c.lamp({ x: 41, z: 6.8, kind: 'em', color: 0xff2a1a, intensity: 6, distance: 8, mode: 'pulse', y: 2.6 });
  c.deadLamp(40, 3.8);
  c.deadLamp(43, 3.8);
  // Серверная и техзона
  c.lamp({ x: 33.5, z: 24.5, color: 0x7fb6ff, intensity: 16, distance: 9, mode: 'fluoro' });
  c.lamp({ x: 39.5, z: 24.0, color: 0xffb060, intensity: 14, distance: 9, mode: 'broken' });
  c.lamp({ x: 39.5, z: 26.8, kind: 'em', color: 0xff2a1a, intensity: 6, distance: 7, mode: 'pulse', y: 2.6 });
  // Юг: шлюз, лаборатория Б, камера, тупик
  c.lamp({ x: 30.5, z: 33, color: 0xbfd4ff, intensity: 12, distance: 6, mode: 'fluoro' });
  c.lamp({ x: 27, z: 37, intensity: 18, distance: 11, mode: 'fluoro' });
  c.lamp({ x: 32, z: 40.5, intensity: 16, distance: 10, mode: 'broken' });
  c.deadLamp(29.5, 40.5);
  c.lamp({ x: 33.2, z: 41.4, y: 1.8, kind: 'none', color: 0x4cff9a, intensity: 10, distance: 7, mode: 'pulse' });
  c.lamp({ x: 38.5, z: 34.5, intensity: 14, distance: 10, mode: 'broken' });
  c.lamp({ x: 44, z: 34, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 7, mode: 'pulse', y: 2.6 });
  c.lamp({ x: 41, z: 41, kind: 'em', color: 0xff2a1a, intensity: 6, distance: 8, mode: 'pulse', y: 2.6 });
  c.deadLamp(43.5, 41.5);
}

/** Балки, трубы и кабельные лотки под потолком каждого помещения. */
function ceilingWork(c: BuildContext, zone: ZoneId, r: Rect): void {
  const H = c.H;
  const alongX = r.w >= r.d;
  const length = alongX ? r.w : r.d;
  const short = alongX ? r.d : r.w;
  const at = (t: number, lateral: number): [number, number] =>
    alongX ? [r.x + t, r.z + lateral] : [r.x + lateral, r.z + t];

  // Бетонные балки каждые 4 м
  for (let t = 2; t < length - 0.5; t += 4) {
    const [bx, bz] = at(t, short / 2);
    c.detail('concrete', alongX ? 0.4 : short, 0.22, alongX ? short : 0.4, bx, H - 0.11, bz, { tile: 1 });
  }

  if (INDUSTRIAL.includes(zone) || zone === 'lab') {
    const defs: [number, number, number][] = [[0.4, 0.09, 2.82], [short - 0.4, 0.06, 2.87]];
    for (const [lateral, radius, y] of defs) {
      const [px, pz] = at(length / 2, lateral);
      c.batch.cyl('pipe', radius, length - 0.1, alongX ? 'x' : 'z', px, y, pz);
      for (let t = 1.5; t < length - 0.5; t += 3) {
        const [qx, qz] = at(t, lateral);
        c.batch.cyl('pipeRust', radius + 0.03, 0.14, alongX ? 'x' : 'z', qx, y, qz);
      }
    }
  }
  if (zone === 'corridor' || zone === 'service' || zone === 'electrical') {
    const [tx, tz] = at(length / 2, short / 2);
    c.detail('metal', alongX ? length - 0.2 : 0.3, 0.05, alongX ? 0.3 : length - 0.2, tx, 2.92, tz, { tile: 1 });
    // свисающие кабели
    for (let t = 1.2; t < length - 1; t += 2.4 + c.rnd() * 2) {
      const [kx, kz] = at(t, short / 2 + (c.rnd() - 0.5) * 0.2);
      const drop = 0.25 + c.rnd() * 0.5;
      c.detail('cable', 0.03, drop, 0.03, kx, 2.9 - drop / 2, kz, { tile: 1 });
    }
  }
}

/** Мусор, бумага и пятна на полу помещения. */
function floorClutter(c: BuildContext, r: Rect, density: number): void {
  const area = r.w * r.d;
  const papers = Math.min(14, Math.floor(area * density));
  for (let n = 0; n < papers; n += 1) {
    const x = r.x + 0.4 + c.rnd() * (r.w - 0.8);
    const z = r.z + 0.4 + c.rnd() * (r.d - 0.8);
    c.batch.box('paper', 0.21, 0.004, 0.29, x, 0.007, z, { rot: [0, c.rnd() * Math.PI, 0], tile: 1 });
  }
  const stains = 1 + Math.floor(area / 40);
  for (let n = 0; n < stains; n += 1) {
    const x = r.x + 0.6 + c.rnd() * (r.w - 1.2);
    const z = r.z + 0.6 + c.rnd() * (r.d - 1.2);
    c.decal('stain', 0.6 + c.rnd() * 1.0, 0.5 + c.rnd() * 0.8, x, z, c.rnd() * Math.PI);
  }
}

/** Детали на стенах: кабель-каналы, вентиляция, щитки, огнетушители, трубы. */
function wallDetails(c: BuildContext): void {
  const locked = LOCKED_DOORS.map((d) => {
    const f = faceFrame(d);
    return { x: f.px, z: f.pz, reach: d.kind === 'blast' ? 2.6 : d.kind === 'elevator' ? 2.0 : 1.2 };
  });
  const nearLocked = (x: number, z: number): boolean =>
    locked.some((l) => Math.abs(x - l.x) < l.reach && Math.abs(z - l.z) < l.reach);

  for (const run of c.runs) {
    if (run.zone === 'door' || run.zone === 'exterior' || run.zone === 'road' || run.zone === 'parking') continue;
    const len = Math.hypot(run.bx - run.ax, run.bz - run.az);
    if (len < 1.5) continue;
    const ex = (run.bx - run.ax) / len;
    const ez = (run.bz - run.az) / len;
    const alongX = Math.abs(ex) > 0.5;
    const industrial = INDUSTRIAL.includes(run.zone) || run.zone === 'lab';

    if (industrial && len >= 3 && c.rnd() < 0.85) {
      const mx = (run.ax + run.bx) / 2 + run.nx * 0.07;
      const mz = (run.az + run.bz) / 2 + run.nz * 0.07;
      c.batch.cyl('pipe', 0.045, len - 0.2, alongX ? 'x' : 'z', mx, 2.95, mz);
    }
    for (let t = 0.9; t < len - 0.6; t += 2.2) {
      const px = run.ax + ex * t;
      const pz = run.az + ez * t;
      if (nearLocked(px, pz)) continue;
      const r = c.rnd();
      if (r < 0.26) {
        c.wallBox('vent', 0.7, 0.4, 0.06, px, 2.25, pz, run.nx, run.nz);
      } else if (r < 0.42 && industrial) {
        c.wallBox('cabinet', 0.38, 0.5, 0.14, px, 1.5, pz, run.nx, run.nz);
        c.wallBox(c.rnd() < 0.5 ? 'ledGreen' : 'ledRed', 0.05, 0.05, 0.02, px, 1.65, pz, run.nx, run.nz, 0.1, 0.14);
      } else if (r < 0.5 && industrial) {
        c.batch.cyl('extinguisher', 0.08, 0.45, 'y', px + run.nx * 0.14, 1.15, pz + run.nz * 0.14);
        c.wallBox('pipe', 0.12, 0.05, 0.1, px, 1.4, pz, run.nx, run.nz);
      } else if (r < 0.6 && industrial) {
        c.batch.cyl('pipe', 0.06, c.H, 'y', px + run.nx * 0.08, c.H / 2, pz + run.nz * 0.08);
      }
    }
  }
}

function lobby(c: BuildContext): void {
  c.solid('metal', 2.4, 1.0, 0.7, 6.3, 15.6);
  c.detail('screenOff', 0.45, 0.3, 0.05, 6.3, 1.2, 15.55);
  c.detail('metal', 0.5, 0.02, 0.18, 6.3, 1.01, 15.8);
  c.proxy(2.4, 1.2, 0.8, 6.3, 0.9, 15.7, 'Осмотреть стойку', 'Журнал смен. Последняя запись обрывается на середине страницы.');
  c.solid('fabric', 1.6, 0.45, 0.5, 6.6, 23.5);
  c.solid('fabric', 0.5, 0.45, 1.6, 2.5, 16.6);
  c.solid('concrete', 0.6, c.H, 0.6, 6.0, 21.5);
  c.detail('fabric', 0.45, 0.45, 0.45, 4.5, 0.22, 21.2, { rot: [0.3, 0.5, 1.4] });
  c.detail('hazard', 0.1, 0.006, 3.0, 3.2, 0.005, 19.5, { tile: 0.6 });
}

function security(c: BuildContext): void {
  c.solid('metal', 3.0, 0.8, 0.9, 12.5, 10.5);
  c.detail('screenOff', 0.5, 0.35, 0.06, 11.4, 1.18, 10.3);
  c.detail('screenOn', 0.42, 0.27, 0.03, 12.5, 1.18, 10.34);
  c.detail('screenOff', 0.5, 0.35, 0.06, 13.6, 1.18, 10.3);
  c.detail('screenOff', 0.5, 0.35, 0.06, 12.5, 1.62, 10.28);
  c.proxy(3.0, 1.0, 0.9, 12.5, 1.2, 10.5, 'Осмотреть мониторы', 'Экраны мертвы. На одном застыл кадр пустого коридора.');
  c.solid('metal', 0.5, 0.9, 0.5, 12.5, 11.8);
  for (const z of [12.2, 12.8, 13.4]) c.solid('cabinet', 0.55, 1.9, 0.55, 15.7, z);
  c.proxy(0.6, 1.9, 1.8, 15.6, 0.95, 12.8, 'Осмотреть шкафчики', 'Пусто. Внутри только бейдж без фотографии.');
  c.solid('fabric', 2.0, 0.45, 0.8, 14.0, 15.5);
  c.detail('paper', 0.05, 0.8, 1.2, 10.04, 1.6, 12.5, { tile: 1 });
  c.detail('cabinet', 0.4, 0.5, 0.4, 10.4, 0.25, 14.2);
}

function lab(c: BuildContext): void {
  for (let k = 0; k < 6; k += 1) c.solid('cabinet', 1.0, 2.0, 0.6, 19.3 + k * 1.15, 8.35);
  for (const z of [10.6, 13.4]) {
    for (const [x, w] of [[21, 3], [27.2, 3.4]] as const) {
      c.solid('metal', w, 0.9, 1.0, x, z);
      const items = 2 + Math.floor(c.rnd() * 3);
      for (let n = 0; n < items; n += 1) {
        const ix = x - w / 2 + 0.4 + c.rnd() * (w - 0.8);
        const pick = c.rnd();
        if (pick < 0.4) c.detail('screenOff', 0.4, 0.3, 0.05, ix, 1.1, z - 0.2);
        else if (pick < 0.7) c.batch.cyl('tank', 0.06, 0.25, 'y', ix, 1.025, z + (c.rnd() - 0.5) * 0.5);
        else c.detail('paper', 0.3, 0.02, 0.4, ix, 0.91, z + (c.rnd() - 0.5) * 0.3, { rot: [0, c.rnd() * 3, 0] });
      }
    }
  }
  c.solid('metal', 0.6, 2.0, 1.4, 18.4, 10.0);
  c.solid('metal', 0.6, 2.0, 1.4, 18.4, 15.0);
  for (const x of [28.4, 29.8]) {
    c.batch.cyl('tank', 0.45, 2.0, 'y', x, 1.2, 9.3, 10);
    c.batch.cyl('metal', 0.5, 0.15, 'y', x, 0.08, 9.3, 10);
    c.batch.cyl('metal', 0.5, 0.15, 'y', x, 2.3, 9.3, 10);
    c.block(0.9, 0.9, x, 9.3);
  }
  c.proxy(2.4, 2.4, 1.2, 29.1, 1.2, 9.3, 'Осмотреть резервуары', 'Резервуары пусты. Стекло изнутри в мутных разводах.');
  c.solid('metal', 2.0, 0.8, 0.7, 24.5, 15.4);
  c.detail('paper', 1.9, 0.1, 0.6, 24.5, 0.85, 15.4);
  c.detail('fabric', 0.45, 0.45, 0.45, 22.8, 0.2, 12.2, { rot: [0.2, 0.7, 1.5] });
}

function rack(c: BuildContext, x: number, z0: number, z1: number): void {
  const len = z1 - z0;
  const zc = (z0 + z1) / 2;
  c.block(0.9, len, x, zc);
  for (let z = z0; z <= z1 + 0.01; z += 2) {
    for (const dx of [-0.42, 0.42]) c.detail('metal', 0.06, 2.2, 0.06, x + dx, 1.1, z, { tile: 1 });
  }
  for (const y of [0.15, 0.8, 1.45, 2.1]) {
    c.detail('metal', 0.9, 0.04, len, x, y, zc, { tile: 1 });
    for (let z = z0 + 0.5; z < z1 - 0.3; z += 0.9) {
      if (c.rnd() < 0.55) {
        const s = 0.4 + c.rnd() * 0.25;
        c.detail('crate', s, s * 0.8, s, x + (c.rnd() - 0.5) * 0.15, y + 0.02 + (s * 0.8) / 2, z, { tile: 0.8 });
      }
    }
  }
}

function storage(c: BuildContext): void {
  rack(c, 12, 24, 30);
  rack(c, 15.5, 24, 30);
  rack(c, 19, 24, 28);
  c.solid('crate', 1.0, 1.0, 1.0, 20.3, 23.2, 0, 0.8);
  c.solid('crate', 0.9, 0.9, 0.9, 20.3, 23.2, 1.0, 0.8);
  c.solid('crate', 1.0, 1.0, 1.0, 10.9, 23.2, 0, 0.8);
  c.proxy(1.0, 1.9, 1.0, 20.3, 0.95, 23.2, 'Осмотреть ящик', 'Ящик пуст.');
  c.solid('crate', 1.1, 0.9, 1.1, 11.2, 31.4, 0, 0.8);
  c.solid('crate', 0.8, 0.8, 0.8, 12.4, 32.0, 0, 0.8);
  for (const [x, z] of [[19.6, 32.3], [20.4, 32.8], [19.3, 33.0], [20.5, 31.7]]) {
    c.batch.cyl('pipeRust', 0.3, 0.9, 'y', x, 0.45, z, 10);
    c.block(0.6, 0.6, x, z);
  }
  c.batch.cyl('pipeRust', 0.3, 0.9, 'x', 16.4, 0.3, 32.4, 10);
  c.block(0.9, 0.6, 16.4, 32.4);
  c.solid('crate', 1.2, 0.15, 1.0, 17.8, 32.3, 0, 0.8);
  c.detail('crate', 0.7, 0.6, 0.7, 17.8, 0.45, 32.3, { tile: 0.8 });
  c.detail('metal', 0.9, 0.04, 2.0, 20.6, 1.0, 27.0, { rot: [0, 0, 0.6], tile: 1 });
}

function electrical(c: BuildContext): void {
  for (let k = 0; k < 5; k += 1) {
    const z = 22.7 + k * 0.95;
    c.solid('cabinet', 0.9, 2.2, 0.9, 24.55, z);
    c.detail(k % 2 ? 'ledRed' : 'ledGreen', 0.06, 0.06, 0.02, 25.02, 1.9, z - 0.2);
    c.detail('ledGreen', 0.06, 0.06, 0.02, 25.02, 1.9, z + 0.2);
  }
  c.solid('metal', 1.5, 1.8, 2.0, 29.1, 24.5);
  for (const dz of [-0.6, 0, 0.6]) c.batch.cyl('concrete', 0.1, 0.45, 'y', 29.1, 2.02, 24.5 + dz);
  c.detail('hazard', 0.3, 0.006, 2.2, 28.1, 0.005, 24.5, { tile: 0.6 });
  c.signs.add(c.batch, 'ВЫСОКОЕ НАПРЯЖЕНИЕ', 29.97, 2.45, 24.5, -1, 0, 1.0, 0.25);
  c.solid('cabinet', 0.4, 1.4, 0.9, 29.75, 27.0);
  c.detail('hazard', 0.06, 0.4, 0.06, 29.5, 1.0, 26.8, { tile: 0.3 });
  c.proxy(0.6, 1.5, 1.0, 29.7, 0.75, 27.0, 'Осмотреть рубильник', 'Главный рубильник опущен. Питание отключено.');
  for (const z of [23.2, 24.9, 26.1]) c.detail('cable', 3.3, 0.05, 0.07, 26.65, 0.03, z, { tile: 1 });
}

function corridorDebris(c: BuildContext): void {
  // Главный коридор: тёмный участок с препятствиями
  c.batch.cyl('pipeRust', 0.3, 0.9, 'x', 31.5, 0.3, 19.0, 10);
  c.block(0.9, 0.6, 31.5, 19.0);
  c.solid('crate', 0.9, 0.9, 0.9, 36.6, 20.4, 0, 0.8);
  c.solid('crate', 0.7, 0.7, 0.7, 37.5, 20.5, 0, 0.8);
  c.detail('ceiling', 1.0, 0.04, 0.9, 29.6, 0.2, 18.8, { rot: [0.2, 0.3, 0.5], tile: 1 });
  c.detail('ceiling', 0.8, 0.04, 0.8, 30.4, 0.05, 19.9, { rot: [0, 0.8, 0], tile: 1 });
  c.solid('metal', 0.6, 0.9, 1.0, 24.0, 20.2);
  // Сервисные коридоры
  c.solid('crate', 0.8, 0.8, 0.8, 30.0, 29.45, 0, 0.8);
  c.solid('crate', 0.8, 0.8, 0.8, 41.0, 30.4, 0, 0.8);
  c.solid('crate', 0.8, 0.8, 0.8, 34.0, 11.6, 0, 0.8);
  c.solid('metal', 0.9, 0.9, 0.6, 4.5, 28.0);
}

/** Стол с монитором и стулом; коллизия — у стола и стула. */
function desk(c: BuildContext, x: number, z: number, chairZ: number, w = 1.4, d = 0.7): void {
  c.solid('crate', w, 0.75, d, x, z, 0, 1);
  c.detail('screenOff', 0.36, 0.28, 0.05, x - w * 0.2, 0.9, z - d * 0.25);
  c.detail('paper', 0.3, 0.02, 0.4, x + w * 0.2, 0.76, z + 0.05, { rot: [0, c.rnd() * 3, 0] });
  c.solid('fabric', 0.45, 0.5, 0.45, x, chairZ);
}

function offices(c: BuildContext): void {
  // Кабинет 1 (x 33–36, z 14–16): двери в главный и северный сервисный коридоры
  desk(c, 34.1, 14.55, 15.25);
  c.proxy(1.4, 1.0, 0.7, 34.1, 0.5, 14.55, 'Осмотреть стол', 'График дежурств. Последняя строка зачёркнута, поверх написано: «Не выходить».');
  c.solid('cabinet', 0.4, 1.8, 1.0, 33.25, 15.9);
  // Архив (x 38–41, z 14–16)
  for (const x of [38.6, 39.7, 40.8]) c.solid('cabinet', 1.0, 2.0, 0.5, x, 14.3);
  c.solid('crate', 0.7, 0.5, 0.7, 41.55, 16.5, 0, 0.8);
  c.detail('paper', 0.9, 0.02, 0.6, 40.4, 0.006, 15.7, { rot: [0, 0.4, 0] });
  c.proxy(3.4, 2.0, 0.6, 39.7, 1.0, 14.3, 'Осмотреть картотеку', 'Ящики выдвинуты. Ярлыки на папках закрашены чёрным маркером.');
  // Кабинеты 2 и 3 (северная галерея)
  desk(c, 20.7, 1.6, 2.4);
  c.proxy(1.4, 1.0, 0.7, 20.7, 0.5, 1.6, 'Осмотреть стол', 'Чашка с засохшим кофе. Рядом бейдж: имя стёрто.');
  desk(c, 25.7, 1.6, 2.4);
  c.proxy(1.4, 1.0, 0.7, 25.7, 0.5, 1.6, 'Осмотреть стол', 'Настольная лампа ещё горит. Кто-то оставил её включённой.');
  c.solid('cabinet', 0.4, 1.8, 0.9, 23.35, 2.0);
}

function staff(c: BuildContext): void {
  // Комната персонала (x 9–15, z 4–8)
  c.solid('fabric', 2.0, 0.45, 0.8, 11.5, 4.5);
  c.solid('crate', 1.8, 0.75, 0.9, 12.6, 6.5, 0, 1);
  c.detail('paper', 0.3, 0.02, 0.3, 12.2, 0.76, 6.4, { rot: [0, 0.6, 0] });
  c.detail('screenOff', 0.3, 0.2, 0.05, 13.0, 0.85, 6.9);
  c.proxy(1.8, 1.0, 0.9, 12.6, 0.5, 6.5, 'Осмотреть стол', 'Остывший чай в трёх чашках. Смена закончилась давно.');
  for (let k = 0; k < 3; k += 1) c.solid('cabinet', 0.5, 1.9, 0.55, 14.7, 6.5 + k * 0.6, 0, 1);
  c.proxy(0.6, 1.9, 1.8, 14.7, 0.95, 7.1, 'Осмотреть шкафчик', 'Внутри форма с табличкой «Дежурный». Размер на ребёнка.');
  c.solid('metal', 2.0, 0.9, 0.6, 12.6, 8.65);
  c.detail('screenOn', 0.3, 0.2, 0.04, 12.0, 1.15, 8.9);
  c.detail('ledGreen', 0.05, 0.05, 0.02, 12.9, 1.0, 8.9);
  // Кладовая (x 6–7, z 9–11) — тупик
  c.solid('metal', 0.4, 1.8, 1.4, 7.75, 10.5);
  c.batch.cyl('pipeRust', 0.18, 0.4, 'y', 6.5, 0.2, 11.6, 8);
  c.block(0.4, 0.4, 6.5, 11.6);
  c.proxy(0.6, 1.8, 1.4, 7.75, 0.9, 10.5, 'Осмотреть стеллаж', 'Швабры, химия, жёлтые таблички «Мокрый пол». Одна табличка лежит лицом вниз.');
}

function server(c: BuildContext): void {
  // Серверная (x 31–36, z 22–27): ряд у западной стены, короткий ряд у восточной
  const rackAt = (x: number, z: number, faceX: number): void => {
    c.solid('cabinet', 0.9, 2.2, 0.9, x, z);
    c.detail(((x + z) * 7) % 3 < 1 ? 'ledRed' : 'ledGreen', 0.06, 0.06, 0.02, faceX, 1.9, z - 0.2);
    c.detail('ledGreen', 0.06, 0.06, 0.02, faceX, 1.9, z + 0.2);
    c.detail('ledGreen', 0.06, 0.06, 0.02, faceX, 1.4, z);
  };
  for (const z of [22.9, 24.0, 25.1, 26.2]) rackAt(32.0, z, 32.47);
  for (const z of [25.1, 26.2]) rackAt(35.0, z, 34.53);
  c.proxy(0.9, 2.2, 4.2, 32.0, 1.1, 24.55, 'Осмотреть серверы', 'Индикаторы мигают. Что-то до сих пор пишется на диск.');
  c.solid('metal', 1.0, 0.9, 0.6, 36.1, 22.6);
  c.detail('screenOn', 0.5, 0.3, 0.04, 36.1, 1.2, 22.5);
  c.detail('hazard', 0.1, 0.006, 3.0, 33.3, 0.005, 24.5, { tile: 0.6 });
  for (const z of [23.2, 25.6]) c.detail('cable', 2.0, 0.05, 0.07, 33.4, 0.03, z, { tile: 1 });
}

function tech(c: BuildContext): void {
  // Закрытая техническая зона (x 38–41, z 22–27): трансформатор, генератор, силовая колонна
  c.solid('metal', 1.2, 1.7, 1.2, 40.3, 23.0);
  for (const dz of [-0.35, 0.35]) c.batch.cyl('concrete', 0.1, 0.4, 'y', 40.3, 1.9, 23.0 + dz);
  c.detail('hazard', 1.3, 0.006, 0.2, 40.3, 0.005, 23.8, { tile: 0.6 });
  c.solid('concrete', 0.6, c.H, 0.6, 38.7, 26.6);
  c.detail('hazard', 0.62, 0.3, 0.62, 38.7, 0.5, 26.6, { tile: 0.3 });
  c.solid('metal', 1.0, 1.0, 1.3, 40.5, 25.6);
  c.batch.cyl('pipe', 0.12, 3.0, 'y', 41.7, 1.6, 24.4);
  c.batch.cyl('pipe', 0.12, 3.0, 'y', 41.7, 1.6, 26.0);
  c.signs.add(c.batch, 'ВЫСОКОЕ НАПРЯЖЕНИЕ', 41.97, 2.45, 24.5, -1, 0, 1.0, 0.25);
  c.proxy(1.2, 1.7, 1.2, 40.3, 0.85, 23.0, 'Осмотреть трансформатор', 'Корпус тёплый на ощупь. Хотя питание отключено.');
  c.proxy(1.0, 1.0, 1.3, 40.5, 0.5, 25.6, 'Осмотреть генератор', 'Топливный бак пуст. На счётчике моточасов — сплошные девятки.');
}

function airlock(c: BuildContext): void {
  // Шлюз 2: дезактивационный тамбур между сервисным коридором и лабораторией Б
  c.detail('hazard', 2.8, 0.006, 0.2, 30.5, 0.005, 32.5, { tile: 0.6 });
  c.detail('hazard', 2.8, 0.006, 0.2, 30.5, 0.005, 33.5, { tile: 0.6 });
  for (const x of [29.2, 31.8]) c.batch.cyl('pipe', 0.05, c.H, 'y', x, c.H / 2, 32.2);
  c.detail('ledRed', 0.07, 0.07, 0.02, 31.96, 1.6, 33.6);
  c.signs.add(c.batch, 'КАРАНТИН', 31.97, 2.3, 33.0, -1, 0, 0.9, 0.22);
}

function labB(c: BuildContext): void {
  // Лаборатория Б (x 24–34, z 35–43): два рабочих острова, шкафы у стены, ряд колб и большой резервуар — ориентир
  c.solid('metal', 3.4, 0.9, 1.0, 27.5, 38.6);
  c.solid('metal', 3.0, 0.9, 1.0, 32.0, 38.6);
  for (const [x, z] of [[26.8, 38.5], [28.4, 38.7], [31.4, 38.6], [32.8, 38.5]] as const) {
    c.batch.cyl('tank', 0.07, 0.28, 'y', x, 1.04, z);
  }
  c.detail('screenOff', 0.4, 0.3, 0.05, 27.0, 1.1, 38.3);
  c.detail('paper', 0.3, 0.02, 0.4, 32.4, 0.91, 38.8, { rot: [0, 0.8, 0] });
  for (let k = 0; k < 4; k += 1) c.solid('cabinet', 0.6, 2.0, 1.0, 24.35, 36.6 + k * 1.15);
  for (const x of [25.6, 27.2, 28.8]) {
    c.batch.cyl('tank', 0.45, 2.0, 'y', x, 1.2, 42.4, 10);
    c.batch.cyl('metal', 0.5, 0.15, 'y', x, 0.08, 42.4, 10);
    c.batch.cyl('metal', 0.5, 0.15, 'y', x, 2.3, 42.4, 10);
    c.block(0.9, 0.9, x, 42.4);
  }
  c.decal('stain', 1.6, 1.2, 28.4, 41.2, 0.4);
  // Центральный ориентир: огромный резервуар с зелёным свечением
  c.batch.cyl('tank', 0.9, 2.8, 'y', 33.0, 1.5, 41.6, 14);
  c.batch.cyl('metal', 1.0, 0.2, 'y', 33.0, 0.1, 41.6, 14);
  c.batch.cyl('metal', 1.0, 0.2, 'y', 33.0, 2.9, 41.6, 14);
  c.block(1.9, 1.9, 33.0, 41.6);
  c.proxy(2.0, 2.8, 2.0, 33.0, 1.4, 41.6, 'Осмотреть резервуар', 'Стекло изнутри в трещинах. Что бы там ни находилось, оно вышло само.');
  c.proxy(3.6, 1.0, 1.0, 27.5, 0.5, 38.6, 'Осмотреть стол', 'Пробирки в штативах, подписи: «Образец 7», «Образец 7-Б», «Образец 7-Б (не открывать)».');
}

function chamber(c: BuildContext): void {
  // Испытательная камера (x 36–41, z 32–37): пустой зал с креслом в центре — тупик для будущих событий
  c.detail('hazard', 3.0, 0.006, 3.0, 38.5, 0.005, 34.5, { tile: 0.6 });
  c.solid('metal', 0.6, 0.9, 0.6, 38.5, 34.5);
  c.detail('metal', 0.5, 0.06, 0.5, 38.5, 1.0, 34.5, { tile: 1 });
  c.detail('cable', 0.04, 0.9, 0.04, 38.5, 2.7, 34.0, { tile: 1 });
  c.proxy(0.8, 1.2, 0.8, 38.5, 0.6, 34.5, 'Осмотреть кресло', 'Кресло с ремнями. Подлокотники вытерты до металла, на спинке — царапины.');
  c.signs.add(c.batch, 'КАРАНТИН', 41.97, 2.3, 34.5, -1, 0, 0.9, 0.22);
}

function ventRoom(c: BuildContext): void {
  // Вентиляционная (x 38–44, z 39–43): тупик, два вытяжных короба и вентилятор
  c.solid('metal', 1.2, c.H, 1.2, 40.0, 41.6);
  c.solid('metal', 1.2, c.H, 1.2, 42.2, 41.6);
  c.detail('vent', 0.9, 0.9, 0.06, 40.0, 1.6, 40.97);
  c.detail('vent', 0.9, 0.9, 0.06, 42.2, 1.6, 40.97);
  c.batch.cyl('pipe', 0.22, 1.8, 'x', 41.1, 2.8, 41.6);
  c.detail('hazard', 0.1, 0.006, 3.5, 38.6, 0.005, 41.5, { tile: 0.6 });
  c.proxy(1.2, 2.4, 1.2, 40.0, 1.2, 41.6, 'Осмотреть короб', 'Изнутри слышно, как что-то медленно ползёт вверх.');
}

function lobbyControl(c: BuildContext): void {
  // Контрольная зона вестибюля: две будки поста допуска и перемычка над входом в главный коридор
  c.solid('metal', 0.7, 1.1, 1.4, 7.6, 17.4);
  c.solid('metal', 0.7, 1.1, 1.4, 7.6, 21.6);
  c.detail('screenOff', 0.4, 0.3, 0.05, 7.6, 1.35, 16.8);
  c.detail('screenOn', 0.4, 0.3, 0.05, 7.6, 1.35, 21.0);
  c.detail('hazard', 0.1, 0.006, 4.0, 8.6, 0.005, 19.5, { tile: 0.6 });
  c.detail('concrete', 0.3, 0.5, 3.0, 8.9, 2.95, 19.5, { tile: 1 });
  c.signs.add(c.batch, 'КОНТРОЛЬ ДОСТУПА', 8.74, 2.6, 19.5, -1, 0, 1.4, 0.3);
  c.proxy(0.7, 1.1, 1.4, 7.6, 0.55, 21.6, 'Осмотреть пост', 'Журнал допуска. Последний записавшийся вышел за час до отключения света. Выхода нет.');
  // Колонны главного коридора — ориентир на полпути
  c.solid('concrete', 0.5, c.H, 0.5, 22.0, 18.35);
  c.solid('concrete', 0.5, c.H, 0.5, 22.0, 20.65);
  c.detail('hazard', 0.52, 0.3, 0.52, 22.0, 0.4, 18.35, { tile: 0.3 });
  c.detail('hazard', 0.52, 0.3, 0.52, 22.0, 0.4, 20.65, { tile: 0.3 });
}

function medical(c: BuildContext): void {
  // Медблок (x 32–37, z 4–9): две койки, ширма, процедурный стол, шкаф и мойка
  for (const x of [34.3, 36.2]) {
    c.solid('metal', 1.0, 0.5, 2.0, x, 5.1);
    c.detail('fabric', 0.9, 0.12, 1.9, x, 0.56, 5.1, { tile: 1 });
  }
  c.solid('fabric', 0.05, 1.7, 1.4, 35.25, 5.0, 0, 1);
  c.solid('metal', 1.8, 0.8, 0.8, 34.6, 7.4);
  c.solid('cabinet', 1.2, 1.8, 0.5, 33.2, 8.7);
  c.solid('metal', 1.4, 0.9, 0.6, 35.8, 8.7);
  c.batch.cyl('pipe', 0.12, 0.1, 'y', 35.8, 0.95, 8.7);
  c.detail('ledGreen', 0.5, 0.12, 0.03, 35.0, 2.1, 4.03);
  c.detail('ledGreen', 0.12, 0.5, 0.03, 35.0, 2.1, 4.03);
  c.proxy(2.4, 0.7, 2.0, 35.25, 0.35, 5.1, 'Осмотреть койки', 'Ремни расстёгнуты. Простыня смята, словно кто-то только что встал.');
  c.proxy(1.2, 1.8, 0.5, 33.2, 0.9, 8.7, 'Осмотреть шкаф', 'Ампулы без этикеток. Ровно половина разбита изнутри.');
}

function isolation(c: BuildContext): void {
  // Изолятор: коридор (x 39–43, z 6–7) и две палаты (x 39–40 и 42–43, z 3–4)
  c.solid('metal', 0.8, 0.45, 1.6, 40.4, 3.9);
  c.solid('metal', 0.8, 0.45, 1.6, 43.4, 3.9);
  c.proxy(0.9, 0.9, 1.7, 40.4, 0.45, 3.9, 'Осмотреть койку', 'Ремни порваны изнутри.');
  c.proxy(0.9, 0.9, 1.7, 43.4, 0.45, 3.9, 'Осмотреть койку', 'Матрас вспорот. Набивка пропитана чем-то тёмным.');
  c.detail('hazard', 4.6, 0.006, 0.2, 41.0, 0.005, 6.5, { tile: 0.6 });
  c.signs.add(c.batch, 'КАРАНТИН', 41.5, 2.3, 6.03, 0, 1, 0.9, 0.22);
  c.detail('paper', 0.5, 0.02, 0.5, 42.0, 0.006, 4.4, { rot: [0, 0.6, 0] });
  c.proxy(0.2, 2.4, 1.8, 39.1, 1.2, 3.9, 'Осмотреть стену', 'Стена исцарапана до самого потолка. Царапины идут изнутри.');
}

/** Вся обстановка здания. */
export function buildProps(c: BuildContext): void {
  placeLights(c);
  placeLightsStage3(c);
  for (const zone of ZONES) {
    for (const r of zone.rects) {
      ceilingWork(c, zone.id, r);
      floorClutter(c, r, zone.id === 'lab' || zone.id === 'security' ? 0.1 : 0.05);
    }
  }
  wallDetails(c);
  lobby(c);
  security(c);
  lab(c);
  storage(c);
  electrical(c);
  corridorDebris(c);
  lobbyControl(c);
  offices(c);
  staff(c);
  server(c);
  tech(c);
  airlock(c);
  labB(c);
  chamber(c);
  ventRoom(c);
  medical(c);
  isolation(c);
}
