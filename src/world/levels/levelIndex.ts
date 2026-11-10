import { CONFIG } from '../../core/config';
import type { Level } from './Level';

/**
 * Индекс уровня по высоте игрока: ближайший этаж к позиции Y.
 * Нельзя использовать round(y / height): у подземных уровней отрицательные индексы
 * обрезались бы к нулю, и коллизии брались бы от наземного этажа.
 */
export function levelIndexAt(levels: readonly Level[], y: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < levels.length; i += 1) {
    const d = Math.abs(levels[i].baseY - y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/** Допуск «на этаже»: половина высоты этажа. */
export const LEVEL_SNAP = CONFIG.world.height / 2;
