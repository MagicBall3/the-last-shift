import * as THREE from 'three';
import { audio } from '../audio/AudioManager';
import { CONFIG } from '../core/config';
import type { Interactable } from '../interactions/Interactable';
import type { DoorDef } from './layout';
import { boxGeometry } from './StaticBatch';

const OPEN_ANGLE = 1.9;
const SPEED = 3.2;
const LEAF_W = 0.92;
const LEAF_H = 2.15;

/** Открывающаяся дверь: петля на краю проёма, плавный поворот, коллизия пропадает при открытии. */
export class Door implements Interactable {
  readonly object: THREE.Mesh;
  readonly pivot = new THREE.Group();
  private open: boolean;
  private angle = 0;
  private target = 0;
  private readonly baseRotation: number;
  private readonly closedBox: THREE.Box3;
  private readonly cell: THREE.Box3;

  constructor(
    private readonly def: DoorDef,
    material: THREE.Material,
    /** Коробка коллизии двери (общая с LevelCollision): пустая = проход свободен */
    private readonly collider: THREE.Box3,
    private readonly playerPosition: () => THREE.Vector3,
  ) {
    const { x, z, axis } = def;
    this.baseRotation = axis === 'z' ? 0 : -Math.PI / 2;
    this.pivot.position.set(axis === 'z' ? x + 0.04 : x + 0.5, 0, axis === 'z' ? z + 0.5 : z + 0.04);
    this.pivot.rotation.y = this.baseRotation;

    this.object = new THREE.Mesh(boxGeometry(LEAF_W, LEAF_H, 0.07, 1.5), material);
    this.object.position.set(LEAF_W / 2, LEAF_H / 2 + 0.02, 0);
    this.pivot.add(this.object);

    this.closedBox = new THREE.Box3(
      new THREE.Vector3(x, 0, z),
      new THREE.Vector3(x + 1, CONFIG.world.height, z + 1),
    );
    this.cell = this.closedBox.clone();
    this.open = def.open === true;
    if (this.open) {
      this.angle = this.target = this.openDirection(null) * OPEN_ANGLE;
      this.collider.makeEmpty();
    } else {
      this.collider.copy(this.closedBox);
    }
    this.pivot.rotation.y = this.baseRotation + this.angle;
  }

  get prompt(): string {
    return this.open ? 'Закрыть дверь' : 'Открыть дверь';
  }

  onInteract(): string | void {
    if (this.open) {
      const p = this.playerPosition();
      const r = CONFIG.player.radius + 0.1;
      if (p.x > this.cell.min.x - r && p.x < this.cell.max.x + r && p.z > this.cell.min.z - r && p.z < this.cell.max.z + r) {
        return 'Что-то мешает закрыть дверь.';
      }
      this.open = false;
      this.target = 0;
      this.collider.copy(this.closedBox);
    } else {
      this.open = true;
      this.target = this.openDirection(this.playerPosition()) * OPEN_ANGLE;
      this.collider.makeEmpty();
    }
    audio.playDoor();
  }

  update(dt: number): void {
    if (this.angle === this.target) return;
    const step = SPEED * dt;
    this.angle += Math.max(-step, Math.min(step, this.target - this.angle));
    this.pivot.rotation.y = this.baseRotation + this.angle;
  }

  /** Знак поворота: дверь распахивается от игрока. */
  private openDirection(player: THREE.Vector3 | null): number {
    const { x, z, axis } = this.def;
    if (axis === 'z') {
      const fromNorth = player ? player.z < z + 0.5 : true;
      return fromNorth ? -1 : 1;
    }
    const fromWest = player ? player.x < x + 0.5 : true;
    return fromWest ? 1 : -1;
  }
}
