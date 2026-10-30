import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { audio } from './audio/AudioManager';
import { enterImmersive, isTouchDevice, leaveImmersive } from './core/platform';
import type { GamePhase, Settings } from './core/types';
import { loadSave, recordPlaySession, saveSettings } from './saves/SaveManager';
import { LoadingScreen } from './ui/LoadingScreen';
import { MainMenu } from './ui/MainMenu';
import { PauseMenu } from './ui/PauseMenu';
import { SettingsPanel } from './ui/SettingsPanel';

// Three.js и вся игра грузятся отдельным чанком — меню открывается быстро.
const GameCanvas = lazy(() => import('./game/GameCanvas'));

export default function App() {
  const isTouch = useMemo(() => isTouchDevice(), []);
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [settings, setSettings] = useState<Settings>(() => loadSave(isTouch).settings);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    saveSettings(settings, isTouch);
  }, [settings, isTouch]);

  useEffect(() => {
    audio.setVolume(settings.masterVolume);
  }, [settings.masterVolume]);

  const handleReady = useCallback(() => setPhase('menu'), []);
  const handlePause = useCallback(() => setPhase((p) => (p === 'playing' ? 'paused' : p)), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  // Вызывается из обработчика клика: звук и полноэкранный режим требуют жеста пользователя
  const startGame = () => {
    void audio.start();
    recordPlaySession(isTouch);
    if (isTouch) void enterImmersive();
    setPhase('playing');
  };

  const exitToMenu = () => {
    audio.suspend();
    if (isTouch) void leaveImmersive();
    setShowSettings(false);
    setPhase('menu');
  };

  const inGame = phase === 'playing' || phase === 'paused';

  return (
    <>
      {phase === 'loading' && <LoadingScreen onReady={handleReady} />}
      {phase === 'menu' && <MainMenu onPlay={startGame} onSettings={() => setShowSettings(true)} />}
      {inGame && (
        <Suspense fallback={null}>
          <GameCanvas settings={settings} paused={phase === 'paused'} isTouch={isTouch} onPause={handlePause} />
        </Suspense>
      )}
      {phase === 'paused' && !showSettings && (
        <PauseMenu
          isTouch={isTouch}
          onResume={() => setPhase('playing')}
          onSettings={() => setShowSettings(true)}
          onExit={exitToMenu}
        />
      )}
      {showSettings && <SettingsPanel settings={settings} onChange={setSettings} onClose={closeSettings} />}
    </>
  );
}
