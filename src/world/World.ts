import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { GameModule } from '../core/types';
import type { Interactable } from '../interactions/Interactable';
import type { LightDef } from '../lighting/LightDef';
import { BuildContext } from './context';
import { Door } from './Door';
import { Grid } from './grid';
import { DOORS, EXTRA_LABELS, LOCKED_DOORS, SPAWN } from './layout';
import { buildProps } from './props';
import { buildShell } from './shell';
import { SignAtlas } from './signs';
import { StaticBatch } from './StaticBatch';
import { buildDoorFrames, buildLockedDoors } from './structures';
import { LevelCollision } from './Collision';
import { createMaterials, createTextures, makeRng } from './textures';

/**
 * Подземный исследовательский комплекс. Единое здание: пол, потолок и стены строятся из одной сетки,
 * детали склеиваются по материалам (несколько десятков вызовов отрисовки на всё здание).
 */
export class World implements GameModule {
  readonly group = new THREE.Group();
  readonly interactables: Interactable[] = [];
  readonly lights: LightDef[] = [];
  readonly collision: LevelCollision;
  readonly spawn = new THREE.Vector3(SPAWN.x, 0, SPAWN.z);
  readonly spawnYaw = SPAWN.yaw;

  private readonly doors: Door[] = [];
  private playerPosition = new THREE.Vector3(SPAWN.x, 0, SPAWN.z);

  constructor() {
    const grid = new Grid();
    const materials = createMaterials(createTextures(CONFIG.world.seed));
    const labels = [
      ...DOORS.flatMap((d) => d.labels),
      ...LOCKED_DOORS.map((d) => d.label),
      ...EXTRA_LABELS,
    ];
    const signs = new SignAtlas(labels);
    materials.sign = new THREE.MeshBasicMaterial({ map: signs.texture, color: 0xc4c4bc });

    const batch = new StaticBatch();
    const boxes: THREE.Box3[] = [];
    const runs = buildShell(grid, batch);
    const rnd = makeRng(CONFIG.world.seed + 1);
    const ctx = new BuildContext(grid, batch, rnd, boxes, this.lights, signs, this.interactables, this.group, runs);

    buildDoorFrames(ctx);
    buildLockedDoors(ctx);
    buildProps(ctx);

    for (const def of DOORS) {
      const collider = new THREE.Box3();
      boxes.push(collider);
      const door = new Door(def, materials.doorMetal, collider, () => this.playerPosition);
      this.doors.push(door);
      this.group.add(door.pivot);
      this.interactables.push(door);
    }

    batch.build(materials, this.group);
    this.collision = new LevelCollision(grid, boxes);
    this.group.updateMatrixWorld(true);
  }

  /** Двери должны знать, где игрок (чтобы не закрыться на нём и открыться от него). */
  attachPlayer(position: THREE.Vector3): void {
    this.playerPosition = position;
  }

  update(dt: number): void {
    for (const door of this.doors) door.update(dt);
  }

  dispose(): void {}
}
