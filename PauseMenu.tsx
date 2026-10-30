import { t } from './strings';

interface Props {
  isTouch: boolean;
  onResume: () => void;
  onSettings: () => void;
  onExit: () => void;
}

export function PauseMenu({ isTouch, onResume, onSettings, onExit }: Props) {
  const controls = isTouch ? t.pause.controlsTouch : t.pause.controlsDesktop;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t.pause.title}>
      <div className="panel">
        <h2 className="panel-title">{t.pause.title}</h2>
        <nav className="menu-list">
          <button className="menu-item" onClick={onResume} autoFocus>
            {t.pause.resume}
          </button>
          <button className="menu-item" onClick={onSettings}>
            {t.pause.settings}
          </button>
          <button className="menu-item" onClick={onExit}>
            {t.pause.toMenu}
          </button>
        </nav>
        <section className="help">
          <h3>{t.pause.controlsTitle}</h3>
          <ul>
            {controls.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
