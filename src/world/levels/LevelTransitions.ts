import * as THREE from 'three';
import type { GameEvents, GameModule } from '../../core/types';
import type { Player } from '../../player/Player';
import type { Level } from './Level';
import { levelIndexAt } from './levelIndex';
import {
  insideRect,
  NICHE_DOWN_CENTER,
  NICHE_UP_CENTER,
  STAIR_DOWN_NICHE,
  STAIR_DURATION,
  STAIR_UP_NICHE,
  stairTarget,
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
  t: number;
  duration: number;
}

/**
 * Вертикальные переходы по лестничным нишам.
 *
 * Переход срабатывает, когда игрок входит в нишу. Приземление — в центре той же ниши
 * на целевом уровне, поэтому нужен флаг «взведено»: пока игрок находится в нише,
 * новый переход невозможен; флаг снимается, только когда он выйдет из обеих ниш.
 *
 * Камера проходит сквозь перекрытие, поэтому на середине пути экран затемняется —
 * без этого лестница выглядела как телепорт через бетон.
 */
export class LevelTransitions implements GameModule {
  private active: ActiveTransition | null = null;
  private armed = true;
  private fade = 0;

  constructor(
    private readonly levels: Level[],
    private readonly player: Player,
    private readonly events?: Pick<GameEvents, 'onFade'>,
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
        this.active = null;
        this.player.transitioning = false;
        this.player.stopMotion();
        // Сбрасываем затемнение принудительно: иначе на экране остаётся
        // последняя маленькая доля черноты
        this.fade = 0;
        this.events?.onFade?.(0);
      }
      return;
    }

    const inUp = insideRect(STAIR_UP_NICHE, p.x, p.z);
    const inDown = insideRect(STAIR_DOWN_NICHE, p.x, p.z);
    if (!inUp && !inDown) {
      this.armed = true;
      return;
    }
    if (!this.armed) return;

    const idx = levelIndexAt(this.levels, p.y);
    const dir = inUp ? 1 : -1;
    const targetIdx = stairTarget(idx, dir);
    if (targetIdx === null || targetIdx < 0 || targetIdx >= this.levels.length) return;

    const target = this.levels[targetIdx];
    const landing = inUp ? NICHE_UP_CENTER : NICHE_DOWN_CENTER;
    this.active = {
      start: p.clone(),
      end: new THREE.Vector3(landing.x, target.baseY, landing.z),
      t: 0,
      duration: STAIR_DURATION,
    };
    this.armed = false;
    this.player.transitioning = true;
    this.player.stopMotion();
    this.fade = 0;
    this.events?.onFade?.(0);
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
