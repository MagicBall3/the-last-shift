import type { BuildContext } from '../context';
import type { Rect } from '../layout';

/** Лабораторный стол с колбами и монитором. */
function labBench(c: BuildContext, x: number, z: number): void {
  c.solid('metal', 2.6, 0.9, 1.0, x, z);
  for (const dx of [-0.8, 0, 0.8]) c.batch.cyl('tank', 0.06, 0.28, 'y', x + dx, 1.04, z);
  c.detail('screenOff', 0.4, 0.3, 0.05, x - 0.6, 1.1, z - 0.25);
  c.detail('paper', 0.3, 0.02, 0.4, x + 0.6, 0.91, z + 0.1, { rot: [0, c.rnd() * 3, 0] });
}

/** Стойка серверов. */
function rack(c: BuildContext, x: number, z: number): void {
  c.solid('cabinet', 0.9, 2.2, 0.9, x, z);
  c.detail('ledGreen', 0.06, 0.06, 0.02, x + 0.47, 1.9, z - 0.2);
  c.detail('ledRed', 0.06, 0.06, 0.02, x + 0.47, 1.4, z);
}

/** Койка с ремнями (изолятор). */
function cot(c: BuildContext, x: number, z: number): void {
  c.solid('metal', 0.8, 0.45, 1.6, x, z);
  c.detail('fabric', 0.7, 0.1, 1.5, x, 0.5, z, { tile: 1 });
  c.detail('cable', 0.03, 0.5, 0.03, x, 0.9, z - 0.6, { tile: 1 });
}

/** Уровень −1: лаборатории. */
export function buildLabProps(c: BuildContext, labs: Rect[], servers: Rect[]): void {
  for (let x = 10; x < 40; x += 8) c.lamp({ x, z: 22, intensity: 14, distance: 9, mode: x % 16 === 10 ? 'fluoro' : 'steady' });
  c.deadLamp(30, 22);
  c.lamp({ x: 44, z: 15, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 7, mode: 'pulse', y: 2.6 });

  for (const r of labs) {
    const cx = r.x + r.w / 2;
    labBench(c, cx, r.z + 1.6);
    labBench(c, cx, r.z + r.d - 1.6);
    c.solid('cabinet', 0.6, 2.0, 1.0, r.x + 0.4, r.z + r.d / 2);
    c.lamp({ x: cx, z: r.z + r.d / 2, intensity: 16, distance: 9, mode: 'fluoro' });
    c.decal('stain', 1.2, 0.9, cx, r.z + r.d / 2, c.rnd() * Math.PI);
  }

  for (const r of servers) {
    // 2 м отступ от стен: дверь стоит по центру короткой стены
    for (let z = r.z + 2; z < r.z + r.d - 1.5; z += 2) rack(c, r.x + r.w / 2, z);
    c.lamp({ x: r.x + r.w / 2, z: r.z + r.d / 2, color: 0x7fb6ff, intensity: 14, distance: 8, mode: 'fluoro' });
  }
}

/** Уровень −2: изоляторы и сектор капсулы (место аварии). */
export function buildContainmentProps(c: BuildContext, cells: Rect[], capsule: Rect[], medical: Rect[]): void {
  for (let x = 10; x < 40; x += 8) {
    c.lamp({ x, z: 22, intensity: 12, distance: 8, mode: x % 16 === 10 ? 'broken' : 'fluoro' });
  }
  c.lamp({ x: 44, z: 15, kind: 'em', color: 0xff2a1a, intensity: 6, distance: 7, mode: 'pulse', y: 2.6 });
  c.lamp({ x: 44, z: 21, kind: 'em', color: 0xff2a1a, intensity: 6, distance: 7, mode: 'pulse', y: 2.6 });

  for (const r of cells) {
    cot(c, r.x + r.w / 2, r.z + 1.6);
    c.solid('metal', 0.6, 2.4, 0.06, r.x + 0.4, 1.2, r.z + r.d / 2);
    c.lamp({ x: r.x + r.w / 2, z: r.z + 2.4, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 6, mode: 'pulse', y: 2.6 });
    c.detail('paper', 0.4, 0.02, 0.5, r.x + r.w / 2, 0.006, r.z + r.d - 1.2, { rot: [0, c.rnd() * 3, 0] });
  }

  // Сектор капсулы — место серьёзной аварии
  if (capsule.length > 0) {
    const r = capsule[0];
    // повреждённая капсула по центру
    c.batch.cyl('tank', 1.1, 2.6, 'y', r.x + r.w / 2, 1.4, r.z + r.d / 2, 14);
    c.batch.cyl('metal', 1.2, 0.2, 'y', r.x + r.w / 2, 0.1, r.z + r.d / 2, 14);
    c.batch.cyl('metal', 1.2, 0.2, 'y', r.x + r.w / 2, 2.9, r.z + r.d / 2, 14);
    c.block(2.4, 2.4, r.x + r.w / 2, r.z + r.d / 2);
    // разбитое стекло и разбросанное оборудование
    for (let n = 0; n < 8; n += 1) {
      const px = r.x + 2 + c.rnd() * (r.w - 4);
      const pz = r.z + 2 + c.rnd() * (r.d - 4);
      c.batch.box('paper', 0.5, 0.02, 0.4, px, 0.02, pz, { rot: [0, c.rnd() * Math.PI, 0], tile: 1 });
    }
    for (let n = 0; n < 6; n += 1) {
      const px = r.x + 2 + c.rnd() * (r.w - 4);
      const pz = r.z + 2 + c.rnd() * (r.d - 4);
      c.batch.cyl('pipeRust', 0.25, 0.8, 'y', px, 0.4, pz, 10);
      c.block(0.5, 0.5, px, pz);
    }
    c.decal('stain', 3.0, 2.2, r.x + r.w / 2, r.z + r.d / 2, 0.3);
    c.decal('stain', 2.0, 1.6, r.x + r.w / 2 + 2, r.z + r.d / 2 - 1.5, 1.1);
    c.lamp({ x: r.x + r.w / 2, z: r.z + r.d / 2, y: 2.2, color: 0x4cff9a, intensity: 10, distance: 8, mode: 'pulse', kind: 'none' });
    c.proxy(2.6, 2.6, 2.6, r.x + r.w / 2, 1.3, r.z + r.d / 2, 'Осмотреть капсулу', 'Капсула №3 разбита изнутри. Что-то вышло через стекло.');
    c.proxy(2.0, 0.5, 2.0, r.x + r.w / 2, 0.25, r.z + r.d / 2, 'Осмотреть пол', 'Следы тянутся к вентиляционной шахте в углу.');
  }

  for (const r of medical) {
    cot(c, r.x + r.w / 3, r.z + r.d / 2);
    cot(c, r.x + r.w * 2 / 3, r.z + r.d / 2);
    c.solid('cabinet', 1.2, 1.8, 0.5, r.x + 0.6, r.z + 0.8);
    c.lamp({ x: r.x + r.w / 2, z: r.z + r.d / 2, color: 0xd8f0e4, intensity: 15, distance: 9 });
  }
}

/** Уровень −3: серверные, архив, энергетика. */
export function buildServerArchiveProps(c: BuildContext, servers: Rect[], storage: Rect[], offices: Rect[], electrical: Rect[], tech: Rect[]): void {
  for (let x = 10; x < 40; x += 8) c.lamp({ x, z: 22, intensity: 13, distance: 9, mode: 'fluoro' });
  c.lamp({ x: 44, z: 15, kind: 'em', color: 0xff2a1a, intensity: 5, distance: 7, mode: 'pulse', y: 2.6 });

  for (const r of servers) {
    // 2 м отступ от стен: дверь стоит по центру короткой стены
    for (let z = r.z + 2; z < r.z + r.d - 1.5; z += 2) rack(c, r.x + r.w / 2, z);
    c.lamp({ x: r.x + r.w / 2, z: r.z + r.d / 2, color: 0x7fb6ff, intensity: 15, distance: 8, mode: 'fluoro' });
  }

  for (const r of storage) {
    for (let x = r.x + 1; x < r.x + r.w - 0.5; x += 2) {
      c.solid('cabinet', 0.9, 2.2, 0.9, x, r.z + r.d / 2);
    }
    c.decal('stain', 1.0, 0.8, r.x + r.w / 2, r.z + r.d / 2, 0.2);
  }

  for (const r of offices) {
    c.solid('cabinet', 1.0, 2.0, 0.5, r.x + 0.6, r.z + 1.4);
    c.solid('cabinet', 1.0, 2.0, 0.5, r.x + 0.6, r.z + r.d - 1.4);
    c.solid('crate', 0.7, 0.5, 0.7, r.x + r.w - 1, r.z + r.d / 2, 0, 0.8);
    c.lamp({ x: r.x + r.w / 2, z: r.z + r.d / 2, intensity: 10, distance: 7, mode: 'fluoro' });
  }

  for (const r of electrical) {
    for (let z = r.z + 1; z < r.z + r.d - 0.5; z += 1.4) {
      c.solid('cabinet', 0.9, 2.2, 0.9, r.x + r.w / 2, z);
      c.detail('ledRed', 0.06, 0.06, 0.02, r.x + r.w / 2 + 0.47, 1.9, z - 0.2);
    }
    c.lamp({ x: r.x + r.w / 2, z: r.z + r.d / 2, color: 0xbfd4ff, intensity: 16, distance: 8, mode: 'fluoro' });
  }

  for (const r of tech) {
    c.solid('metal', 1.2, 1.7, 1.2, r.x + r.w / 2, r.z + r.d / 2);
    c.detail('hazard', 1.3, 0.006, 0.2, r.x + r.w / 2, 0.005, r.z + r.d / 2 + 0.7, { tile: 0.6 });
    c.lamp({ x: r.x + r.w / 2, z: r.z + r.d / 2, color: 0xffb060, intensity: 14, distance: 8, mode: 'broken' });
  }
}
