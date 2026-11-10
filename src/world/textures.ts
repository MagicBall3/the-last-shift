import * as THREE from 'three';

type Rng = () => number;

/** Детерминированный генератор: здание одинаково при каждом запуске. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 256;

function canvas(w = SIZE, h = SIZE): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D-контекст недоступен');
  return [c, ctx];
}

/** Рисует фигуру со смещениями ±SIZE, чтобы текстура бесшовно повторялась. */
function tiled(fn: (dx: number, dy: number) => void): void {
  for (const dx of [-SIZE, 0, SIZE]) for (const dy of [-SIZE, 0, SIZE]) fn(dx, dy);
}

function blotches(ctx: CanvasRenderingContext2D, rnd: Rng, count: number, minR: number, maxR: number, strength: number): void {
  for (let n = 0; n < count; n += 1) {
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    const r = minR + rnd() * (maxR - minR);
    const v = rnd() < 0.55 ? 0 : 255;
    ctx.fillStyle = `rgba(${v},${v},${v},${(0.02 + rnd() * strength).toFixed(3)})`;
    tiled((dx, dy) => {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function streaks(ctx: CanvasRenderingContext2D, rnd: Rng, count: number, color: string): void {
  for (let n = 0; n < count; n += 1) {
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    const w = 2 + rnd() * 9;
    const h = 40 + rnd() * 160;
    tiled((dx, dy) => {
      const g = ctx.createLinearGradient(0, y + dy, 0, y + dy + h);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x + dx, y + dy, w, h);
    });
  }
}

function grain(ctx: CanvasRenderingContext2D, rnd: Rng, amount: number): void {
  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function cracks(ctx: CanvasRenderingContext2D, rnd: Rng, count: number): void {
  ctx.strokeStyle = 'rgba(10,10,10,0.55)';
  ctx.lineWidth = 1;
  for (let n = 0; n < count; n += 1) {
    let x = rnd() * SIZE;
    let y = rnd() * SIZE;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 8; s += 1) {
      x += (rnd() - 0.5) * 26;
      y += rnd() * 22;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function finish(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function concrete(rnd: Rng, base: number, seams: boolean): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  ctx.fillStyle = `rgb(${base},${base},${base - 6})`;
  ctx.fillRect(0, 0, SIZE, SIZE);
  blotches(ctx, rnd, 70, 6, 42, 0.1);
  streaks(ctx, rnd, 12, 'rgba(0,0,0,0.22)');
  streaks(ctx, rnd, 4, 'rgba(120,70,30,0.16)');
  cracks(ctx, rnd, 3);
  if (seams) {
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(0, 0, SIZE, 2);
    ctx.fillRect(0, 0, 2, SIZE);
    ctx.fillRect(SIZE / 2, 0, 1, SIZE);
  }
  grain(ctx, rnd, 24);
  return finish(c);
}

function tiles(rnd: Rng, base: [number, number, number], count: number): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  const step = SIZE / count;
  for (let j = 0; j < count; j += 1) {
    for (let i = 0; i < count; i += 1) {
      const v = (rnd() - 0.5) * 16;
      ctx.fillStyle = `rgb(${base[0] + v},${base[1] + v},${base[2] + v})`;
      ctx.fillRect(i * step, j * step, step, step);
    }
  }
  ctx.fillStyle = 'rgba(40,44,42,0.85)';
  for (let k = 0; k < count; k += 1) {
    ctx.fillRect(k * step, 0, 2, SIZE);
    ctx.fillRect(0, k * step, SIZE, 2);
  }
  blotches(ctx, rnd, 40, 8, 40, 0.1);
  streaks(ctx, rnd, 14, 'rgba(30,20,10,0.25)');
  grain(ctx, rnd, 18);
  return finish(c);
}

function metal(rnd: Rng, base: [number, number, number]): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
  ctx.fillRect(0, 0, SIZE, SIZE);
  blotches(ctx, rnd, 30, 10, 50, 0.07);
  for (let n = 0; n < 14; n += 1) {
    ctx.fillStyle = `rgba(150,80,40,${(0.06 + rnd() * 0.14).toFixed(2)})`;
    tiled((dx, dy) => ctx.fillRect(rnd() * 0 + n * 17 + dx, (n * 53) % SIZE + dy, 10 + rnd() * 40, 6 + rnd() * 30));
  }
  // панели 2×2 с рамкой и заклёпками
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2);
  ctx.beginPath();
  ctx.moveTo(SIZE / 2, 0);
  ctx.lineTo(SIZE / 2, SIZE);
  ctx.moveTo(0, SIZE / 2);
  ctx.lineTo(SIZE, SIZE / 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(30,30,30,0.7)';
  for (let y = 12; y < SIZE; y += SIZE / 4) for (let x = 12; x < SIZE; x += SIZE / 4) {
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(230,230,230,0.12)';
  for (let n = 0; n < 24; n += 1) {
    ctx.beginPath();
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * 70, y + (rnd() - 0.5) * 8);
    ctx.stroke();
  }
  grain(ctx, rnd, 20);
  return finish(c);
}

function diamondPlate(rnd: Rng): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  ctx.fillStyle = 'rgb(88,92,94)';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const step = SIZE / 8;
  for (let j = 0; j < 8; j += 1) {
    for (let i = 0; i < 8; i += 1) {
      const flip = (i + j) % 2 === 0;
      ctx.strokeStyle = 'rgba(190,196,198,0.42)';
      ctx.beginPath();
      ctx.moveTo(i * step + 6, j * step + (flip ? 6 : step - 6));
      ctx.lineTo(i * step + step - 6, j * step + (flip ? step - 6 : 6));
      ctx.stroke();
    }
  }
  blotches(ctx, rnd, 36, 10, 46, 0.12);
  streaks(ctx, rnd, 6, 'rgba(0,0,0,0.3)');
  grain(ctx, rnd, 20);
  return finish(c);
}

function ceilingTex(rnd: Rng): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  ctx.fillStyle = 'rgb(112,112,108)';
  ctx.fillRect(0, 0, SIZE, SIZE);
  blotches(ctx, rnd, 50, 8, 44, 0.12);
  streaks(ctx, rnd, 10, 'rgba(60,40,20,0.3)');
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, SIZE, 3);
  ctx.fillRect(0, 0, 3, SIZE);
  ctx.fillRect(SIZE / 2, 0, 2, SIZE);
  ctx.fillRect(0, SIZE / 2, SIZE, 2);
  grain(ctx, rnd, 22);
  return finish(c);
}

function hazard(rnd: Rng): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  ctx.fillStyle = 'rgb(214,164,24)';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = 'rgb(20,20,18)';
  ctx.lineWidth = 32;
  for (let k = -4; k <= 8; k += 1) {
    ctx.beginPath();
    ctx.moveTo(k * 64, -10);
    ctx.lineTo(k * 64 + SIZE + 20, SIZE + 10);
    ctx.stroke();
  }
  blotches(ctx, rnd, 40, 6, 30, 0.2);
  grain(ctx, rnd, 30);
  return finish(c);
}

function wood(rnd: Rng): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  const plank = SIZE / 4;
  for (let p = 0; p < 4; p += 1) {
    const v = (rnd() - 0.5) * 30;
    ctx.fillStyle = `rgb(${128 + v},${92 + v},${54 + v})`;
    ctx.fillRect(0, p * plank, SIZE, plank);
    ctx.strokeStyle = 'rgba(40,24,10,0.35)';
    for (let n = 0; n < 9; n += 1) {
      const y = p * plank + rnd() * plank;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(SIZE, y + (rnd() - 0.5) * 6);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, p * plank, SIZE, 3);
  }
  ctx.strokeStyle = 'rgba(30,18,8,0.8)';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, SIZE - 10, SIZE - 10);
  ctx.fillStyle = 'rgba(190,190,190,0.5)';
  for (const [x, y] of [[14, 14], [SIZE - 14, 14], [14, SIZE - 14], [SIZE - 14, SIZE - 14]]) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  blotches(ctx, rnd, 20, 8, 40, 0.1);
  grain(ctx, rnd, 22);
  return finish(c);
}

function cabinet(rnd: Rng): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  ctx.fillStyle = 'rgb(86,98,94)';
  ctx.fillRect(0, 0, SIZE, SIZE);
  blotches(ctx, rnd, 24, 10, 40, 0.1);
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, SIZE - 16, SIZE - 16);
  ctx.beginPath();
  ctx.moveTo(SIZE / 2, 8);
  ctx.lineTo(SIZE / 2, SIZE - 8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(20,20,20,0.8)';
  ctx.fillRect(SIZE / 2 - 14, SIZE / 2 - 14, 8, 28);
  ctx.fillRect(SIZE / 2 + 6, SIZE / 2 - 14, 8, 28);
  for (let k = 0; k < 6; k += 1) ctx.fillRect(24, 24 + k * 7, 70, 3);
  ctx.fillStyle = 'rgba(205,205,190,0.85)';
  ctx.fillRect(150, 30, 70, 26);
  ctx.fillStyle = 'rgba(30,30,30,0.7)';
  for (let k = 0; k < 4; k += 1) ctx.fillRect(155, 35 + k * 5, 55 - k * 8, 2);
  streaks(ctx, rnd, 6, 'rgba(0,0,0,0.3)');
  grain(ctx, rnd, 20);
  return finish(c);
}

function vent(rnd: Rng): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  ctx.fillStyle = 'rgb(18,19,19)';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = 'rgb(88,92,92)';
  for (let y = 10; y < SIZE; y += 20) ctx.fillRect(0, y, SIZE, 9);
  ctx.strokeStyle = 'rgb(70,74,74)';
  ctx.lineWidth = 12;
  ctx.strokeRect(0, 0, SIZE, SIZE);
  grain(ctx, rnd, 26);
  return finish(c);
}

function dirt(rnd: Rng): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  ctx.fillStyle = 'rgb(96,86,72)';
  ctx.fillRect(0, 0, SIZE, SIZE);
  blotches(ctx, rnd, 90, 4, 34, 0.18);
  streaks(ctx, rnd, 8, 'rgba(40,30,20,0.25)');
  for (let n = 0; n < 60; n += 1) {
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    const r = 1 + rnd() * 3;
    ctx.fillStyle = `rgba(${(60 + rnd() * 40) | 0},${(50 + rnd() * 30) | 0},${(40 + rnd() * 20) | 0},0.5)`;
    tiled((dx, dy) => {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  grain(ctx, rnd, 26);
  return finish(c);
}

function asphalt(rnd: Rng): THREE.CanvasTexture {
  const [c, ctx] = canvas();
  ctx.fillStyle = 'rgb(54,56,58)';
  ctx.fillRect(0, 0, SIZE, SIZE);
  blotches(ctx, rnd, 40, 8, 50, 0.12);
  streaks(ctx, rnd, 10, 'rgba(0,0,0,0.3)');
  cracks(ctx, rnd, 5);
  for (let n = 0; n < 6; n += 1) {
    const x = rnd() * SIZE;
    const y = rnd() * SIZE;
    ctx.fillStyle = 'rgba(30,32,34,0.5)';
    tiled((dx, dy) => ctx.fillRect(x + dx, y + dy, 20 + rnd() * 40, 14 + rnd() * 30));
  }
  grain(ctx, rnd, 24);
  return finish(c);
}

export type TextureName =
  | 'concreteWall' | 'concreteDark' | 'floorConcrete' | 'tileWall' | 'tileFloor' | 'metalWall'
  | 'diamond' | 'ceiling' | 'hazard' | 'wood' | 'cabinet' | 'vent'
  | 'floorExterior' | 'floorAsphalt';

export function createTextures(seed: number): Record<TextureName, THREE.CanvasTexture> {
  const rnd = makeRng(seed);
  return {
    concreteWall: concrete(rnd, 134, true),
    concreteDark: concrete(rnd, 104, true),
    floorConcrete: concrete(rnd, 96, false),
    tileWall: tiles(rnd, [206, 214, 208], 4),
    tileFloor: tiles(rnd, [150, 156, 150], 4),
    metalWall: metal(rnd, [112, 122, 122]),
    diamond: diamondPlate(rnd),
    ceiling: ceilingTex(rnd),
    hazard: hazard(rnd),
    wood: wood(rnd),
    cabinet: cabinet(rnd),
    vent: vent(rnd),
    floorExterior: dirt(rnd),
    floorAsphalt: asphalt(rnd),
  };
}

/** Метры на одно повторение текстуры. */
export const TILE: Record<string, number> = {
  concreteWall: 2, concreteDark: 2, floorConcrete: 2, tileWall: 1.6, tileFloor: 1.6,
  metalWall: 1.5, diamond: 1.2, ceiling: 1.2,
  floorExterior: 3, floorAsphalt: 3,
};

const lambert = (map: THREE.Texture | null, color: number, vertexColors = false) =>
  new THREE.MeshLambertMaterial({ map, color, vertexColors });
const basic = (color: number) => new THREE.MeshBasicMaterial({ color });
const plain = (color: number) => new THREE.MeshLambertMaterial({ color });

export function createMaterials(t: Record<TextureName, THREE.CanvasTexture>): Record<string, THREE.Material> {
  return {
    // оболочка здания (с вертексными цветами: затемнение у пола и потолка)
    wallConcrete: lambert(t.concreteWall, 0xc4c4bc, true),
    wallDark: lambert(t.concreteDark, 0xa9aca4, true),
    wallTile: lambert(t.tileWall, 0xcad4cd, true),
    wallMetal: lambert(t.metalWall, 0xa8b8b4, true),
    // этап 3: оттенки существующих текстур — новые текстуры и память не нужны
    wallOffice: lambert(t.concreteWall, 0xb9b39a, true),
    wallStaff: lambert(t.concreteWall, 0xc2a888, true),
    wallServer: lambert(t.metalWall, 0x8aa2b8, true),
    wallMed: lambert(t.tileWall, 0xb2d6c4, true),
    wallTech: lambert(t.metalWall, 0xb09a62, true),
    floorOffice: lambert(t.floorConcrete, 0x5a6a66),
    floorStaff: lambert(t.floorConcrete, 0x8a6e54),
    floorServer: lambert(t.tileFloor, 0x8a9fb4),
    floorMed: lambert(t.tileFloor, 0xa4cbb4),
    floorConcrete: lambert(t.floorConcrete, 0xb4b4ae),
    floorTile: lambert(t.tileFloor, 0xb8beb8),
    floorMetal: lambert(t.diamond, 0xb0b8b8),
    floorExterior: lambert(t.floorExterior, 0x9a8a76),
    floorAsphalt: lambert(t.floorAsphalt, 0x7a7c7e),
    wallExterior: lambert(t.concreteWall, 0xa8a89e, true),
    ceiling: lambert(t.ceiling, 0xa0a09a),
    // детали
    concrete: lambert(t.concreteWall, 0xa8a8a0),
    metal: lambert(t.metalWall, 0xb4bcbc),
    doorMetal: lambert(t.metalWall, 0x7f9488),
    hazard: lambert(t.hazard, 0xd0d0d0),
    crate: lambert(t.wood, 0xd0d0d0),
    cabinet: lambert(t.cabinet, 0xc8c8c8),
    vent: lambert(t.vent, 0xdddddd),
    pipe: plain(0x4a4f50),
    pipeRust: plain(0x6a4632),
    cable: plain(0x0d0d0d),
    paper: plain(0xcfcfc4),
    stain: plain(0x15110d),
    extinguisher: plain(0x8a1c14),
    fabric: plain(0x2f3a36),
    // светящиеся элементы (не зависят от освещения)
    lampOn: basic(0xdfe8d0),
    lampOff: plain(0x2a2c2b),
    emRed: basic(0xff3322),
    ledRed: basic(0xff2a1a),
    ledGreen: basic(0x31ff6a),
    screenOn: basic(0x3a8ea6),
    screenOff: plain(0x07090a),
    tank: basic(0x1b4a38),
  };
}
