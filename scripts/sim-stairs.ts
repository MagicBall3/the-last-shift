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

import { CONFIG } from '../src/core/config';
import { World } from '../src/world/World';
import { Player } from '../src/player/Player';
import { LevelTransitions } from '../src/world/levels/LevelTransitions';
import {
  STAIR_NICHE_NORTH,
  STAIR_OPENINGS,
  stairFlightFootprint,
  stairLanding,
  stairTarget,
  stairZone,
  type StairRect,
} from '../src/world/levels/stairs';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

const world = new World();
const levels = world.levels;
const player = new Player(world.spawn, world.spawnYaw, world.collision);
world.attachPlayer(player.position);

/** Значения затемнения экрана, которые получил UI за все переходы. */
const fades: number[] = [];
/** Сообщения о прибытии на этаж. */
const messages: string[] = [];
const transitions = new LevelTransitions(levels, player, {
  onFade: (value) => fades.push(value),
  onMessage: (message) => messages.push(message),
});

const DT = 1 / 60;
const RADIUS = CONFIG.player.radius;
const NICHES: [string, StairRect][] = [['северная', STAIR_NICHE_NORTH]];

function levelOf(y: number): number {
  return levels.findIndex((l) => Math.abs(l.baseY - y) < 0.01);
}

/**
 * Ставит игрока в служебный коридор западнее ниши и взводит переход.
 * Точка обязана быть на полу и вне обеих ниш: только тогда LevelTransitions
 * снова разрешает срабатывание.
 */
function standOutside(index: number, niche: StairRect, z: number): boolean {
  if (player.transitioning) {
    err(`standOutside: активен переход (уровень ${index})`);
    return false;
  }
  player.position.set(niche.x - 0.6, levels[index].baseY, z);
  player.stopMotion();
  if (world.collision.isBlocked(player.position.x, player.position.z, RADIUS)) {
    err(`Точка подхода (${player.position.x.toFixed(2)}, ${player.position.z.toFixed(2)}) уровня ${index} заблокирована`);
    return false;
  }
  transitions.update(DT);
  if (player.transitioning) {
    err(`Переход сработал снаружи ниши (уровень ${index})`);
    return false;
  }
  return true;
}

/** Идёт к точке по прямой; возвращает, дошёл ли и начался ли переход. */
function walkTo(tx: number, tz: number): { reached: boolean; started: boolean } {
  for (let step = 0; step < 800; step += 1) {
    const p = player.position;
    const dx = tx - p.x;
    const dz = tz - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.04) return { reached: true, started: false };
    const k = Math.min(0.04, dist);
    const nx = p.x + (dx / dist) * k;
    const nz = p.z + (dz / dist) * k;
    if (world.collision.isBlocked(nx, nz, RADIUS)) return { reached: false, started: false };
    p.x = nx;
    p.z = nz;
    transitions.update(DT);
    if (player.transitioning) return { reached: false, started: true };
  }
  return { reached: false, started: false };
}

/** Прокручивает переход до завершения. */
function finish(): boolean {
  for (let i = 0; i < 600; i += 1) {
    transitions.update(DT);
    if (!player.transitioning) return true;
  }
  return false;
}

function expectAt(levelIndex: number, niche: StairRect, context: string): void {
  if (player.transitioning) err(`${context}: переход не завершён`);
  const got = levelOf(player.position.y);
  if (got !== levelIndex) err(`${context}: ожидался уровень ${levelIndex}, получен ${got} (y=${player.position.y.toFixed(2)})`);

  const landing = stairLanding(niche);
  if (Math.abs(player.position.x - landing.x) > 0.01 || Math.abs(player.position.z - landing.z) > 0.01) {
    err(
      `${context}: приземление (${player.position.x.toFixed(2)}, ${player.position.z.toFixed(2)}) ` +
        `вместо (${landing.x},${landing.z})`,
    );
  }
  if (world.collision.isBlocked(player.position.x, player.position.z, RADIUS)) err(`${context}: приземление в стене`);
  if (player.speed !== 0) err(`${context}: после приземления осталась скорость ${player.speed.toFixed(2)} м/с`);
  if ((fades[fades.length - 1] ?? 0) !== 0) err(`${context}: затемнение не сброшено`);
  if (messages[messages.length - 1] !== levels[levelIndex].name) {
    err(`${context}: сообщение «${messages[messages.length - 1]}» вместо «${levels[levelIndex].name}»`);
  }
}

/**
 * После приземления игрок стоит между зонами. Переход не должен срабатывать
 * повторно, даже если ходить внутри ниши, — пока игрок не выйдет наружу.
 */
function expectNoRepeat(niche: StairRect, levelIndex: number, context: string): void {
  for (let i = 0; i < 90; i += 1) transitions.update(DT);
  if (player.transitioning) {
    err(`${context}: повторное срабатывание на площадке приземления`);
    return;
  }

  const x = niche.x + niche.w / 4;
  const zs = [niche.z + 0.8, niche.z + niche.d - 0.8, niche.z + niche.d / 2];
  for (const z of zs) {
    const res = walkTo(x, z);
    if (player.transitioning) {
      err(`${context}: повторное срабатывание внутри ниши (z=${z.toFixed(2)})`);
      return;
    }
    if (!res.reached) {
      err(`${context}: проход ниши застрял на z=${z.toFixed(2)}`);
      return;
    }
  }
  if (levelOf(player.position.y) !== levelIndex) err(`${context}: уровень изменился без выхода из ниши`);
}

/** Выход из ниши и повторный вход: флаг «взведено» обязан сброситься. */
function expectRearm(index: number, niche: StairRect, context: string): void {
  const midZ = niche.z + niche.d / 2;
  const out = walkTo(niche.x - 0.6, midZ);
  if (player.transitioning || !out.reached) {
    err(`${context}: не удалось выйти из ниши для повторного взвода`);
    return;
  }

  const zone = stairZone(niche, 1);
  const z = zone.z + zone.d / 2;
  const back = walkTo(niche.x + 0.5, z);
  if (!back.started || !player.transitioning) {
    err(`${context}: после выхода переход не взвёлся заново`);
    return;
  }
  if (!finish()) {
    err(`${context}: повторный переход не завершился`);
    return;
  }
  const expected = stairTarget(index, 1);
  if (expected === null) err(`${context}: вверх идти некуда`);
  else expectAt(expected, niche, `${context} (повторно)`);
}

/**
 * В проходе вдоль западной стены нет невидимых барьеров. Проверяется ре为题
 * достижимая полоса: у стен игрок стоять не может из-за радиуса, поэтому
 * берём диапазон, который действительно проходим по сетке и коллизиям.
 *
 * Раньше коллизия марша выступала на 0,3 м в проход (x от 45,75 вместо 46,0),
 * и игрок упирался в невидимую стену, не доходя до ступеней.
 */
function expectClearPassage(levelIndex: number, niche: StairRect): void {
  const f = stairFlightFootprint(niche);
  const fx0 = f.x - f.w / 2;
  const context = `уровень ${levelIndex}, проход ниши`;
  const minX = niche.x + RADIUS + 0.02;
  const maxX = fx0 - RADIUS - 0.02;
  if (maxX <= minX) {
    err(`${context}: проход не вмещает игрока (${minX.toFixed(2)}..${maxX.toFixed(2)})`);
    return;
  }
  // Границы ниши по z: у северной и южной стен игрок тоже не стоит вплотную.
  const minZ = niche.z + RADIUS + 0.02;
  const maxZ = niche.z + niche.d - RADIUS - 0.02;

  let checked = 0;
  for (let z = minZ; z <= maxZ + 1e-9; z += 0.1) {
    for (let x = minX; x <= maxX + 1e-9; x += 0.05) {
      // Только те точки, что свободны по сетке: у проёма пола нет intentionally.
      if (!levels[levelIndex].grid.isFloor(Math.floor(x), Math.floor(z))) continue;
      checked += 1;
      if (world.collision.isBlocked(x, z, RADIUS)) {
        err(`${context}: невидимый барьер в (${x.toFixed(2)}, ${z.toFixed(2)})`);
        return;
      }
    }
  }
  if (checked < 20) err(`${context}: слишком мало проверенных точек (${checked})`);
}

/** Один сценарий: подход к нужному концу марша и переход. */
function testOne(index: number, nicheName: string, niche: StairRect, dir: 1 | -1): void {
  const context = `уровень ${index}, ${nicheName} ниша, ${dir === 1 ? 'вверх' : 'вниз'}`;
  const expected = stairTarget(index, dir);
  if (expected === null) {
    err(`${context}: нет целевого уровня`);
    return;
  }

  const zone = stairZone(niche, dir);
  const zTarget = zone.z + zone.d / 2;
  const midZ = niche.z + niche.d / 2;

  if (!standOutside(index, niche, dir === 1 ? zTarget : midZ)) return;

  if (dir === 1) {
    const res = walkTo(niche.x + 0.5, zTarget);
    if (!res.started || !player.transitioning) {
      err(`${context}: переход не начался при входе в зону «вверх»`);
      return;
    }
  } else {
    // Сначала входим в нейтральную середину — здесь перехода быть не должно.
    const toMid = walkTo(niche.x + 0.5, midZ);
    if (player.transitioning) {
      err(`${context}: переход сработал в нейтральной середине ниши`);
      return;
    }
    if (!toMid.reached) {
      err(`${context}: не удалось войти в нейтральную середину ниши`);
      return;
    }
    const res = walkTo(niche.x + 0.5, zTarget);
    if (!res.started || !player.transitioning) {
      err(`${context}: переход не начался при входе в зону «вниз»`);
      return;
    }
  }

  if (!finish()) {
    err(`${context}: переход не завершился за отведённое время`);
    return;
  }
  expectAt(expected, niche, context);
  expectNoRepeat(niche, expected, context);
  console.log(`OK   ${context}: ${index} → ${expected}`);
}

/** Проверяет, что точка перекрыта коллизией марша. */
function expectBlocked(context: string, x: number, z: number): void {
  if (!world.collision.isBlocked(x, z, RADIUS)) err(`${context}: точка (${x},${z}) проходима`);
}

/** Марш и проём: игрок не проходит сквозь ступени и не встаёт над дырой. */
function expectSolid(levelIndex: number, nicheName: string, niche: StairRect): void {
  const context = `уровень ${levelIndex}, ${nicheName} ниша`;
  player.position.set(stairLanding(niche).x, levels[levelIndex].baseY, niche.z + niche.d / 2);
  player.stopMotion();

  const f = stairFlightFootprint(niche);
  const fx0 = f.x - f.w / 2;
  const res = walkTo(f.x, niche.z + 2);
  if (player.transitioning) err(`${context}: переход при попытке войти в марш`);
  if (res.reached) err(`${context}: игрок прошёл сквозь марш`);
  if (player.position.x > fx0 - RADIUS + 0.01) {
    err(`${context}: игрок залез в марш (x=${player.position.x.toFixed(2)}, граница ${(fx0 - RADIUS).toFixed(2)})`);
  }

  const hole = STAIR_OPENINGS.find((o) => o.z >= niche.z && o.z < niche.z + niche.d);
  if (!hole) {
    err(`${context}: нет клетки проёма`);
    return;
  }
  for (let dz = 0; dz < hole.d; dz += 1) {
    for (const fx of [0.1, 0.5, 0.9]) {
      for (const fz of [0.1, 0.5, 0.9]) {
        expectBlocked(`${context} (проём)`, hole.x + fx, hole.z + dz + fz);
      }
    }
  }
}

// ── 1. Оба направления на единственной лестнице (наземный уровень) ─────────
for (const [name, niche] of NICHES) {
  for (const dir of [1, -1] as const) {
    testOne(0, name, niche, dir);
    standOutside(0, STAIR_NICHE_NORTH, STAIR_NICHE_NORTH.z + STAIR_NICHE_NORTH.d / 2);
  }
}

// ── 2. Повторный вход после выхода должен снова взводить переход ───────────
testOne(0, 'северная', STAIR_NICHE_NORTH, 1);
expectRearm(1, STAIR_NICHE_NORTH, 'повторный взвод');
standOutside(0, STAIR_NICHE_NORTH, STAIR_NICHE_NORTH.z + 2);

// ── 3. Маршрут по всему комплексу: вверх до этажа 4 и обратно до −3 ────────
const route: { from: number; dir: 1 | -1; nicheName: string; niche: StairRect }[] = [
  { from: 0, dir: 1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 1, dir: 1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 2, dir: 1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 3, dir: -1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 2, dir: -1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 1, dir: -1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 0, dir: -1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 4, dir: -1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 5, dir: -1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 6, dir: 1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 5, dir: 1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
  { from: 4, dir: 1, nicheName: 'северная', niche: STAIR_NICHE_NORTH },
];
const path: number[] = [route[0].from];
for (const step of route) {
  const here = levelOf(player.position.y);
  if (here !== step.from) {
    err(`Маршрут: стоим на уровне ${here}, шаг ожидает ${step.from}`);
    break;
  }
  testOne(step.from, step.nicheName, step.niche, step.dir);
  path.push(levelOf(player.position.y));
}
const routeEnd = levelOf(player.position.y);

// ── 4. Марш и проём непроходимы на каждом уровне ───────────────────────────
for (let index = 0; index < levels.length; index += 1) {
  for (const [name, niche] of NICHES) expectSolid(index, name, niche);
}

// ── 4b. В проходе нет невидимых барьеров ──────────────────────────────────
for (let index = 0; index < levels.length; index += 1) {
  expectClearPassage(index, STAIR_NICHE_NORTH);
}

// ── 5. Затемнение: камера проходит сквозь перекрытие ───────────────────────
const peakFade = fades.length ? Math.max(...fades) : 0;
console.log(`Маршрут:      ${path.join(' → ')}`);
console.log(`Финал маршрута: уровень ${routeEnd} (y=${levels[routeEnd]?.baseY.toFixed(2)})`);
console.log(`Затемнение:   пик ${peakFade.toFixed(2)}, последнее ${(fades[fades.length - 1] ?? 0).toFixed(2)}`);
console.log(`Сообщений:    ${messages.length}`);
if (peakFade < 0.95) err(`переход не затемняет экран (пик ${peakFade.toFixed(2)})`);
if ((fades[fades.length - 1] ?? 0) !== 0) err('затемнение не сбрасывается после перехода');

if (errors.length) {
  console.error('\nОШИБКИ:\n' + [...new Set(errors)].join('\n'));
  process.exit(1);
}
console.log('\nЛестницы проходимы: оба направления в обеих нишах, марш и проём непроходимы.');
