class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private musicTimer: number | null = null;
  private musicStep: number = 0;
  private isMusicPlaying: boolean = false;

  // Cheerful original 8-bit platformer melody (frequencies in Hz, 0 = rest)
  private readonly leadNotes: number[] = [
    523.25, 0, 659.25, 783.99, 0, 659.25, 587.33, 523.25,
    587.33, 659.25, 0, 523.25, 440.0, 0, 392.0, 0,
    523.25, 0, 659.25, 783.99, 880.0, 0, 783.99, 659.25,
    587.33, 659.25, 587.33, 493.88, 523.25, 0, 523.25, 0,
  ];

  private readonly bassNotes: number[] = [
    130.81, 0, 196.0, 0, 130.81, 0, 196.0, 0,
    146.83, 0, 220.0, 0, 130.81, 0, 196.0, 0,
    130.81, 0, 196.0, 0, 174.61, 0, 130.81, 0,
    196.0, 0, 146.83, 196.0, 130.81, 0, 130.81, 0,
  ];

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    if (this.muted) return;
    this.ensureContext();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (mute) {
      this.stopMusic();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume: number = 0.09,
    startTimeOffset: number = 0,
    slideToFreq?: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx || freq <= 0) return;

    const now = ctx.currentTime + startTimeOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq && slideToFreq > 0) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playNoise(duration: number, volume: number = 0.08): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  public startMusic(): void {
    if (this.muted || this.isMusicPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.isMusicPlaying = true;
    const tempoMs = 175;
    this.musicTimer = window.setInterval(() => {
      if (this.muted || !this.isMusicPlaying) return;
      const idx = this.musicStep % this.leadNotes.length;
      const lead = this.leadNotes[idx];
      const bass = this.bassNotes[idx];
      if (lead > 0) {
        this.playTone(lead, 0.13, 'square', 0.028);
      }
      if (bass > 0) {
        this.playTone(bass, 0.15, 'triangle', 0.045);
      }
      this.musicStep++;
    }, tempoMs);
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public playJump(): void {
    this.playTone(260, 0.16, 'square', 0.08, 0, 580);
  }

  public playCoin(): void {
    this.playTone(987.77, 0.07, 'square', 0.08, 0);
    this.playTone(1318.51, 0.22, 'square', 0.08, 0.07);
  }

  public playBump(): void {
    this.playTone(170, 0.09, 'triangle', 0.11, 0, 95);
  }

  public playBreak(): void {
    this.playNoise(0.14, 0.11);
    this.playTone(220, 0.1, 'square', 0.06, 0, 90);
  }

  public playStomp(): void {
    this.playTone(340, 0.08, 'square', 0.1, 0, 140);
    this.playTone(520, 0.09, 'triangle', 0.08, 0.04, 700);
  }

  public playHurt(): void {
    this.playTone(320, 0.14, 'sawtooth', 0.09, 0, 140);
    this.playTone(220, 0.2, 'sawtooth', 0.09, 0.12, 95);
  }

  public playQuestionTrigger(): void {
    this.playTone(523.25, 0.07, 'square', 0.09, 0);
    this.playTone(659.25, 0.07, 'square', 0.09, 0.07);
    this.playTone(783.99, 0.09, 'square', 0.09, 0.14);
    this.playTone(1046.5, 0.18, 'square', 0.09, 0.22);
  }

  public playCorrect(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.playTone(n, i === notes.length - 1 ? 0.28 : 0.1, 'square', 0.09, i * 0.085);
    });
  }

  public playWrong(): void {
    this.playTone(210, 0.14, 'sawtooth', 0.08, 0, 175);
    this.playTone(165, 0.22, 'sawtooth', 0.08, 0.14, 130);
  }

  public playCheckpoint(): void {
    this.playTone(440, 0.08, 'triangle', 0.1, 0);
    this.playTone(554.37, 0.08, 'triangle', 0.1, 0.08);
    this.playTone(659.25, 0.18, 'triangle', 0.1, 0.16);
  }

  public playFlagpole(): void {
    this.playTone(880, 0.55, 'square', 0.07, 0, 330);
  }

  public playFirework(): void {
    this.playNoise(0.22, 0.08);
    this.playTone(720, 0.14, 'triangle', 0.05, 0.02, 240);
  }

  public playVictoryFanfare(): void {
    const sequence: Array<[number, number, number]> = [
      [392.0, 0.11, 0],
      [523.25, 0.11, 0.11],
      [659.25, 0.11, 0.22],
      [783.99, 0.22, 0.33],
      [659.25, 0.11, 0.56],
      [783.99, 0.42, 0.68],
      [1046.5, 0.55, 0.92],
    ];
    sequence.forEach(([freq, dur, off]) => {
      this.playTone(freq, dur, 'square', 0.09, off);
      this.playTone(freq / 2, dur, 'triangle', 0.07, off);
    });
  }
}

export const retroAudio = new RetroAudioEngine();
