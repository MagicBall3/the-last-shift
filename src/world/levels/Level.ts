import * as THREE from 'three';
import { CONFIG } from '../../core/config';
import type { Interactable } from '../../interactions/Interactable';
import type { LightDef } from '../../lighting/LightDef';
import { BuildContext } from '../context';
import { Door } from '../Door';
import { Grid, type GridData } from '../grid';
import { LevelCollision } from '../Collision';
import type { LockedDoorDef } from '../layout';
import { buildShell } from '../shell';
import { SignAtlas } from '../signs';
import { StaticBatch } from '../StaticBatch';
import { buildDoorFrames, buildLockedDoors } from '../structures';
import { createMaterials, createTextures, makeRng } from '../textures';

export interface LevelOptions {
  /** Человекочитаемое имя уровня (для отладки). */
  name: string;
  data: GridData;
  /** Смещение группы по Y: низ этажа. */
  baseY: number;
  seedOffset?: number;
  extraLabels?: string[];
  lockedDoors?: LockedDoorDef[];
  buildProps?: (c: BuildContext) => void;
}

/**
 * Один этаж/уровень комплекса. Строится в локальных координатах (пол 0, потолок H)
 * и оборачивается в Group со смещением по Y — вся существующая логика (shell, props, свет)
 * работает без изменений. Коллизии остаются 2D (по x/z).
 */
export class Level {
  readonly name: string;
  readonly group = new THREE.Group();
  readonly interactables: Interactable[] = [];
  readonly lights: LightDef[] = [];
  readonly collision: LevelCollision;
  readonly grid: Grid;
  readonly baseY: number;

  private readonly doors: Door[] = [];
  private playerPosition = new THREE.Vector3(0, 0, 0);

  constructor(opts: LevelOptions) {
    this.name = opts.name;
    this.baseY = opts.baseY;
    this.grid = new Grid(opts.data);

    const materials = createMaterials(createTextures(CONFIG.world.seed + (opts.seedOffset ?? 0)));
    const labels = [
      ...opts.data.doors.flatMap((d) => d.labels),
      ...(opts.lockedDoors ?? []).map((d) => d.label),
      ...(opts.extraLabels ?? []),
    ];
    const signs = new SignAtlas(labels);
    materials.sign = new THREE.MeshBasicMaterial({ map: signs.texture, color: 0xc4c4bc });

    const batch = new StaticBatch();
    const boxes: THREE.Box3[] = [];
    const runs = buildShell(this.grid, batch);
    const rnd = makeRng(CONFIG.world.seed + 1 + (opts.seedOffset ?? 0));
    const ctx = new BuildContext(this.grid, batch, rnd, boxes, this.lights, signs, this.interactables, this.group, runs);

    buildDoorFrames(ctx, opts.data.doors);
    buildLockedDoors(ctx, opts.lockedDoors ?? []);
    if (opts.buildProps) opts.buildProps(ctx);

    for (const def of opts.data.doors) {
      const collider = new THREE.Box3();
      boxes.push(collider);
      const door = new Door(def, materials.doorMetal, collider, () => this.playerPosition);
      this.doors.push(door);
      this.group.add(door.pivot);
      this.interactables.push(door);
    }

    batch.build(materials, this.group);
    this.collision = new LevelCollision(this.grid, boxes);
    this.group.position.y = this.baseY;
    this.group.updateMatrixWorld(true);
  }

  /** Двери должны знать, где игрок (чтобы не закрыться на нём и открыться от него). */
  attachPlayer(position: THREE.Vector3): void {
    this.playerPosition = position;
  }

  update(dt: number): void {
    if (!this.group.visible) return;
    for (const door of this.doors) door.update(dt);
  }

  dispose(): void {}
}
