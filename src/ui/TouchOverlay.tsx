import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { TouchControls } from '../controls/TouchControls';
import { t } from './strings';

const STICK_RADIUS = 56;
const DEAD_ZONE = 0.12;

interface Props {
  controls: TouchControls;
  onPause: () => void;
}

interface Pointer {
  id: number;
  x: number;
  y: number;
}

/** Виртуальный джойстик слева, обзор перетаскиванием справа, кнопки «бег» и «действие». */
export function TouchOverlay({ controls, onPause }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const stick = useRef<Pointer | null>(null);
  const look = useRef<Pointer | null>(null);

  const resetStick = () => {
    stick.current = null;
    controls.setMove(0, 0);
    if (baseRef.current) baseRef.current.style.opacity = '0';
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
  };

  const onStickDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (stick.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const zone = e.currentTarget.getBoundingClientRect();
    stick.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    const base = baseRef.current;
    if (base) {
      base.style.transform = `translate(${e.clientX - zone.left - STICK_RADIUS}px, ${e.clientY - zone.top - STICK_RADIUS}px)`;
      base.style.opacity = '1';
    }
  };

  const onStickMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = stick.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    const dist = Math.hypot(dx, dy);
    const k = dist > STICK_RADIUS ? STICK_RADIUS / dist : 1;
    const cx = dx * k;
    const cy = dy * k;
    if (knobRef.current) knobRef.current.style.transform = `translate(${cx}px, ${cy}px)`;
    const nx = cx / STICK_RADIUS;
    const ny = cy / STICK_RADIUS;
    if (Math.hypot(nx, ny) < DEAD_ZONE) controls.setMove(0, 0);
    else controls.setMove(nx, -ny);
  };

  const onStickEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (stick.current?.id === e.pointerId) resetStick();
  };

  const onLookDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (look.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    look.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };

  const onLookMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const l = look.current;
    if (!l || l.id !== e.pointerId) return;
    controls.addLook(e.clientX - l.x, e.clientY - l.y);
    l.x = e.clientX;
    l.y = e.clientY;
  };

  const onLookEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (look.current?.id === e.pointerId) look.current = null;
  };

  const onRunDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    controls.setRun(true);
  };
  const onRunEnd = () => controls.setRun(false);

  return (
    <div className="touch-overlay" onContextMenu={(e) => e.preventDefault()}>
      <div className="touch-hint">{t.game.rotateHint}</div>

      <div
        className="touch-zone touch-zone--stick"
        onPointerDown={onStickDown}
        onPointerMove={onStickMove}
        onPointerUp={onStickEnd}
        onPointerCancel={onStickEnd}
      >
        <div className="stick-base" ref={baseRef}>
          <div className="stick-knob" ref={knobRef} />
        </div>
      </div>

      <div
        className="touch-zone touch-zone--look"
        onPointerDown={onLookDown}
        onPointerMove={onLookMove}
        onPointerUp={onLookEnd}
        onPointerCancel={onLookEnd}
      />

      <button
        className="touch-btn touch-btn--run"
        onPointerDown={onRunDown}
        onPointerUp={onRunEnd}
        onPointerCancel={onRunEnd}
        onLostPointerCapture={onRunEnd}
      >
        {t.game.run}
      </button>
      <button className="touch-btn touch-btn--light" onPointerDown={() => controls.queueFlashlight()}>
        {t.game.flashlight}
      </button>
      <button className="touch-btn touch-btn--interact" onPointerDown={() => controls.queueInteract()}>
        {t.game.interact}
      </button>
      <button className="touch-pause" aria-label={t.game.pause} onClick={onPause}>
        II
      </button>
    </div>
  );
}
