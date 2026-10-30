interface AudioWindow {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Процедурный звук на Web Audio API: низкий гул, сетевой фон ламп и шум вентиляции.
 * Аудиофайлов нет — ничего не нужно скачивать. Контекст создаётся только по жесту пользователя.
 */
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private volume = 0.7;

  /** Вызывать из обработчика нажатия (требование браузеров). */
  async start(): Promise<void> {
    if (!this.ctx) {
      const w = window as unknown as AudioWindow;
      const Ctor = w.AudioContext ?? w.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume * this.volume;
      this.master.connect(this.ctx.destination);
      this.buildAmbience(this.ctx, this.master);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  setVolume(volume: number): void {
    this.volume = volume;
    if (this.ctx && this.master) {
      // квадратичная кривая: ползунок ощущается линейнее на слух
      this.master.gain.setTargetAtTime(volume * volume, this.ctx.currentTime, 0.05);
    }
  }

  suspend(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  private buildAmbience(ctx: AudioContext, out: AudioNode): void {
    const bus = ctx.createGain();
    bus.gain.value = 0.5;
    bus.connect(out);

    // Низкий гул: две почти совпадающие частоты дают медленные биения
    for (const [freq, level] of [
      [43, 0.18],
      [43.8, 0.18],
      [86.5, 0.04],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = level;
      osc.connect(gain).connect(bus);
      osc.start();
    }

    // Гудение ламп: пила 100 Гц через фильтр, громкость медленно «плавает»
    const hum = ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.value = 100;
    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 380;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.02;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.012;
    lfo.connect(lfoDepth).connect(humGain.gain);
    hum.connect(humFilter).connect(humGain).connect(bus);
    hum.start();
    lfo.start();

    // Шум вентиляции
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 260;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;
    noise.connect(noiseFilter).connect(noiseGain).connect(bus);
    noise.start();
  }
}

export const audio = new AudioManager();
