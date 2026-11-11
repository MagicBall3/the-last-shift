import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { GameModule } from '../core/types';
import type { Interactable } from '../interactions/Interactable';
import type { LightDef } from '../lighting/LightDef';
import { Level } from './levels/Level';
import { MultiLevelCollision } from './levels/MultiLevelCollision';
import { buildLevels, SPAWN_POINT } from './levels/buildLevels';
import { levelIndexAt } from './levels/levelIndex';

/**
 * Комплекс NADIR: несколько уровней (наземный этаж с внешней территорией, этажи 2–4,
 * подземные уровни) в одной сцене. Коллизии — многоуровневые: активный этаж
 * выбирается по высоте игрока.
 *
 * Оптимизация: видны только активный этаж и соседние, а лампы каждого этажа
 * помечены своим индексом — пул освещения берёт только лампы активного этажа.
 */
export class World implements GameModule {
  readonly group = new THREE.Group();
  readonly interactables: Interactable[] = [];
  /** Все лампы комплекса; у каждой заполнено поле level. */
  readonly lights: LightDef[] = [];
  readonly collision: MultiLevelCollision;
  readonly levels: Level[];
  readonly spawn = new THREE.Vector3(SPAWN_POINT.x, 0, SPAWN_POINT.z);
  readonly spawnYaw = SPAWN_POINT.yaw;

  private playerRef: THREE.Vector3 | null = null;
  private active = 0;

  constructor() {
    this.levels = buildLevels();
    for (let i = 0; i < this.levels.length; i += 1) {
      const lvl = this.levels[i];
      this.group.add(lvl.group);
      this.interactables.push(...lvl.interactables);
      for (const light of lvl.lights) {
        light.level = i;
        this.lights.push(light);
      }
    }
    this.collision = new MultiLevelCollision(this.levels, () => (this.playerRef ? this.playerRef.y : 0));
    this.applyVisibility(0);
  }

  /** Индекс этажа, на котором сейчас игрок. */
  get activeLevel(): number {
    return this.active;
  }

  /** Двери всех уровней должны знать, где игрок. */
  attachPlayer(position: THREE.Vector3): void {
    this.playerRef = position;
    for (const lvl of this.levels) lvl.attachPlayer(position);
  }

  /**
   * Видимость: держим в сцене активный этаж и соседние по высоте (чтобы лестницы
   * не «пропадали» на границе перехода), остальные скрываем.
   * Соседство считается по Y, а не по индексу: у подземных уровней индексы идут
   * после наземных, и «сосед по индексу» для −1 — это этаж 4 (+9.6 м над головой).
   */
  private applyVisibility(index: number): void {
    const { height } = CONFIG.world;
    const baseY = this.levels[index]?.baseY ?? 0;
    for (let i = 0; i < this.levels.length; i += 1) {
      this.levels[i].group.visible = Math.abs(this.levels[i].baseY - baseY) <= height * 1.5;
    }
  }

  update(dt: number): void {
    if (this.playerRef) {
      const idx = levelIndexAt(this.levels, this.playerRef.y);
      if (idx !== this.active) {
        this.active = idx;
        this.applyVisibility(idx);
      }
    }
    for (const lvl of this.levels) lvl.update(dt);
  }

  dispose(): void {
    for (const lvl of this.levels) lvl.dispose();
  }
}
