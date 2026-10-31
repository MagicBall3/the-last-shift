import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { Interactable } from '../interactions/Interactable';
import type { LightDef, LightMode } from '../lighting/LightDef';
import type { Grid } from './grid';
import type { WallRun } from './shell';
import { StaticBatch, boxGeometry, type PlaceOpts } from './StaticBatch';
import type { SignAtlas } from './signs';
import type { makeRng } from './textures';

export interface LampOpts {
  x: number;
  z: number;
  y?: number;
  color?: number;
  intensity: number;
  distance: number;
  mode?: LightMode;
  /** tube — потолочный плафон; em — аварийная красная лампа; none — только свет (настольная лампа, свечение) */
  kind?: 'tube' | 'em' | 'none';
  alongZ?: boolean;
}

/** Общий набор инструментов для расстановки геометрии, коллизий, света и интерактивных объектов. */
export class BuildContext {
  readonly H = CONFIG.world.height;

  constructor(
    readonly grid: Grid,
    readonly batch: StaticBatch,
    readonly rnd: ReturnType<typeof makeRng>,
    readonly boxes: THREE.Box3[],
    readonly lights: LightDef[],
    readonly signs: SignAtlas,
    readonly interactables: Interactable[],
    readonly group: THREE.Group,
    readonly runs: WallRun[],
  ) {}

  /** Предмет на полу: видимая коробка + коллизия. z — центр, y0 — высота низа. */
  solid(mat: string, w: number, h: number, d: number, x: number, z: number, y0 = 0, tile = 1.5): void {
    this.batch.box(mat, w, h, d, x, y0 + h / 2, z, { tile });
    this.boxes.push(new THREE.Box3(new THREE.Vector3(x - w / 2, y0, z - d / 2), new THREE.Vector3(x + w / 2, y0 + h, z + d / 2)));
  }

  /** Только коллизия (невидимая). */
  block(w: number, d: number, x: number, z: number): void {
    this.boxes.push(new THREE.Box3(new THREE.Vector3(x - w / 2, 0, z - d / 2), new THREE.Vector3(x + w / 2, this.H, z + d / 2)));
  }

  /** Деталь без коллизии; y — центр. */
  detail(mat: string, w: number, h: number, d: number, x: number, y: number, z: number, opts?: PlaceOpts): void {
    this.batch.box(mat, w, h, d, x, y, z, opts);
  }

  /** Плоское пятно/мусор на полу. */
  decal(mat: string, w: number, d: number, x: number, z: number, yaw: number): void {
    this.batch.box(mat, w, 0.004, d, x, 0.004, z, { rot: [0, yaw, 0], tile: 0.6 });
  }

  /** Невидимая зона взаимодействия: осмотр предметов обстановки. */
  proxy(w: number, h: number, d: number, x: number, y: number, z: number, prompt: string, message: string): void {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial());
    mesh.visible = false;
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    this.interactables.push({ object: mesh, prompt, onInteract: () => message });
  }

  /**
   * Коробка, привязанная к стене. (px, pz) — точка на плоскости стены, (nx, nz) — нормаль в помещение,
   * along — размер вдоль стены, off — смещение вдоль стены, out — вынос от стены (центр).
   */
  wallBox(mat: string, along: number, h: number, depth: number, px: number, y: number, pz: number, nx: number, nz: number, off = 0, out = 0): void {
    const horizontal = nz !== 0;
    const w = horizontal ? along : depth;
    const d = horizontal ? depth : along;
    const cx = px + (horizontal ? off : 0) + nx * (out + depth / 2);
    const cz = pz + (horizontal ? 0 : off) + nz * (out + depth / 2);
    this.batch.box(mat, w, h, d, cx, y, cz, { tile: 1 });
  }

  /** Лампа: реальный свет попадает в пул, а плафон — видимая геометрия. */
  lamp(o: LampOpts): void {
    const def: LightDef = {
      x: o.x,
      y: o.y ?? this.H - 0.6,
      z: o.z,
      color: o.color ?? 0xdfe8d0,
      intensity: o.intensity,
      distance: o.distance,
      mode: o.mode ?? 'steady',
    };
    const kind = o.kind ?? 'tube';
    if (kind === 'tube') {
      const w = o.alongZ ? 0.25 : 1.2;
      const d = o.alongZ ? 1.2 : 0.25;
      if (def.mode === 'fluoro' || def.mode === 'broken') {
        // мерцающий плафон — отдельный меш с собственным материалом
        const material = new THREE.MeshBasicMaterial({ color: def.color });
        const mesh = new THREE.Mesh(boxGeometry(w, 0.06, d, 1), material);
        mesh.position.set(o.x, this.H - 0.03, o.z);
        this.group.add(mesh);
        def.fixture = material;
      } else {
        this.batch.box('lampOn', w, 0.06, d, o.x, this.H - 0.03, o.z);
      }
    } else if (kind === 'em') {
      this.batch.box('emRed', 0.3, 0.1, 0.16, o.x, this.H - 0.06, o.z);
    }
    this.lights.push(def);
  }

  /** Погасший плафон. */
  deadLamp(x: number, z: number, alongZ = false): void {
    this.batch.box('lampOff', alongZ ? 0.25 : 1.2, 0.06, alongZ ? 1.2 : 0.25, x, this.H - 0.03, z);
    // свисающий провод
    this.batch.box('cable', 0.02, 0.35, 0.02, x + 0.4, this.H - 0.22, z, { tile: 1 });
  }
}
