import { t } from './strings';

interface Props {
  onPlay: () => void;
  onSettings: () => void;
}

export function MainMenu({ onPlay, onSettings }: Props) {
  return (
    <main className="screen screen--menu">
      <header>
        <h1 className="title title--flicker">{t.title}</h1>
        <p className="tagline">{t.tagline}</p>
      </header>
      <nav className="menu-list">
        <button className="menu-item" onClick={onPlay}>
          {t.menu.play}
        </button>
        <button className="menu-item" onClick={onSettings}>
          {t.menu.settings}
        </button>
      </nav>
      <p className="version">{t.menu.version}</p>
    </main>
  );
}
