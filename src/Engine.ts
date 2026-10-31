import * as THREE from 'three';
import { CONFIG, QUALITY_PRESETS } from './config';
import type { GameModule, QualityLevel } from './types';

/**
 * Ядро: рендерер, сцена, камера, игровой цикл.
 * Ничего не знает об игре — только вызывает update() у зарегистрированных модулей по порядку.
 */
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private readonly modules: GameModule[] = [];
  private quality: QualityLevel;
  private renderScale = 1;
  private width = 1;
  private height = 1;
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;
  private slowFrames = 0;

  constructor(canvas: HTMLCanvasElement, quality: QualityLevel) {
    this.quality = quality;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: QUALITY_PRESETS[quality].antialias,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = CONFIG.lighting.toneMappingExposure;

    this.scene.background = new THREE.Color(CONFIG.world.fogColor);
    this.scene.fog = new THREE.FogExp2(CONFIG.world.fogColor, CONFIG.world.fogDensity);

    this.camera = new THREE.PerspectiveCamera(CONFIG.camera.fov, 1, CONFIG.camera.near, CONFIG.camera.far);
    this.scene.add(this.camera);
    this.applyPixelRatio();
  }

  addModule(module: GameModule): void {
    this.modules.push(module);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.applyPixelRatio();
    this.renderOnce();
  }

  setQuality(quality: QualityLevel): void {
    if (quality === this.quality) return;
    this.quality = quality;
    this.renderScale = 1;
    this.applyPixelRatio();
    this.renderOnce();
  }

  dispose(): void {
    this.stop();
    for (const module of this.modules) module.dispose();
    this.modules.length = 0;
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) (value as THREE.Texture).dispose();
          }
          material.dispose();
        }
      }
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private renderOnce(): void {
    if (!this.running) this.renderer.render(this.scene, this.camera);
  }

  private applyPixelRatio(): void {
    const preset = QUALITY_PRESETS[this.quality];
    const ratio = Math.min(window.devicePixelRatio || 1, preset.maxPixelRatio) * this.renderScale;
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(this.width, this.height, false);
  }

  private adaptResolution(dtSeconds: number): void {
    const perf = CONFIG.perf;
    if (dtSeconds * 1000 > perf.slowFrameMs) this.slowFrames += 1;
    else this.slowFrames = Math.max(0, this.slowFrames - 1);

    if (this.slowFrames > perf.slowFrameLimit && this.renderScale > perf.minRenderScale) {
      this.renderScale = Math.max(perf.minRenderScale, this.renderScale - perf.renderScaleStep);
      this.slowFrames = 0;
      this.applyPixelRatio();
    }
  }

  private readonly frame = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.frame);

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(Math.max(rawDt, 0), CONFIG.maxDelta);
    this.elapsed += dt;
    this.adaptResolution(rawDt);

    for (const module of this.modules) module.update(dt, this.elapsed);
    this.renderer.render(this.scene, this.camera);
  };
}
