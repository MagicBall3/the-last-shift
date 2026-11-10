/* Смоук-тест: строит весь мир NADIR в Node с заглушкой canvas. */

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
    if (tag === 'canvas') {
      return { width: 256, height: 256, getContext: () => makeCtx(), style: {} };
    }
    return {};
  },
};

import { World } from '../src/world/World';

try {
  const world = new World();
  const interactables = world.interactables.length;
  const lights = world.lights.length;
  const levels = world.levels.length;
  console.log(`World построен: уровней ${levels}, интерактивных объектов ${interactables}, источников света ${lights}`);
  console.log(`Спаун: ${world.spawn.x.toFixed(1)}, ${world.spawn.y.toFixed(1)}, ${world.spawn.z.toFixed(1)}`);
  console.log('OK — мир собирается без ошибок.');
  process.exit(0);
} catch (e) {
  console.error('ОШИБКА построения мира:', e);
  process.exit(1);
}
