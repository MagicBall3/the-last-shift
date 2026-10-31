import { useEffect } from 'react';
import type { QualityLevel, Settings } from '../core/types';
import { t } from './strings';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
}

const QUALITY_LEVELS: readonly QualityLevel[] = ['low', 'medium', 'high'];

export function SettingsPanel({ settings, onChange, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const patch = (change: Partial<Settings>) => onChange({ ...settings, ...change });

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t.settings.title}>
      <div className="panel">
        <h2 className="panel-title">{t.settings.title}</h2>

        <label className="field">
          <span className="field-label">
            {t.settings.sensitivity}
            <output>{settings.sensitivity.toFixed(1)}</output>
          </span>
          <input
            type="range"
            min={0.3}
            max={2.5}
            step={0.1}
            value={settings.sensitivity}
            onChange={(e) => patch({ sensitivity: Number(e.target.value) })}
          />
        </label>

        <label className="field">
          <span className="field-label">
            {t.settings.volume}
            <output>{Math.round(settings.masterVolume * 100)}%</output>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.masterVolume}
            onChange={(e) => patch({ masterVolume: Number(e.target.value) })}
          />
        </label>

        <label className="field">
          <span className="field-label">{t.settings.quality}</span>
          <select
            value={settings.quality}
            onChange={(e) => patch({ quality: e.target.value as QualityLevel })}
          >
            {QUALITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t.settings.qualityOptions[level]}
              </option>
            ))}
          </select>
          <span className="field-note">{t.settings.qualityNote}</span>
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={settings.invertY}
            onChange={(e) => patch({ invertY: e.target.checked })}
          />
          {t.settings.invertY}
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={settings.headBob}
            onChange={(e) => patch({ headBob: e.target.checked })}
          />
          {t.settings.headBob}
        </label>

        <button className="menu-item" onClick={onClose}>
          {t.settings.back}
        </button>
      </div>
    </div>
  );
}
