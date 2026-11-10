import type { DoorDef, ZoneId } from '../layout';
import type { GridData, ZoneDef } from '../grid';
import { STAIR_DOWN_NICHE, STAIR_UP_NICHE } from './stairs';

/**
 * Подземные уровни NADIR (ниже главного здания). Своя, более широкая планировка:
 * главный коридор x 6–39, z 20–23; служебный коридор x 41–44 (z 10–29);
 * лестничные ниши x 45–46 — те же координаты, что на наземных этажах.
 */
export const UNDER_W = 48;
export const UNDER_D = 46;

interface UnderSpec {
  north: { id: ZoneId; rects: { x: number; z: number; w: number; d: number }[] }[];
  south: { id: ZoneId; rects: { x: number; z: number; w: number; d: number }[] }[];
  doorLabels: [string, string];
}

function underFloor(spec: UnderSpec): GridData {
  const zones: ZoneDef[] = [
    { id: 'corridor', rects: [{ x: 6, z: 20, w: 34, d: 4 }] },
    {
      id: 'service',
      rects: [
        { x: 41, z: 10, w: 4, d: 20 },
        STAIR_UP_NICHE,
        STAIR_DOWN_NICHE,
      ],
    },
    ...spec.north,
    ...spec.south,
  ];

  const doors: DoorDef[] = [];
  for (const g of spec.north) {
    for (const r of g.rects) {
      doors.push({ x: Math.floor(r.x + r.w / 2), z: 19, axis: 'z', labels: spec.doorLabels, open: true });
    }
  }
  for (const g of spec.south) {
    for (const r of g.rects) {
      doors.push({ x: Math.floor(r.x + r.w / 2), z: 24, axis: 'z', labels: spec.doorLabels, open: true });
    }
  }
  // Связь главного коридора со служебным
  doors.push({ x: 40, z: 22, axis: 'z', labels: ['СЕРВИСНЫЙ КОРИДОР', 'КОРИДОР'], open: true });
  return { width: UNDER_W, depth: UNDER_D, zones, doors };
}

/** Уровень −1 — экспериментальные лаборатории. */
export function underground1GridData(): GridData {
  return underFloor({
    north: [
      { id: 'lab', rects: [{ x: 6, z: 12, w: 10, d: 7 }] },
      { id: 'lab', rects: [{ x: 18, z: 12, w: 10, d: 7 }] },
      { id: 'lab', rects: [{ x: 30, z: 12, w: 8, d: 7 }] },
    ],
    south: [
      { id: 'lab', rects: [{ x: 6, z: 25, w: 10, d: 7 }] },
      { id: 'lab', rects: [{ x: 18, z: 25, w: 10, d: 7 }] },
      { id: 'server', rects: [{ x: 30, z: 25, w: 8, d: 7 }] },
    ],
    doorLabels: ['ЛАБОРАТОРИЯ', 'КОРИДОР'],
  });
}

/** Уровень −2 — изоляция, камеры содержания и сектор разбитой капсулы. */
export function underground2GridData(): GridData {
  return underFloor({
    north: [
      { id: 'isolation', rects: [
        { x: 6, z: 12, w: 6, d: 7 },
        { x: 14, z: 12, w: 6, d: 7 },
        { x: 22, z: 12, w: 6, d: 7 },
      ] },
      { id: 'tech', rects: [{ x: 30, z: 8, w: 8, d: 11 }] },
    ],
    south: [
      { id: 'isolation', rects: [
        { x: 6, z: 25, w: 6, d: 7 },
        { x: 14, z: 25, w: 6, d: 7 },
        { x: 22, z: 25, w: 6, d: 7 },
      ] },
      { id: 'medical', rects: [{ x: 30, z: 25, w: 8, d: 7 }] },
    ],
    doorLabels: ['ИЗОЛЯТОР', 'КОРИДОР'],
  });
}

/** Уровень −3 — серверные, архив исследований, энергетический сектор. */
export function underground3GridData(): GridData {
  return underFloor({
    north: [
      { id: 'server', rects: [{ x: 6, z: 12, w: 10, d: 7 }] },
      { id: 'server', rects: [{ x: 18, z: 12, w: 10, d: 7 }] },
      { id: 'electrical', rects: [{ x: 30, z: 12, w: 8, d: 7 }] },
    ],
    south: [
      { id: 'storage', rects: [{ x: 6, z: 25, w: 10, d: 7 }] },
      { id: 'office', rects: [{ x: 18, z: 25, w: 10, d: 7 }] },
      { id: 'tech', rects: [{ x: 30, z: 25, w: 8, d: 7 }] },
    ],
    doorLabels: ['ТЕХНИЧЕСКАЯ ЗОНА', 'КОРИДОР'],
  });
}
