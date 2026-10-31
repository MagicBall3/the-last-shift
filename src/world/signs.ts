import * as THREE from 'three';
import { StaticBatch, withColor } from './StaticBatch';

const SLOT_W = 256;
const SLOT_H = 64;
const COLS = 2;

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Одна текстура-атлас со всеми табличками: все вывески рисуются одним вызовом отрисовки. */
export class SignAtlas {
  readonly texture: THREE.CanvasTexture;
  private readonly slots = new Map<string, number>();
  private readonly rows: number;
  private readonly height: number;

  constructor(labels: string[]) {
    const unique = [...new Set(labels)];
    unique.forEach((label, i) => this.slots.set(label, i));
    this.rows = Math.ceil(unique.length / COLS);
    this.height = nextPow2(this.rows * SLOT_H);

    const c = document.createElement('canvas');
    c.width = SLOT_W * COLS;
    c.height = this.height;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('2D-контекст недоступен');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, c.width, c.height);

    unique.forEach((label, i) => {
      const x = (i % COLS) * SLOT_W;
      const y = Math.floor(i / COLS) * SLOT_H;
      ctx.fillStyle = '#161d18';
      ctx.fillRect(x + 2, y + 2, SLOT_W - 4, SLOT_H - 4);
      ctx.strokeStyle = '#6b6a3a';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, SLOT_W - 8, SLOT_H - 8);
      ctx.fillStyle = '#d6d27a';
      ctx.font = 'bold 28px sans-serif';
      const width = ctx.measureText(label).width;
      const scale = Math.min(1, (SLOT_W - 24) / width);
      ctx.save();
      ctx.translate(x + SLOT_W / 2, y + SLOT_H / 2 + 1);
      ctx.scale(scale, 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });

    this.texture = new THREE.CanvasTexture(c);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
  }

  /** Табличка w×h м с центром (x, y, z), смотрит в сторону (nx, nz). */
  add(batch: StaticBatch, label: string, x: number, y: number, z: number, nx: number, nz: number, w = 0.8, h = 0.2): void {
    const slot = this.slots.get(label);
    if (slot === undefined) throw new Error(`Нет таблички «${label}» в атласе`);
    const u0 = ((slot % COLS) * SLOT_W) / (SLOT_W * COLS);
    const u1 = u0 + 1 / COLS;
    const row = Math.floor(slot / COLS);
    const v1 = 1 - (row * SLOT_H) / this.height;
    const v0 = v1 - SLOT_H / this.height;

    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i += 1) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
    g.rotateY(Math.atan2(nx, nz));
    g.translate(x, y, z);
    batch.addRaw('sign', withColor(g));
  }
}
