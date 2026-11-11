import { useEffect, useMemo, useRef, useState } from 'react';
import { TouchControls } from '../controls/TouchControls';
import type { Settings } from '../core/types';
import { HUD } from '../ui/HUD';
import { t } from '../ui/strings';
import { TouchOverlay } from '../ui/TouchOverlay';
import { GameSession } from './GameSession';

interface Props {
  settings: Settings;
  paused: boolean;
  isTouch: boolean;
  onPause: () => void;
}

/** Тонкая React-обёртка: владеет жизненным циклом GameSession и показывает HUD. */
export default function GameCanvas({ settings, paused, isTouch, onPause }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const touch = useMemo(() => new TouchControls(), []);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fade, setFade] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Свежие значения для колбэков, живущих дольше одного рендера
  const latest = useRef({ settings, onPause });
  latest.current = { settings, onPause };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let messageTimer = 0;
    try {
      sessionRef.current = GameSession.create({
        container,
        settings: latest.current.settings,
        touch,
        isTouch,
        events: {
          onPrompt: setPrompt,
          onMessage: (text) => {
            setMessage(text);
            window.clearTimeout(messageTimer);
            messageTimer = window.setTimeout(() => setMessage(null), 2500);
          },
          onLockLost: () => latest.current.onPause(),
          onFade: setFade,
        },
      });
    } catch (e) {
      console.error(e);
      setError(t.game.initError);
    }
    return () => {
      window.clearTimeout(messageTimer);
      sessionRef.current?.dispose();
      sessionRef.current = null;
    };
  }, [touch, isTouch]);

  useEffect(() => {
    sessionRef.current?.applySettings(settings);
  }, [settings]);

  useEffect(() => {
    const session = sessionRef.current;
    if (!session) return;
    if (paused) session.pause();
    else session.resume();
  }, [paused]);

  useEffect(() => {
    const handler = () => {
      if (document.hidden) latest.current.onPause();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return (
    <div className="game-root">
      <div ref={containerRef} className="game-viewport" />
      {error && (
        <div className="fatal" role="alert">
          {error}
        </div>
      )}
      {!error && !paused && <HUD prompt={prompt} message={message} isTouch={isTouch} fade={fade} />}
      {!error && !paused && isTouch && <TouchOverlay controls={touch} onPause={onPause} />}
    </div>
  );
}
