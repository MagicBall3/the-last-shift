import type { DoorDef, ZoneId } from '../layout';
import type { GridData, ZoneDef } from '../grid';
import { STAIR_NICHE_NORTH } from './stairs';

/**
 * Верхние этажи главного корпуса (этажи 2–4) — та же сетка и тот же контур
 * циркуляции, что у наземного этажа: главный коридор z 18–20, служебный
 * коридор x 43–44, лестничная ниша x 45–46. Комнаты — севернее (z 8–16)
 * и южнее (z 22–30) коридора. Южная ниша заделана бетоном на всех этажах.
 */
export const FLOOR_W = 48;
export const FLOOR_D = 46;

interface RoomSpec {
  id: ZoneId;
  rects: { x: number; z: number; w: number; d: number }[];
}

/** Общий каркас этажа: коридор, служебные проходы, лестничные ниши. */
function floorSkeleton(): ZoneDef[] {
  return [
    { id: 'corridor', rects: [{ x: 9, z: 18, w: 38, d: 3 }] },
    {
      id: 'service',
      rects: [
        { x: 43, z: 12, w: 2, d: 6 },
        { x: 43, z: 21, w: 2, d: 8 },
        // Единственная лестничная ниша; южная заделана наглухо.
        STAIR_NICHE_NORTH,
        { x: 47, z: 12, w: 1, d: 4 }, // проход к лестнице с востока: убрана стена перед подъёмом
      ],
    },
  ];
}

function officeFloor(north: RoomSpec[], south: RoomSpec[], labels: [string, string]): GridData {
  const zones: ZoneDef[] = [...floorSkeleton(), ...north, ...south];
  const doors: DoorDef[] = [];
  for (const g of north) {
    for (const r of g.rects) {
      doors.push({ x: Math.floor(r.x + r.w / 2), z: 17, axis: 'z', labels, open: true });
    }
  }
  for (const g of south) {
    for (const r of g.rects) {
      doors.push({ x: Math.floor(r.x + r.w / 2), z: 21, axis: 'z', labels, open: true });
    }
  }
  return { width: FLOOR_W, depth: FLOOR_D, zones, doors };
}

/** Этаж 2 — административные офисы, серверная, комната персонала. */
export function floor2GridData(): GridData {
  return officeFloor(
    [
      { id: 'office', rects: [{ x: 9, z: 8, w: 10, d: 9 }] },
      { id: 'office', rects: [{ x: 20, z: 8, w: 10, d: 9 }] },
      { id: 'server', rects: [{ x: 31, z: 8, w: 10, d: 9 }] },
    ],
    [
      { id: 'office', rects: [{ x: 9, z: 22, w: 10, d: 9 }] },
      { id: 'office', rects: [{ x: 20, z: 22, w: 10, d: 9 }] },
      { id: 'staff', rects: [{ x: 31, z: 22, w: 10, d: 9 }] },
    ],
    ['КАБИНЕТ', 'КОРИДОР'],
  );
}

/** Этаж 3 — отдел аналитики, научные кабинеты, обработка данных. */
export function floor3GridData(): GridData {
  return officeFloor(
    [
      { id: 'office', rects: [{ x: 9, z: 8, w: 10, d: 9 }] },
      { id: 'lab', rects: [{ x: 20, z: 8, w: 10, d: 9 }] },
      { id: 'office', rects: [{ x: 31, z: 8, w: 10, d: 9 }] },
    ],
    [
      { id: 'lab', rects: [{ x: 9, z: 22, w: 10, d: 9 }] },
      { id: 'office', rects: [{ x: 20, z: 22, w: 10, d: 9 }] },
      { id: 'server', rects: [{ x: 31, z: 22, w: 10, d: 9 }] },
    ],
    ['РАБОЧАЯ ЗОНА', 'КОРИДОР'],
  );
}

/** Этаж 4 — руководство, центр наблюдения, ограниченные зоны. */
export function floor4GridData(): GridData {
  return officeFloor(
    [
      { id: 'office', rects: [{ x: 9, z: 8, w: 10, d: 9 }] },
      { id: 'security', rects: [{ x: 20, z: 8, w: 10, d: 9 }] },
      { id: 'office', rects: [{ x: 31, z: 8, w: 10, d: 9 }] },
    ],
    [
      { id: 'office', rects: [{ x: 9, z: 22, w: 10, d: 9 }] },
      { id: 'tech', rects: [{ x: 20, z: 22, w: 10, d: 9 }] },
      { id: 'storage', rects: [{ x: 31, z: 22, w: 10, d: 9 }] },
    ],
    ['КАБИНЕТ РУКОВОДСТВА', 'КОРИДОР'],
  );
}
