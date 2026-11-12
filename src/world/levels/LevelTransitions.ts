import * as THREE from 'three';
import type { GameEvents, GameModule } from '../../core/types';
import type { Player } from '../../player/Player';
import type { Level } from './Level';
import { levelIndexAt } from './levelIndex';
import {
  insideRect,
  STAIR_DURATION,
  STAIR_NICHE_NORTH,
  STAIR_NICHE_SOUTH,
  stairLanding,
  stairTarget,
  stairZone,
  type StairRect,
} from './stairs';

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Затемнение на перекрытии: 0 в начале и конце, 1 в середине пути. */
function fadeAt(k: number): number {
  return Math.min(1, Math.max(0, Math.sin(Math.PI * k) * 1.45));
}

interface ActiveTransition {
  start: THREE.Vector3;
  end: THREE.Vector3;
  /** Индекс целевого уровня (для сообщения игроку). */
  target: number;
  t: number;
  duration: number;
}

/**
 * Вертикальные переходы по лестничным нишам.
 *
 * Лестница одна и та же в обеих нишах: марш поднимается к северу, вдоль западной
 * стены — проход. Подход к южному концу (низ марша) ведёт вверх, к северному
 * (верх у проёма) — вниз. Поэтому направление определяется не нишей, а зоной,
 * в которую вошёл игрок.
 *
 * Переход срабатывает только при входе в зону; флаг «взведено» снимается до тех
 * пор, пока игрок не выйдет из обеих ниш, — повторного срабатывания при одном
 * подходе нет. Приземление — середина прохода на целевом уровне, между зонами.
 *
 * Камера проходит сквозь перекрытие, поэтому на середине пути экран затемняется.
 */
export class LevelTransitions implements GameModule {
  private active: ActiveTransition | null = null;
  private armed = true;
  private fade = 0;

  constructor(
    private readonly levels: Level[],
    private readonly player: Player,
    private readonly events?: Pick<GameEvents, 'onFade' | 'onMessage'>,
  ) {}

  update(dt: number): void {
    const p = this.player.position;

    if (this.active) {
      this.active.t += dt;
      const k = Math.min(1, this.active.t / this.active.duration);
      const e = easeInOut(k);
      p.x = this.active.start.x + (this.active.end.x - this.active.start.x) * e;
      p.z = this.active.start.z + (this.active.end.z - this.active.start.z) * e;
      p.y = this.active.start.y + (this.active.end.y - this.active.start.y) * e;
      this.setFade(fadeAt(k));
      if (k >= 1) {
        p.set(this.active.end.x, this.active.end.y, this.active.end.z);
        const target = this.active.target;
        this.active = null;
        this.player.transitioning = false;
        this.player.stopMotion();
        // Сбрасываем затемнение принудительно: иначе на экране остаётся
        // последняя маленькая доля черноты
        this.fade = 0;
        this.events?.onFade?.(0);
        this.events?.onMessage?.(this.levels[target].name);
      }
      return;
    }

    const niche = this.nicheAt(p.x, p.z);
    if (!niche) {
      this.armed = true;
      return;
    }

    const inUp = insideRect(stairZone(niche, 1), p.x, p.z);
    const inDown = insideRect(stairZone(niche, -1), p.x, p.z);
    // Середина ниши — нейтральная площадка между зонами
    if (!inUp && !inDown) return;
    if (!this.armed) return;

    const dir: 1 | -1 = inUp ? 1 : -1;
    const idx = levelIndexAt(this.levels, p.y);
    const targetIdx = stairTarget(idx, dir);
    // Верх/низ комплекса: переходить некуда — просто не срабатываем
    if (targetIdx === null || targetIdx < 0 || targetIdx >= this.levels.length) return;

    const target = this.levels[targetIdx];
    const landing = stairLanding(niche);
    this.active = {
      start: p.clone(),
      end: new THREE.Vector3(landing.x, target.baseY, landing.z),
      target: targetIdx,
      t: 0,
      duration: STAIR_DURATION,
    };
    this.armed = false;
    this.player.transitioning = true;
    this.player.stopMotion();
    this.fade = 0;
    this.events?.onFade?.(0);
  }

  private nicheAt(x: number, z: number): StairRect | null {
    if (insideRect(STAIR_NICHE_NORTH, x, z)) return STAIR_NICHE_NORTH;
    if (insideRect(STAIR_NICHE_SOUTH, x, z)) return STAIR_NICHE_SOUTH;
    return null;
  }

  private setFade(value: number): void {
    if (Math.abs(value - this.fade) < 0.005) return;
    this.fade = value;
    this.events?.onFade?.(value);
  }

  dispose(): void {
    this.events?.onFade?.(0);
  }
}
