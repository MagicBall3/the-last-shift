import type { QualityLevel } from './types';

export interface QualityPreset {
  maxPixelRatio: number;
  antialias: boolean;
}

/** Антиалиасинг задаётся при создании рендерера, поэтому меняется со следующего запуска смены. */
export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: { maxPixelRatio: 1, antialias: false },
  medium: { maxPixelRatio: 1.5, antialias: true },
  high: { maxPixelRatio: 2, antialias: true },
};

export const CONFIG = {
  /** Максимальный шаг симуляции, сек. Защищает от «прыжков» после паузы/лага. */
  maxDelta: 0.05,
  camera: { fov: 72, near: 0.05, far: 120 },
  world: {
    fogColor: 0x040605,
    fogDensity: 0.02,
    /** Высота потолка, м */
    height: 3.2,
    /** Зерно генератора случайных деталей: одно и то же здание при каждом запуске */
    seed: 1337,
  },
  lighting: {
    hemisphereIntensity: 0.2,
    toneMappingExposure: 1.2,
    /** Сколько реальных точечных источников одновременно (остальные лампы — только свечение). Задаётся при старте смены. */
    pool: { low: 3, medium: 4, high: 5 },
    fadeSpeed: 3.5,
  },
  flashlight: { intensity: 55, distance: 24, angle: 0.5, penumbra: 0.55, color: 0xfff1d6 },
  player: {
    eyeHeight: 1.65,
    radius: 0.3,
    walkSpeed: 2.4,
    runSpeed: 4.0,
    acceleration: 10,
    lookRadPerPixel: 0.0022,
    touchLookScale: 1.6,
    maxPitch: 1.5,
    stepLength: 0.75,
    bobAmplitude: 0.035,
  },
  interaction: { maxDistance: 2.2 },
  /** Адаптивное разрешение: если кадры стабильно медленные, снижаем масштаб рендера. */
  perf: { slowFrameMs: 24, slowFrameLimit: 60, renderScaleStep: 0.15, minRenderScale: 0.55 },
  save: { key: 'the-last-shift:save', version: 1 },
} as const;
