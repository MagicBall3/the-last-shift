import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { Interactable } from '../interactions/Interactable';

/** Игровой мир. Сейчас — пустая комната и один ящик для проверки взаимодействий. */
export class World {
  readonly group = new THREE.Group();
  /** Коллизии в мировых координатах (AABB), используются Player. */
  readonly colliders: THREE.Box3[] = [];
  readonly interactables: Interactable[] = [];
  readonly spawn = new THREE.Vector3(0, 0, CONFIG.world.roomDepth / 2 - 1.5);
  readonly spawnYaw = 0;

  constructor() {
    const { roomWidth: w, roomDepth: d, roomHeight: h, wallThickness: t } = CONFIG.world;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a9088, roughness: 0.95 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x5a5f58, roughness: 0.9 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x6a6f68, roughness: 1 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x7a5c3a, roughness: 0.8 });

    const solid: THREE.Mesh[] = [];
    this.box(w, 0.1, d, 0, -0.05, 0, floorMat);
    this.box(w, 0.1, d, 0, h + 0.05, 0, ceilingMat);
    solid.push(this.box(w + t * 2, h, t, 0, h / 2, -(d / 2 + t / 2), wallMat));
    solid.push(this.box(w + t * 2, h, t, 0, h / 2, d / 2 + t / 2, wallMat));
    solid.push(this.box(t, h, d, -(w / 2 + t / 2), h / 2, 0, wallMat));
    solid.push(this.box(t, h, d, w / 2 + t / 2, h / 2, 0, wallMat));

    const crate = this.box(0.8, 0.8, 0.8, 0.8, 0.4, -2.2, crateMat);
    solid.push(crate);
    this.interactables.push({
      object: crate,
      prompt: 'Осмотреть ящик',
      onInteract: () => 'Ящик пуст.',
    });

    this.group.updateMatrixWorld(true);
    for (const mesh of solid) this.colliders.push(new THREE.Box3().setFromObject(mesh));
  }

  private box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    return mesh;
  }
}
