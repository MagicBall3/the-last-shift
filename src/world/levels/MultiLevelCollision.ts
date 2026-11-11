import type { CollisionQuery } from '../../core/types';
import type { Level } from './Level';
import { levelIndexAt } from './levelIndex';

/**
 * Коллизии всего комплекса: выбирает уровень по высоте игрока и делегирует его сетке.
 * Сами проверки остаются 2D (по x/z) — высота нужна только для выбора активного этажа.
 *
 * Индекс уровня нельзя считать как round(y / height): у подземных уровней (baseY < 0)
 * это даёт отрицательные индексы, которые обрезаются к нулю, и коллизия берётся
 * от наземного этажа. Поэтому используется та же функция, что и для видимости.
 */
export class MultiLevelCollision implements CollisionQuery {
  constructor(
    private readonly levels: Level[],
    private readonly getY: () => number,
  ) {}

  private levelAt(y: number): Level {
    return this.levels[levelIndexAt(this.levels, y)];
  }

  isBlocked(x: number, z: number, r: number): boolean {
    return this.levelAt(this.getY()).collision.isBlocked(x, z, r);
  }
}
