import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { GameModule } from '../core/types';

/** Тусклый рассеянный свет и одна мерцающая люминесцентная лампа под потолком. */
export class Lighting implements GameModule {
  private readonly lamp: THREE.PointLight;
  private readonly lampMaterial: THREE.MeshBasicMaterial;
  private readonly baseColor = new THREE.Color(0xdfe8d0);
  private nextFlicker = 4;
  private flickerLeft = 0;

  constructor(scene: THREE.Scene) {
    const cfg = CONFIG.lighting;
    const h = CONFIG.world.roomHeight;

    scene.add(new THREE.HemisphereLight(0x6f8077, 0x0e100f, cfg.hemisphereIntensity));

    this.lamp = new THREE.PointLight(this.baseColor, cfg.lampIntensity, cfg.lampDistance, 2);
    this.lamp.position.set(0, h - 0.6, 0);
    scene.add(this.lamp);

    this.lampMaterial = new THREE.MeshBasicMaterial({ color: this.baseColor.clone() });
    const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.25), this.lampMaterial);
    fixture.position.set(0, h - 0.03, 0);
    scene.add(fixture);
  }

  update(dt: number, elapsed: number): void {
    let level = 0.97 + 0.03 * Math.sin(elapsed * 55);

    if (this.flickerLeft > 0) {
      this.flickerLeft -= dt;
      level = Math.random() < 0.5 ? 0.08 : 0.65;
    } else {
      this.nextFlicker -= dt;
      if (this.nextFlicker <= 0) {
        this.flickerLeft = 0.1 + Math.random() * 0.3;
        this.nextFlicker = 4 + Math.random() * 9;
      }
    }

    this.lamp.intensity = CONFIG.lighting.lampIntensity * level;
    this.lampMaterial.color.copy(this.baseColor).multiplyScalar(0.25 + 0.75 * level);
  }

  dispose(): void {}
}
