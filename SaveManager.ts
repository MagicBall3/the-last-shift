import { CONFIG } from '../core/config';
import type { QualityLevel, Settings } from '../core/types';

export interface SaveData {
  version: number;
  settings: Settings;
  progress: { chapter: number; lastPlayedAt: number | null };
}

const QUALITIES: readonly QualityLevel[] = ['low', 'medium', 'high'];

export function defaultSettings(touch: boolean): Settings {
  return {
    sensitivity: 1,
    masterVolume: 0.7,
    quality: touch ? 'low' : 'medium',
    invertY: false,
    headBob: true,
  };
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function sanitizeSettings(raw: unknown, touch: boolean): Settings {
  const d = defaultSettings(touch);
  if (typeof raw !== 'object' || raw === null) return d;
  const r = raw as Record<string, unknown>;
  return {
    sensitivity: num(r.sensitivity, d.sensitivity, 0.3, 2.5),
    masterVolume: num(r.masterVolume, d.masterVolume, 0, 1),
    quality: QUALITIES.includes(r.quality as QualityLevel) ? (r.quality as QualityLevel) : d.quality,
    invertY: typeof r.invertY === 'boolean' ? r.invertY : d.invertY,
    headBob: typeof r.headBob === 'boolean' ? r.headBob : d.headBob,
  };
}

function sanitizeProgress(raw: unknown): SaveData['progress'] {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    chapter: Math.floor(num(r.chapter, 0, 0, 999)),
    lastPlayedAt: typeof r.lastPlayedAt === 'number' && Number.isFinite(r.lastPlayedAt) ? r.lastPlayedAt : null,
  };
}

function readRaw(): Record<string, unknown> | null {
  try {
    const text = localStorage.getItem(CONFIG.save.key);
    if (!text) return null;
    const parsed: unknown = JSON.parse(text);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null; // LocalStorage недоступен или данные повреждены — начинаем с настроек по умолчанию
  }
}

function write(data: SaveData): void {
  try {
    localStorage.setItem(CONFIG.save.key, JSON.stringify(data));
  } catch {
    /* приватный режим или переполнение — игра продолжает работать без сохранения */
  }
}

export function loadSave(touch: boolean): SaveData {
  const raw = readRaw();
  return {
    version: CONFIG.save.version,
    settings: sanitizeSettings(raw?.settings, touch),
    progress: sanitizeProgress(raw?.progress),
  };
}

export function saveSettings(settings: Settings, touch: boolean): void {
  const current = loadSave(touch);
  write({ ...current, settings: sanitizeSettings(settings, touch) });
}

export function recordPlaySession(touch: boolean): void {
  const current = loadSave(touch);
  write({ ...current, progress: { ...current.progress, lastPlayedAt: Date.now() } });
}
