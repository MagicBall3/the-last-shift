/* Симуляция лестничных переходов на реальной геометрии: npx tsx scripts/sim-stairs.ts */

function makeCtx(): any {
  const grad = { addColorStop() {} };
  return new Proxy(
    {
      measureText: () => ({ width: 100 }),
      createLinearGradient: () => grad,
      getImageData: () => ({ data: new Uint8ClampedArray(256 * 256 * 4) }),
      putImageData() {},
      createRadialGradient: () => grad,
    },
    {
      get(target, prop) {
        if (prop in target) return (target as any)[prop];
        return () => {};
      },
      set(target, prop, value) {
        (target as any)[prop] = value;
        return true;
      },
    },
  );
}

(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') return { width: 256, height: 256, getContext: () => makeCtx(), style: {} };
    return {};
  },
};

import * as THREE from 'three';
import { World } from '../src/world/World';
import { Player } from '../src/player/Player';
import { LevelTransitions } from '../src/world/levels/LevelTransitions';
import { NICHE_DOWN_CENTER, NICHE_UP_CENTER } from '../src/world/levels/stairs';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

const world = new World();
const levels = world.levels;
const player = new Player(world.spawn, world.spawnYaw, world.collision);
world.attachPlayer(player.position);
/** Значения затемнения экрана, которые получил UI за все переходы. */
const fades: number[] = [];
const transitions = new LevelTransitions(levels, player, { onFade: (value) => fades.push(value) });

const DT = 1 / 60;
const RADIUS = 0.3;

/** Проводит игрока к точке по прямой, шагами, с проверкой коллизий. */
function walkTo(tx: number, tz: number): boolean {
  for (let step = 0; step < 400; step += 1) {
    const p = player.position;
    const dx = tx - p.x;
    const dz = tz - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.12) return true;
    const nx = p.x + (dx / dist) * 0.08;
    const nz = p.z + (dz / dist) * 0.08;
    if (world.collision.isBlocked(nx, nz, RADIUS)) return false;
    p.x = nx;
    p.z = nz;
    transitions.update(DT);
    if (player.transitioning) return true;
  }
  return false;
}

/** Прокручивает переход до завершения. */
function finishTransition(): boolean {
  for (let i = 0; i < 600; i += 1) {
    transitions.update(DT);
    if (!player.transitioning) return true;
  }
  return false;
}

/** Выходит из ниши в коридор, чтобы «взвести» переход. */
function leaveNiche(): void {
  const p = player.position;
  // ниша x 45–47; коридор/служебный проход западнее
  for (let i = 0; i < 60; i += 1) {
    const nx = p.x - 0.08;
    if (world.collision.isBlocked(nx, p.z, RADIUS)) break;
    p.x = nx;
    transitions.update(DT);
    if (player.transitioning) return;
  }
}

/** Подход к нише снаружи и переход. */
function useStair(kind: 'up' | 'down'): boolean {
  const center = kind === 'up' ? NICHE_UP_CENTER : NICHE_DOWN_CENTER;
  // встаём в 1.6 м западнее центра ниши, в проходе
  const p = player.position;
  p.x = center.x - 1.8;
  p.z = center.z;
  player.transitioning = false;
  // «взвести»: имитируем, что игрок только что пришёл снаружи
  leaveNiche();
  if (player.transitioning) return false; // не должен сработать на выходе

  const reached = walkTo(center.x, center.z);
  if (!player.transitioning) {
    err(`Лестница «${kind}» не сработала: дошёл=${reached}, позиция ${p.x.toFixed(2)},${p.z.toFixed(2)}`);
    return false;
  }
  if (!finishTransition()) {
    err(`Переход «${kind}» не завершился за отведённое время`);
    return false;
  }
  return true;
}

function levelOf(y: number): number {
  return levels.findIndex((l) => Math.abs(l.baseY - y) < 0.01);
}

function expectLevel(expected: number, context: string): void {
  const idx = levelOf(player.position.y);
  if (idx !== expected) {
    err(`${context}: ожидался уровень ${expected}, получен ${idx} (y=${player.position.y.toFixed(2)})`);
  }
  if (world.collision.isBlocked(player.position.x, player.position.z, RADIUS)) {
    err(`${context}: игрок оказался внутри стены (${player.position.x.toFixed(2)}, ${player.position.z.toFixed(2)})`);
  }
  if (player.speed !== 0) {
    err(`${context}: после приземления осталась скорость ${player.speed.toFixed(2)} м/с`);
  }
}

// ── Вверх: 0 → 1 → 2 → 3 ──
const upPath: number[] = [0];
for (let target = 1; target <= 3; target += 1) {
  if (!useStair('up')) break;
  expectLevel(target, `подъём на уровень ${target}`);
  upPath.push(target);
  leaveNiche();
}

// ── Вниз: 3 → 2 → 1 → 0 → 4 → 5 → 6 ──
const downPath: number[] = [levelOf(player.position.y)];
for (let i = 0; i < 6; i += 1) {
  if (!useStair('down')) break;
  const idx = levelOf(player.position.y);
  expectLevel(idx, 'спуск');
  downPath.push(idx);
  leaveNiche();
}

// ── Обратно вверх: 6 → 5 → 4 → 0 ──
const backPath: number[] = [levelOf(player.position.y)];
for (let i = 0; i < 3; i += 1) {
  if (!useStair('up')) break;
  const idx = levelOf(player.position.y);
  expectLevel(idx, 'подъём обратно');
  backPath.push(idx);
  leaveNiche();
}

console.log(`Вверх:        ${upPath.join(' → ')}`);
console.log(`Вниз:         ${downPath.join(' → ')}`);
console.log(`Обратно:      ${backPath.join(' → ')}`);
console.log(`Финальная y:  ${player.position.y.toFixed(2)} (уровень ${levelOf(player.position.y)})`);

// Затемнение: камера проходит сквозь перекрытие, поэтому экран должен уходить в чёрное
const peakFade = fades.length ? Math.max(...fades) : 0;
console.log(`Затемнение:   пик ${peakFade.toFixed(2)}, последнее ${(fades[fades.length - 1] ?? 0).toFixed(2)}`);
if (peakFade < 0.95) err(`переход не затемняет экран (пик ${peakFade.toFixed(2)})`);
if ((fades[fades.length - 1] ?? 0) !== 0) err('затемнение не сбрасывается после перехода');

if (errors.length) {
  console.error('\nОШИБКИ:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('\nЛестницы проходимы: переходы срабатывают, приземление свободно.');
