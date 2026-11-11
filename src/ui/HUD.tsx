interface Props {
  prompt: string | null;
  message: string | null;
  isTouch: boolean;
  /** Затемнение экрана 0..1 на время перехода по лестнице. */
  fade?: number;
}

export function HUD({ prompt, message, isTouch, fade = 0 }: Props) {
  return (
    <div className="hud" aria-live="polite">
      <div className="crosshair" />
      {prompt && (
        <div className="hud-prompt">
          {!isTouch && <kbd>E</kbd>}
          {prompt}
        </div>
      )}
      {message && <div className="hud-message">{message}</div>}
      {fade > 0.001 && <div className="hud-fade" style={{ opacity: fade }} />}
    </div>
  );
}
