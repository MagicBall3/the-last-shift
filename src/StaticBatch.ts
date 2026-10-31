import * as THREE from 'three';

export interface PlaceOpts {
  /** Метров на одно повторение текстуры */
  tile?: number;
  /** Поворот по Эйлеру (рад) */
  rot?: [number, number, number];
}

/** Добавляет атрибут color (белый), чтобы все геометрии одного материала имели одинаковый набор атрибутов. */
export function withColor(g: THREE.BufferGeometry, v = 1): THREE.BufferGeometry {
  const n = g.attributes.position.count;
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(v), 3));
  return g;
}

/** Параллелепипед с UV в метрах: текстура не растягивается на длинных стенах. */
export function boxGeometry(w: number, h: number, d: number, tile: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const faces: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  faces.forEach(([fu, fv], f) => {
    for (let k = 0; k < 4; k += 1) {
      const i = f * 4 + k;
      uv.setXY(i, (uv.getX(i) * fu) / tile, (uv.getY(i) * fv) / tile);
    }
  });
  uv.needsUpdate = true;
  return withColor(g);
}

function merge(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let vCount = 0;
  let iCount = 0;
  for (const g of geos) {
    vCount += g.attributes.position.count;
    iCount += g.index ? g.index.count : g.attributes.position.count;
  }
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const uv = new Float32Array(vCount * 2);
  const col = new Float32Array(vCount * 3);
  const idx = new Uint32Array(iCount);
  let v = 0;
  let i = 0;
  for (const g of geos) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array as ArrayLike<number>, v * 3);
    nor.set(g.attributes.normal.array as ArrayLike<number>, v * 3);
    uv.set(g.attributes.uv.array as ArrayLike<number>, v * 2);
    col.set(g.attributes.color.array as ArrayLike<number>, v * 3);
    if (g.index) {
      for (let k = 0; k < g.index.count; k += 1) idx[i + k] = g.index.getX(k) + v;
      i += g.index.count;
    } else {
      for (let k = 0; k < n; k += 1) idx[i + k] = v + k;
      i += n;
    }
    v += n;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

/**
 * Собирает статические детали по материалам и склеивает в один меш на материал.
 * Сотни коробок и труб = единицы вызовов отрисовки.
 */
export class StaticBatch {
  private readonly buckets = new Map<string, THREE.BufferGeometry[]>();
  private readonly matrix = new THREE.Matrix4();
  private readonly quat = new THREE.Quaternion();
  private readonly euler = new THREE.Euler();
  private readonly one = new THREE.Vector3(1, 1, 1);

  /** Добавляет уже расположенную в мире геометрию (с атрибутами position, normal, uv, color). */
  addRaw(key: string, geo: THREE.BufferGeometry): void {
    const list = this.buckets.get(key);
    if (list) list.push(geo);
    else this.buckets.set(key, [geo]);
  }

  private place(key: string, geo: THREE.BufferGeometry, x: number, y: number, z: number, rot?: [number, number, number]): void {
    if (rot) this.euler.set(rot[0], rot[1], rot[2]);
    else this.euler.set(0, 0, 0);
    this.quat.setFromEuler(this.euler);
    this.matrix.compose(new THREE.Vector3(x, y, z), this.quat, this.one);
    geo.applyMatrix4(this.matrix);
    this.addRaw(key, geo);
  }

  /** Коробка с центром в (x, y, z). */
  box(key: string, w: number, h: number, d: number, x: number, y: number, z: number, opts: PlaceOpts = {}): void {
    this.place(key, boxGeometry(w, h, d, opts.tile ?? 1.5), x, y, z, opts.rot);
  }

  /** Цилиндр (труба, бочка) вдоль оси. */
  cyl(key: string, radius: number, length: number, axis: 'x' | 'y' | 'z', x: number, y: number, z: number, segments = 8): void {
    const g = new THREE.CylinderGeometry(radius, radius, length, segments, 1);
    if (axis === 'x') g.rotateZ(Math.PI / 2);
    else if (axis === 'z') g.rotateX(Math.PI / 2);
    this.place(key, withColor(g), x, y, z);
  }

  build(materials: Record<string, THREE.Material>, parent: THREE.Object3D): void {
    for (const [key, geos] of this.buckets) {
      const material = materials[key];
      if (!material) throw new Error(`Нет материала «${key}»`);
      const mesh = new THREE.Mesh(merge(geos), material);
      mesh.name = `static:${key}`;
      mesh.matrixAutoUpdate = false;
      parent.add(mesh);
    }
    this.buckets.clear();
  }
}
