/**
 * Планировка комплекса: чистые данные, без Three.js.
 * Сетка 1×1 м: x — колонка, z — строка. Всё, что не вырезано, — сплошной бетон.
 * Стены строятся автоматически на границах «пол ↔ бетон», поэтому здание единое по построению.
 */
export const GRID_W = 48;
export const GRID_D = 37;

export type ZoneId = 'lobby' | 'corridor' | 'service' | 'security' | 'lab' | 'storage' | 'electrical';
export type CellZone = ZoneId | 'door';
export type Axis = 'x' | 'z';
export type Face = 'N' | 'S' | 'E' | 'W';

export interface Rect {
  x: number;
  z: number;
  w: number;
  d: number;
}

export const ZONES: { id: ZoneId; rects: Rect[] }[] = [
  { id: 'lobby', rects: [{ x: 2, z: 15, w: 7, d: 9 }] },
  // Главный коридор: 38 м с запада на восток
  { id: 'corridor', rects: [{ x: 9, z: 18, w: 38, d: 3 }] },
  {
    id: 'service',
    rects: [
      { x: 32, z: 11, w: 13, d: 2 }, // северный сервисный коридор
      { x: 43, z: 13, w: 2, d: 5 }, // спуск к главному коридору
      { x: 43, z: 21, w: 2, d: 8 }, // подъём от южного коридора
      { x: 23, z: 29, w: 22, d: 2 }, // южный сервисный коридор
      { x: 3, z: 25, w: 2, d: 10 }, // западный проход (вертикаль)
      { x: 5, z: 33, w: 4, d: 2 }, // западный проход (поворот к складу)
    ],
  },
  { id: 'security', rects: [{ x: 10, z: 10, w: 6, d: 7 }] },
  { id: 'lab', rects: [{ x: 18, z: 8, w: 13, d: 9 }] },
  { id: 'storage', rects: [{ x: 10, z: 22, w: 12, d: 12 }] },
  { id: 'electrical', rects: [{ x: 24, z: 22, w: 6, d: 6 }] },
];

/** Открывающиеся двери. axis — ось, вдоль которой идёт проход. labels: [что видит стоящий с меньшей стороны, с большей]. */
export interface DoorDef {
  x: number;
  z: number;
  axis: Axis;
  labels: [string, string];
  open?: boolean;
}

export const DOORS: DoorDef[] = [
  { x: 12, z: 17, axis: 'z', labels: ['ГЛАВНЫЙ КОРИДОР', 'КОМНАТА ОХРАНЫ'] },
  { x: 9, z: 15, axis: 'x', labels: ['КОМНАТА ОХРАНЫ', 'ВЕСТИБЮЛЬ'] },
  { x: 20, z: 17, axis: 'z', labels: ['ГЛАВНЫЙ КОРИДОР', 'ЛАБОРАТОРИЯ'] },
  { x: 28, z: 17, axis: 'z', labels: ['ГЛАВНЫЙ КОРИДОР', 'ЛАБОРАТОРИЯ'], open: true },
  { x: 31, z: 12, axis: 'x', labels: ['СЕРВИСНЫЙ КОРИДОР', 'ЛАБОРАТОРИЯ'] },
  { x: 13, z: 21, axis: 'z', labels: ['СКЛАД', 'ГЛАВНЫЙ КОРИДОР'] },
  { x: 26, z: 21, axis: 'z', labels: ['ЭЛЕКТРОЩИТОВАЯ', 'ГЛАВНЫЙ КОРИДОР'] },
  { x: 26, z: 28, axis: 'z', labels: ['СЕРВИСНЫЙ КОРИДОР', 'ЭЛЕКТРОЩИТОВАЯ'] },
  { x: 22, z: 30, axis: 'x', labels: ['СЕРВИСНЫЙ КОРИДОР', 'СКЛАД'], open: true },
  { x: 9, z: 33, axis: 'x', labels: ['СКЛАД', 'СЕРВИСНЫЙ КОРИДОР'] },
  { x: 4, z: 24, axis: 'z', labels: ['СЕРВИСНЫЙ КОРИДОР', 'ВЕСТИБЮЛЬ'] },
];

/**
 * Запертые двери — «закрытые помещения». (x, z) — клетка стены; face — куда она смотрит (в сторону пола).
 * За ними сплошной бетон: интерьеры можно открыть в следующих этапах.
 */
export interface LockedDoorDef {
  x: number;
  z: number;
  face: Face;
  label: string;
  message: string;
  kind?: 'door' | 'elevator' | 'blast';
}

export const LOCKED_DOORS: LockedDoorDef[] = [
  { x: 34, z: 17, face: 'S', label: 'Б-03', message: 'Заперто. Электронный замок мёртв.' },
  { x: 39, z: 17, face: 'S', label: 'АРХИВ', message: 'Заперто.' },
  { x: 34, z: 21, face: 'N', label: 'Б-07', message: 'Дверь не поддаётся.' },
  { x: 38, z: 21, face: 'N', label: 'ХРАНЕНИЕ', message: 'Замок оплавлен.' },
  { x: 36, z: 10, face: 'S', label: 'Б-11', message: 'Заперто.' },
  { x: 40, z: 10, face: 'S', label: 'КОМНАТА 5', message: 'Дверь заварена изнутри.' },
  { x: 36, z: 13, face: 'N', label: 'Б-12', message: 'Заперто. Индикатор не горит.' },
  { x: 30, z: 31, face: 'N', label: 'ШЛЮЗ 2', message: 'Герметичная дверь не отвечает.' },
  { x: 38, z: 31, face: 'N', label: 'Б-15', message: 'Заперто.' },
  { x: 17, z: 12, face: 'E', label: 'ЧИСТАЯ ЗОНА', message: 'Заперто. Карта доступа не найдена.' },
  { x: 10, z: 9, face: 'S', label: 'ПЕРСОНАЛ', message: 'Заперто.' },
  { x: 3, z: 35, face: 'N', label: 'ВЫХОД', message: 'Аварийный выход завален.' },
  { x: 1, z: 19, face: 'E', label: 'ЛИФТ', message: 'Лифт обесточен.', kind: 'elevator' },
  { x: 47, z: 19, face: 'W', label: 'ШЛЮЗ 1', message: 'Гермоворота заблокированы.', kind: 'blast' },
];

export const EXTRA_LABELS = ['ВЫСОКОЕ НАПРЯЖЕНИЕ', 'ОСТОРОЖНО'];

export const SPAWN = { x: 5.5, z: 19.5, yaw: -Math.PI / 2 };
