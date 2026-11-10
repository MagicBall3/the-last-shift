/**
 * Лестничные ядра комплекса — одинаковые координаты на ВСЕХ уровнях,
 * поэтому лестницы совпадают по вертикали и навигация предсказуема.
 *
 * Две отдельные ниши-тупика восточнее служебного коридора (x 45–46):
 *   северная (z 12–15) — подъём на этаж выше;
 *   южная   (z 21–24) — спуск на уровень ниже.
 *
 * Индексы уровней в World: 0 — наземный этаж, 1–3 — этажи 2–4,
 * 4–6 — подземные уровни −1…−3. Поэтому «вверх» и «вниз» — не просто ±1:
 * с наземного этажа спуск ведёт сразу на уровень −1 (индекс 4).
 */
export interface StairRect {
  x: number;
  z: number;
  w: number;
  d: number;
}

/** Ниша подъёма (северная). */
export const STAIR_UP_NICHE: StairRect = { x: 45, z: 12, w: 2, d: 4 };
/** Ниша спуска (южная). */
export const STAIR_DOWN_NICHE: StairRect = { x: 45, z: 21, w: 2, d: 4 };

/** Центр северной ниши — точка приземления после подъёма. */
export const NICHE_UP_CENTER = { x: 46, z: 14 };
/** Центр южной ниши — точка приземления после спуска. */
export const NICHE_DOWN_CENTER = { x: 46, z: 23 };

/** Индекс наземного этажа и первого подземного уровня. */
export const GROUND_LEVEL = 0;
export const FIRST_UNDERGROUND = 4;
/** Индекс самого верхнего наземного этажа и самого нижнего подземного уровня. */
export const TOP_FLOOR = 3;
export const BOTTOM_LEVEL = 6;

/** Длительность перехода по лестнице, сек. */
export const STAIR_DURATION = 1.8;

/** Внутри ли точка прямоугольника. */
export function insideRect(r: StairRect, x: number, z: number): boolean {
  return x >= r.x && x <= r.x + r.w && z >= r.z && z <= r.z + r.d;
}

/**
 * Куда ведёт лестница с уровня `index`: dir = +1 — вверх, −1 — вниз.
 * Возвращает индекс целевого уровня или null, если дальше идти некуда.
 */
export function stairTarget(index: number, dir: 1 | -1): number | null {
  if (index <= TOP_FLOOR) {
    // Наземная часть: вверх — следующий этаж, вниз — подземный уровень.
    if (dir === 1) return index < TOP_FLOOR ? index + 1 : null;
    return index === GROUND_LEVEL ? FIRST_UNDERGROUND : index - 1;
  }
  // Подземная часть: вверх — к поверхности, вниз — глубже.
  if (dir === 1) return index === FIRST_UNDERGROUND ? GROUND_LEVEL : index - 1;
  return index < BOTTOM_LEVEL ? index + 1 : null;
}
