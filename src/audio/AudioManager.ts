import type { AudioConfig, SoundName } from '../engine/types.ts';

/**
 * Audio is entirely optional and entirely modular.
 *
 * Every cue has a synthesised fallback built from oscillators, so the game
 * ships with a full sound design and zero asset files. Point any cue at a URL
 * in the config and that sample is used instead; if it fails to load we quietly
 * fall back to the synth. Nothing here ever throws into the game loop.
 */

type Envelope = {
  freq: number;
  type?: OscillatorType;
  duration?: number;
  gain?: number;
  attack?: number;
  sweepTo?: number;
  delay?: number;
  detune?: number;
};

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicNodes: AudioNode[] = [];
  private musicElement: HTMLAudioElement | null = null;
  private buffers = new Map<SoundName, AudioBuffer | null>();
  private failed = new Set<SoundName>();
  private config: AudioConfig;
  private muted = false;
  private musicPlaying = false;
  private lastPlayed = new Map<SoundName, number>();

  constructor(config: AudioConfig) {
    this.config = config;
  }

  setConfig(config: AudioConfig): void {
    this.config = config;
    this.applyVolumes();
    if (!config.enabled) this.stopMusic();
  }

  get enabled(): boolean {
    return this.config.enabled && !this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyVolumes();
    if (muted) this.stopMusic();
  }

  /** Must be called from a user gesture before anything will be audible. */
  unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyVolumes();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private applyVolumes(): void {
    if (!this.master || !this.sfxBus || !this.musicBus || !this.ctx) return;
    const now = this.ctx.currentTime;
    const master = this.enabled ? clamp01(this.config.masterVolume) : 0;
    this.master.gain.setTargetAtTime(master, now, 0.02);
    this.sfxBus.gain.setTargetAtTime(clamp01(this.config.sfxVolume), now, 0.02);
    this.musicBus.gain.setTargetAtTime(clamp01(this.config.musicVolume) * 0.5, now, 0.2);
    if (this.musicElement) this.musicElement.volume = master * clamp01(this.config.musicVolume);
  }

  /* ------------------------------------------------------------------ cues */

  play(name: SoundName): void {
    if (!this.enabled) return;
    // Rapid hover events shouldn't machine-gun the mixer.
    const now = performance.now();
    const min = name === 'hover' ? 45 : 20;
    if (now - (this.lastPlayed.get(name) ?? 0) < min) return;
    this.lastPlayed.set(name, now);

    const url = this.config.sources[name];
    if (url && !this.failed.has(name)) {
      void this.playSample(name, url);
      return;
    }
    this.synth(name);
  }

  private async playSample(name: SoundName, url: string): Promise<void> {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return this.synth(name);
    try {
      let buffer = this.buffers.get(name);
      if (buffer === undefined) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`status ${response.status}`);
        buffer = await ctx.decodeAudioData(await response.arrayBuffer());
        this.buffers.set(name, buffer);
      }
      if (!buffer) throw new Error('empty buffer');
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.sfxBus);
      source.start();
    } catch {
      // A missing or broken asset must never break the game — use the synth.
      this.failed.add(name);
      this.synth(name);
    }
  }

  /* --------------------------------------------------------------- synthesis */

  private synth(name: SoundName): void {
    switch (name) {
      case 'hover':
        this.tone({ freq: 1180, type: 'sine', duration: 0.06, gain: 0.05, attack: 0.005 });
        break;
      case 'click':
        this.tone({ freq: 520, type: 'triangle', duration: 0.05, gain: 0.09, sweepTo: 720 });
        break;
      case 'select':
        this.tone({ freq: 340, type: 'triangle', duration: 0.16, gain: 0.12, sweepTo: 680 });
        this.tone({ freq: 680, type: 'sine', duration: 0.22, gain: 0.06, delay: 0.05 });
        break;
      case 'caseOpen':
        this.noise({ duration: 0.5, gain: 0.09, from: 400, to: 4200 });
        this.tone({ freq: 120, type: 'sawtooth', duration: 0.45, gain: 0.09, sweepTo: 520 });
        break;
      case 'eliminate':
        this.tone({ freq: 420, type: 'square', duration: 0.14, gain: 0.05, sweepTo: 180 });
        break;
      case 'reveal':
        this.chord([523.25, 659.25, 783.99], { duration: 0.7, gain: 0.07, type: 'sine' });
        break;
      case 'revealBig':
        this.chord([523.25, 659.25, 783.99, 1046.5], { duration: 1.5, gain: 0.1, type: 'sine' });
        this.tone({ freq: 65, type: 'sine', duration: 1.1, gain: 0.22 });
        this.noise({ duration: 1.2, gain: 0.05, from: 2000, to: 9000 });
        break;
      case 'phone':
        for (let i = 0; i < 2; i++) {
          this.tone({ freq: 880, type: 'square', duration: 0.32, gain: 0.05, delay: i * 0.8 });
          this.tone({ freq: 660, type: 'square', duration: 0.32, gain: 0.05, delay: i * 0.8 + 0.36 });
        }
        break;
      case 'offer':
        this.chord([98, 146.83, 196], { duration: 2.2, gain: 0.11, type: 'sawtooth', attack: 0.5 });
        break;
      case 'deal':
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
          this.tone({ freq, type: 'triangle', duration: 0.5, gain: 0.11, delay: i * 0.09 }),
        );
        break;
      case 'noDeal':
        this.tone({ freq: 150, type: 'sawtooth', duration: 0.45, gain: 0.16, sweepTo: 60 });
        this.noise({ duration: 0.3, gain: 0.07, from: 1800, to: 200 });
        break;
      case 'tick':
        this.tone({ freq: 1500, type: 'square', duration: 0.03, gain: 0.05 });
        break;
      case 'win':
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) =>
          this.tone({ freq, type: 'triangle', duration: 0.9, gain: 0.12, delay: i * 0.11 }),
        );
        this.noise({ duration: 1.6, gain: 0.05, from: 3000, to: 10000 });
        break;
      case 'loss':
        [392, 349.23, 293.66, 220].forEach((freq, i) =>
          this.tone({ freq, type: 'sine', duration: 0.7, gain: 0.11, delay: i * 0.16 }),
        );
        break;
      default:
        break;
    }
  }

  private tone(env: Envelope): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return;
    try {
      const start = ctx.currentTime + (env.delay ?? 0);
      const duration = env.duration ?? 0.3;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = env.type ?? 'sine';
      osc.frequency.setValueAtTime(env.freq, start);
      if (env.detune) osc.detune.setValueAtTime(env.detune, start);
      if (env.sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, env.sweepTo), start + duration);

      const peak = env.gain ?? 0.1;
      const attack = env.attack ?? 0.008;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain).connect(this.sfxBus);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    } catch {
      /* audio is decorative — never let it surface */
    }
  }

  private chord(freqs: number[], env: Omit<Envelope, 'freq'>): void {
    freqs.forEach((freq, i) => this.tone({ ...env, freq, delay: (env.delay ?? 0) + i * 0.012 }));
  }

  private noise(opts: { duration: number; gain: number; from: number; to: number }): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return;
    try {
      const frames = Math.floor(ctx.sampleRate * opts.duration);
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 0.8;
      filter.frequency.setValueAtTime(opts.from, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), ctx.currentTime + opts.duration);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(opts.gain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + opts.duration);

      source.connect(filter).connect(gain).connect(this.sfxBus);
      source.start();
    } catch {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------------ music */

  startMusic(): void {
    if (!this.enabled || this.musicPlaying) return;
    this.musicPlaying = true;

    if (this.config.musicUrl) {
      try {
        const audio = new Audio(this.config.musicUrl);
        audio.loop = true;
        audio.volume = clamp01(this.config.masterVolume) * clamp01(this.config.musicVolume);
        audio.addEventListener('error', () => {
          this.musicElement = null;
          this.startAmbience();
        });
        void audio.play().catch(() => {
          this.musicElement = null;
          this.startAmbience();
        });
        this.musicElement = audio;
        return;
      } catch {
        this.musicElement = null;
      }
    }
    this.startAmbience();
  }

  /** A slow, low pad so a game with no music assets still has atmosphere. */
  private startAmbience(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.musicBus) return;
    try {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 3;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05;
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();

      const pad = ctx.createGain();
      pad.gain.value = 0.0001;
      pad.gain.setTargetAtTime(0.16, ctx.currentTime, 3);

      for (const [freq, detune] of [
        [55, -6],
        [82.4, 5],
        [110, 0],
        [164.8, 8],
      ]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        osc.detune.value = detune;
        osc.connect(filter);
        osc.start();
        this.musicNodes.push(osc);
      }

      filter.connect(pad).connect(this.musicBus);
      this.musicNodes.push(lfo, filter, pad);
    } catch {
      /* ignore */
    }
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicElement) {
      try {
        this.musicElement.pause();
      } catch {
        /* ignore */
      }
      this.musicElement = null;
    }
    for (const node of this.musicNodes) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.musicNodes = [];
  }

  dispose(): void {
    this.stopMusic();
    try {
      void this.ctx?.close();
    } catch {
      /* ignore */
    }
    this.ctx = null;
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
