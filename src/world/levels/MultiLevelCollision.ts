import { CONFIG } from '../../core/config';
import type { CollisionQuery } from '../../core/types';
import type { Level } from './Level';

/**
 * Коллизии всего комплекса: выбирает уровень по высоте игрока и делегирует его сетке.
 * Сами проверки остаются 2D (по x/z) — высота нужна только для выбора активного этажа.
 */
export class MultiLevelCollision implements CollisionQuery {
  private readonly floorHeight = CONFIG.world.height;

  constructor(
    private readonly levels: Level[],
    private readonly getY: () => number,
  ) {}

  private levelAt(y: number): Level {
    const idx = Math.max(0, Math.min(this.levels.length - 1, Math.round(y / this.floorHeight)));
    return this.levels[idx];
  }

  isBlocked(x: number, z: number, r: number): boolean {
    return this.levelAt(this.getY()).collision.isBlocked(x, z, r);
  }
}
