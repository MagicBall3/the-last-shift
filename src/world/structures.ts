import { DOORS, LOCKED_DOORS, type DoorDef, type Face, type LockedDoorDef } from './layout';
import type { BuildContext } from './context';

const FACE: Record<Face, { nx: number; nz: number }> = {
  N: { nx: 0, nz: -1 },
  S: { nx: 0, nz: 1 },
  E: { nx: 1, nz: 0 },
  W: { nx: -1, nz: 0 },
};

/** Точка на плоскости стены (центр клетки) и нормаль в сторону пола. */
export function faceFrame(d: LockedDoorDef): { px: number; pz: number; nx: number; nz: number } {
  const { nx, nz } = FACE[d.face];
  return {
    px: d.x + 0.5 + (nx > 0 ? 0.5 : nx < 0 ? -0.5 : 0),
    pz: d.z + 0.5 + (nz > 0 ? 0.5 : nz < 0 ? -0.5 : 0),
    nx,
    nz,
  };
}

/** Рамы, перемычки, пороги и указатели у открывающихся дверей. */
export function buildDoorFrames(c: BuildContext, defs: readonly DoorDef[] = DOORS): void {
  for (const d of defs) {
    const cx = d.x + 0.5;
    const cz = d.z + 0.5;
    if (d.axis === 'z') {
      c.detail('concrete', 1.0, 1.0, 0.3, cx, 2.7, cz);
      c.detail('metal', 0.07, 2.2, 0.34, d.x + 0.035, 1.1, cz);
      c.detail('metal', 0.07, 2.2, 0.34, d.x + 0.965, 1.1, cz);
      c.detail('hazard', 0.9, 0.006, 0.22, cx, 0.005, d.z - 0.13, { tile: 0.6 });
      c.detail('hazard', 0.9, 0.006, 0.22, cx, 0.005, d.z + 1.13, { tile: 0.6 });
      c.signs.add(c.batch, d.labels[0], cx, 2.72, cz - 0.155, 0, -1);
      c.signs.add(c.batch, d.labels[1], cx, 2.72, cz + 0.155, 0, 1);
    } else {
      c.detail('concrete', 0.3, 1.0, 1.0, cx, 2.7, cz);
      c.detail('metal', 0.34, 2.2, 0.07, cx, 1.1, d.z + 0.035);
      c.detail('metal', 0.34, 2.2, 0.07, cx, 1.1, d.z + 0.965);
      c.detail('hazard', 0.22, 0.006, 0.9, d.x - 0.13, 0.005, cz, { tile: 0.6 });
      c.detail('hazard', 0.22, 0.006, 0.9, d.x + 1.13, 0.005, cz, { tile: 0.6 });
      c.signs.add(c.batch, d.labels[0], cx - 0.155, 2.72, cz, -1, 0);
      c.signs.add(c.batch, d.labels[1], cx + 0.155, 2.72, cz, 1, 0);
    }
  }
}

/** Запертые двери на стенах: закрытые помещения. Интерьеров за ними пока нет. */
export function buildLockedDoors(c: BuildContext, defs: readonly LockedDoorDef[] = LOCKED_DOORS): void {
  for (const d of defs) {
    const { px, pz, nx, nz } = faceFrame(d);
    const kind = d.kind ?? 'door';
    if (kind === 'door') {
      c.wallBox('metal', 1.2, 2.3, 0.04, px, 1.15, pz, nx, nz);
      c.wallBox('doorMetal', 0.96, 2.15, 0.06, px, 1.08, pz, nx, nz, 0, 0.04);
      c.wallBox('ledRed', 0.06, 0.06, 0.02, px, 1.15, pz, nx, nz, 0.36, 0.1);
      c.wallBox('cabinet', 0.14, 0.2, 0.05, px, 1.2, pz, nx, nz, 0.62, 0.0);
      c.signs.add(c.batch, d.label, px + nx * 0.07, 2.6, pz + nz * 0.07, nx, nz);
      c.proxy(nz !== 0 ? 1.0 : 0.3, 2.2, nz !== 0 ? 0.3 : 1.0, px + nx * 0.1, 1.1, pz + nz * 0.1, 'Осмотреть дверь', d.message);
    } else if (kind === 'elevator') {
      c.wallBox('metal', 2.3, 2.5, 0.05, px, 1.25, pz, nx, nz);
      c.wallBox('doorMetal', 0.9, 2.2, 0.06, px, 1.1, pz, nx, nz, -0.47, 0.05);
      c.wallBox('doorMetal', 0.9, 2.2, 0.06, px, 1.1, pz, nx, nz, 0.47, 0.05);
      c.wallBox('cabinet', 0.14, 0.24, 0.05, px, 1.2, pz, nx, nz, 1.3, 0.0);
      c.wallBox('ledRed', 0.05, 0.05, 0.02, px, 1.3, pz, nx, nz, 1.3, 0.05);
      c.signs.add(c.batch, d.label, px + nx * 0.07, 2.72, pz + nz * 0.07, nx, nz);
      c.proxy(nz !== 0 ? 1.9 : 0.3, 2.2, nz !== 0 ? 0.3 : 1.9, px + nx * 0.1, 1.1, pz + nz * 0.1, 'Осмотреть лифт', d.message);
    } else {
      c.wallBox('metal', 3.0, 2.7, 0.05, px, 1.35, pz, nx, nz);
      c.wallBox('doorMetal', 2.7, 2.5, 0.08, px, 1.25, pz, nx, nz, 0, 0.05);
      c.wallBox('hazard', 2.7, 0.2, 0.09, px, 0.45, pz, nx, nz, 0, 0.05);
      c.wallBox('hazard', 2.7, 0.2, 0.09, px, 2.15, pz, nx, nz, 0, 0.05);
      c.wallBox('ledRed', 0.1, 0.1, 0.03, px, 1.3, pz, nx, nz, 1.2, 0.13);
      c.signs.add(c.batch, d.label, px + nx * 0.07, 2.92, pz + nz * 0.07, nx, nz, 1.0, 0.25);
      c.proxy(nz !== 0 ? 2.8 : 0.3, 2.6, nz !== 0 ? 0.3 : 2.8, px + nx * 0.12, 1.3, pz + nz * 0.12, 'Осмотреть гермоворота', d.message);
    }
  }
}
