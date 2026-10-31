import type * as THREE from 'three';

/**
 * steady — ровный свет; fluoro — люминесцентная лампа с редкими сбоями;
 * broken — почти мёртвая лампа со вспышками; pulse — медленная аварийная пульсация.
 */
export type LightMode = 'steady' | 'fluoro' | 'broken' | 'pulse';

/** Описание источника света в мире. Реальных точечных ламп на сцене мало (пул), остальные включаются по близости. */
export interface LightDef {
  x: number;
  y: number;
  z: number;
  color: number;
  intensity: number;
  distance: number;
  mode: LightMode;
  /** Материал видимого плафона, если он должен мерцать вместе с лампой */
  fixture?: THREE.MeshBasicMaterial;
}
