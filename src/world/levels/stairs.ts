import { CONFIG } from '../../core/config';

/**
 * Лестничная шахта комплекса — одна, одинаковые координаты на ВСЕХ уровнях,
 * поэтому марш совпадает по вертикали и навигация предсказуема.
 *
 * Марш занимает восточную половину ниши (x 45–47) и всегда поднимается к северу,
 * вдоль западной стены остаётся проход 1 м:
 *
 *   подошёл по проходу к южному концу (низ марша) — переход вверх;
 *   подошёл по проходу к северному концу (проём в перекрытии) — вниз.
 *
 * Отдельные «лестница вверх» и «лестница вниз» не нужны: направление определяется
 * тем, к какому концу марша игрок подошёл.
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

/** Единственная лестничная ниша. */
export const STAIR_NICHE_NORTH: StairRect = { x: 45, z: 12, w: 2, d: 4 };
/** Центр ниши. */
export const NICHE_NORTH_CENTER = { x: 46, z: 14 };

/** Число подступенков в марше. */
export const STAIR_STEPS = 10;
/** Высота подступенка, м: 10 × 0,32 = 3,2 — ровно высота этажа. */
export const STAIR_RISE = CONFIG.world.height / STAIR_STEPS;
/** Глубина проступи, м. */
export const STAIR_TREAD = 0.24;
/** Пролёт марша по z (между центрами крайних ступеней), м. */
export const STAIR_RUN = (STAIR_STEPS - 1) * STAIR_TREAD;
/** Смещение центра верхней ступени от северного края ниши, м. */
export const STAIR_TOP_Z = 1.5;
/**
 * Ширина марша, м: ровно восточная половина ниши (x 46..47).
 * Совпадает с клеткой проёма в перекрытии, поэтому у марша нет «карманов»:
 * коллизия, ступени и дыра в потолке описывают один и тот же объём.
 */
export const STAIR_FLIGHT_WIDTH = 1.0;
/** Глубина зоны активации у каждого конца марша, м. */
export const STAIR_ZONE_DEPTH = 1.2;
/** Толщина марша под проступью (открытый низ), м. */
export const STAIR_WAIST = 0.24;

/** Центр верхней (последней) ступени марша по z. */
export function stairTopZ(n: StairRect): number {
  return n.z + STAIR_TOP_Z;
}

/** Центр нижней (первой) ступени марша по z. */
export function stairBottomZ(n: StairRect): number {
  return n.z + STAIR_TOP_Z + STAIR_RUN;
}

/** Центр марша по x: восточная половина ниши. */
export function stairFlightX(n: StairRect): number {
  return n.x + n.w * 0.75;
}

/**
 * Габарит марша в плане — единственная коллизия лестницы.
 * Движок строго 2D (по x/z), высота не учитывается, поэтому марш описывается
 * одной коробкой: игрок не проходит сквозь ступени и не попадает в проём.
 *
 * По X коробка совпадает с видимыми ступенями (stairFlightX ± STAIR_FLIGHT_WIDTH/2),
 * а не с половиной ниши: прежний запас 0.3 м с запада создавал невидимый барьер
 * прямо в проходе, а с востока коллизия уходила в бетон стены.
 */
export function stairFlightFootprint(n: StairRect): { x: number; z: number; w: number; d: number } {
  // По Z коробка начинается у северного края ниши: она обязана полностью накрывать
  // клетки проёма (иначе игрок встанет над дырой) и не оставлять «карман»
  // за верхней ступенью. Нижняя кромка — передняя грань нижней ступени.
  const z0 = n.z;
  const z1 = stairBottomZ(n) + STAIR_TREAD / 2;
  return {
    x: stairFlightX(n),
    z: (z0 + z1) / 2,
    w: STAIR_FLIGHT_WIDTH,
    d: z1 - z0,
  };
}

/**
 * Клетки перекрытия над маршем: пол и потолок не строятся, и лестница
 * на каждом уровне уходит в настоящий сквозной проём.
 *
 * Проём — две клетки вдоль марша (1×2 м): верхняя половина марша вместе
 * с поручнем проходит сквозь перекрытие, нижние ступени остаются на полу.
 * Одной клетки мало — поручень упирался бы в потолок за краем проёма.
 */
export const STAIR_OPENINGS: StairRect[] = [STAIR_NICHE_NORTH].map((n) => ({
  x: n.x + n.w / 2,
  z: n.z + Math.floor(STAIR_TOP_Z),
  w: n.w / 2,
  d: 2,
}));

/** Лежит ли клетка сетки в проёме лестничной шахты. */
export function isStairOpening(i: number, j: number): boolean {
  return STAIR_OPENINGS.some((r) => i >= r.x && i < r.x + r.w && j >= r.z && j < r.z + r.d);
}

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

/** Зона активации у конца марша: dir = +1 — южный (низ, вверх), −1 — северный (верх, вниз). */
export function stairZone(n: StairRect, dir: 1 | -1): StairRect {
  return {
    x: n.x,
    z: dir === 1 ? n.z + n.d - STAIR_ZONE_DEPTH : n.z,
    w: n.w / 2, // только проход: марш не задеваем
    d: STAIR_ZONE_DEPTH,
  };
}

/** Точка приземления: середина прохода, между зонами активации. */
export function stairLanding(n: StairRect): { x: number; z: number } {
  return { x: n.x + n.w * 0.25, z: n.z + n.d / 2 };
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
