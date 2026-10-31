interface Props {
  prompt: string | null;
  message: string | null;
  isTouch: boolean;
}

export function HUD({ prompt, message, isTouch }: Props) {
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
    </div>
  );
}
