import { useEffect, useRef, useState } from 'react';
import { isAudioAvailable, isWebGLAvailable } from '../core/platform';
import { t } from './strings';

interface Step {
  label: string;
  run: () => Promise<void> | void;
}

/** Реальные шаги подготовки: проверка WebGL, загрузка чанка с движком, проверка Web Audio. */
const STEPS: Step[] = [
  {
    label: t.loading.graphics,
    run: () => {
      if (!isWebGLAvailable()) throw new Error(t.loading.errorWebgl);
    },
  },
  {
    label: t.loading.engine,
    run: async () => {
      try {
        await import('../game/GameCanvas');
      } catch {
        throw new Error(t.loading.errorEngine);
      }
    },
  },
  {
    label: t.loading.audio,
    run: () => {
      if (!isAudioAvailable()) console.warn('Web Audio недоступен: игра запустится без звука.');
    },
  },
];

interface Props {
  onReady: () => void;
}

export function LoadingScreen({ onReady }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        for (let i = 0; i < STEPS.length; i += 1) {
          if (cancelled) return;
          setStepIndex(i);
          await STEPS[i].run();
          setDone(i + 1);
        }
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        if (!cancelled) onReadyRef.current();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t.loading.errorGeneric);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const percent = Math.round((done / STEPS.length) * 100);

  return (
    <main className="screen screen--loading">
      <h1 className="title title--small">{t.title}</h1>
      {error ? (
        <div role="alert" className="loading-error">
          <p>{error}</p>
          <button className="menu-item" onClick={() => window.location.reload()}>
            {t.loading.retry}
          </button>
        </div>
      ) : (
        <>
          <div
            className="loading-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className="loading-bar-fill" style={{ width: `${percent}%` }} />
          </div>
          <p className="loading-label" aria-live="polite">
            {STEPS[stepIndex].label}
          </p>
        </>
      )}
    </main>
  );
}
