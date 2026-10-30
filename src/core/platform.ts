/** Тач-режим: основной указатель — палец. Для проверки на ПК: добавить ?touch=1 к адресу. */
export function isTouchDevice(): boolean {
  if (new URLSearchParams(window.location.search).get('touch') === '1') return true;
  return window.matchMedia('(pointer: coarse)').matches;
}

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function isAudioAvailable(): boolean {
  return 'AudioContext' in window || 'webkitAudioContext' in window;
}

/** Полный экран и горизонтальная ориентация. Работает только из обработчика нажатия; ошибки не критичны. */
export async function enterImmersive(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch {
    /* браузер не разрешил — играем в обычном окне */
  }
  try {
    const orientation = screen.orientation as unknown as { lock?: (o: string) => Promise<void> };
    await orientation.lock?.('landscape');
  } catch {
    /* не поддерживается — не страшно */
  }
}

export async function leaveImmersive(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    /* ignore */
  }
}
