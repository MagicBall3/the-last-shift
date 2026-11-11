export type GamePhase = 'loading' | 'menu' | 'playing' | 'paused';
export type QualityLevel = 'low' | 'medium' | 'high';

export interface Settings {
  /** Множитель чувствительности обзора, 0.3–2.5 */
  sensitivity: number;
  /** Общая громкость, 0–1 */
  masterVolume: number;
  quality: QualityLevel;
  invertY: boolean;
  headBob: boolean;
}

/** События игры -> React-интерфейс. Единственный канал «игра -> UI». */
export interface GameEvents {
  onPrompt(text: string | null): void;
  onMessage(text: string): void;
  onLockLost(): void;
  /** Затемнение экрана 0..1 (переход по лестнице сквозь перекрытие). */
  onFade?(value: number): void;
}

/** Запрос столкновений: круг игрока (x, z, радиус) пересекает стену или предмет? */
export interface CollisionQuery {
  isBlocked(x: number, z: number, radius: number): boolean;
}

/** Всё, что обновляется каждый кадр. Порядок регистрации в Engine = порядок обновления. */
export interface GameModule {
  update(dt: number, elapsed: number): void;
  dispose(): void;
}
