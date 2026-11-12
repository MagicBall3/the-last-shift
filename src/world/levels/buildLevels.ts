import { CONFIG } from '../../core/config';
import type { Rect, ZoneId } from '../layout';
import { EXTRA_LABELS, LOCKED_DOORS, SPAWN } from '../layout';
import { defaultGridData, type GridData } from '../grid';
import { buildProps } from '../props';
import { Level } from './Level';
import { exteriorDoors, exteriorGridData, exteriorZones } from './layout-exterior';
import { floor2GridData, floor3GridData, floor4GridData } from './layouts-upper';
import { underground1GridData, underground2GridData, underground3GridData } from './layouts-underground';
import { buildExteriorProps } from './props-exterior';
import { buildStairShaft } from './props-stairs';
import { buildOfficeFloorProps } from './props-upper';
import { buildContainmentProps, buildLabProps, buildServerArchiveProps } from './props-underground';

/** Все прямоугольники зоны указанного типа на уровне. */
function rectsOf(data: GridData, id: ZoneId): Rect[] {
  return data.zones.filter((z) => z.id === id).flatMap((z) => z.rects);
}

/** Таблички, которые использует лестничное ядро на каждом уровне. */
const STAIR_LABELS = ['ВЫХОД', 'ЛЕСТНИЦА', 'ВВЕРХ', 'ВНИЗ'];

/**
 * Собирает все уровни комплекса NADIR в порядке индексов:
 * 0 — наземный этаж с внешней территорией, 1–3 — этажи 2–4,
 * 4–6 — подземные уровни −1…−3. Переходы между ними выполняет LevelTransitions.
 */
export function buildLevels(): Level[] {
  const H = CONFIG.world.height;
  const levels: Level[] = [];

  // ── 0: наземный этаж + внешняя территория ──
  const base = defaultGridData();
  const ext = exteriorGridData();
  levels.push(
    new Level({
      name: 'Этаж 1 — территория и главный корпус',
      data: {
        width: ext.width,
        depth: ext.depth,
        zones: [...base.zones, ...exteriorZones],
        doors: [...base.doors, ...exteriorDoors],
      },
      baseY: 0,
      lockedDoors: LOCKED_DOORS,
      extraLabels: [...EXTRA_LABELS, ...STAIR_LABELS, 'ТЕРРИТОРИЯ NADIR'],
      buildProps: (c) => {
        buildProps(c);
        buildStairShaft(c);
        buildExteriorProps(c);
      },
    }),
  );

  // ── 1: этаж 2 — администрация ──
  const f2 = floor2GridData();
  levels.push(
    new Level({
      name: 'Этаж 2 — администрация',
      data: f2,
      baseY: H,
      seedOffset: 10,
      extraLabels: STAIR_LABELS,
      buildProps: (c) => {
        buildOfficeFloorProps(c, rectsOf(f2, 'office'), rectsOf(f2, 'server'), rectsOf(f2, 'staff'), 'admin');
        buildStairShaft(c);
      },
    }),
  );

  // ── 2: этаж 3 — аналитика и наука ──
  const f3 = floor3GridData();
  levels.push(
    new Level({
      name: 'Этаж 3 — аналитика',
      data: f3,
      baseY: H * 2,
      seedOffset: 20,
      extraLabels: STAIR_LABELS,
      buildProps: (c) => {
        buildOfficeFloorProps(c, rectsOf(f3, 'office'), rectsOf(f3, 'server'), [], 'analysis');
        buildStairShaft(c);
      },
    }),
  );

  // ── 3: этаж 4 — руководство и наблюдение ──
  const f4 = floor4GridData();
  levels.push(
    new Level({
      name: 'Этаж 4 — руководство',
      data: f4,
      baseY: H * 3,
      seedOffset: 30,
      extraLabels: STAIR_LABELS,
      buildProps: (c) => {
        buildOfficeFloorProps(c, rectsOf(f4, 'office'), rectsOf(f4, 'server'), [], 'command');
        buildStairShaft(c);
      },
    }),
  );

  // ── 4: уровень −1 — экспериментальные лаборатории ──
  const u1 = underground1GridData();
  levels.push(
    new Level({
      name: 'Уровень −1 — лаборатории',
      data: u1,
      baseY: -H,
      seedOffset: 40,
      extraLabels: STAIR_LABELS,
      buildProps: (c) => {
        buildLabProps(c, rectsOf(u1, 'lab'), rectsOf(u1, 'server'));
        buildStairShaft(c);
      },
    }),
  );

  // ── 5: уровень −2 — изоляция и сектор капсулы ──
  const u2 = underground2GridData();
  levels.push(
    new Level({
      name: 'Уровень −2 — изоляция',
      data: u2,
      baseY: -H * 2,
      seedOffset: 50,
      extraLabels: STAIR_LABELS,
      buildProps: (c) => {
        buildContainmentProps(c, rectsOf(u2, 'isolation'), rectsOf(u2, 'tech'), rectsOf(u2, 'medical'));
        buildStairShaft(c);
      },
    }),
  );

  // ── 6: уровень −3 — серверные, архив, энергетика ──
  const u3 = underground3GridData();
  levels.push(
    new Level({
      name: 'Уровень −3 — серверные и архив',
      data: u3,
      baseY: -H * 3,
      seedOffset: 60,
      extraLabels: STAIR_LABELS,
      buildProps: (c) => {
        buildServerArchiveProps(
          c,
          rectsOf(u3, 'server'),
          rectsOf(u3, 'storage'),
          rectsOf(u3, 'office'),
          rectsOf(u3, 'electrical'),
          rectsOf(u3, 'tech'),
        );
        buildStairShaft(c);
      },
    }),
  );

  return levels;
}

/** Точка старта игрока на наземном уровне. */
export const SPAWN_POINT = { x: SPAWN.x, z: SPAWN.z, yaw: SPAWN.yaw };
