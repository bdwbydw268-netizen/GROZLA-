// Web Audio API Generative AI Music Synthesizer
// Produces relaxing, harmonic, melodic tunes across genres (Lo-Fi, Synthwave, Acoustic, Ambient, Romantic)

class AiMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentGenre = 'lofi';
  private timerId: any = null;
  private tempo = 75; // BPM
  private currentStep = 0;
  private gainNode: GainNode | null = null;
  private onTickCallback: ((time: number) => void) | null = null;
  private startTime = 0;
  private pausedAt = 0;
  private duration = 180; // 3 minutes default

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Pentatonic & Minor scale frequencies for pleasing melodies
  private SCALES: Record<string, number[]> = {
    lofi: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25], // C Major / A Minor pentatonic
    synthwave: [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00], // A Minor
    acoustic: [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88], // G Major
    romantic: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25], // C Minor harmonic
    ambient: [130.81, 164.81, 196.00, 246.94, 261.63, 329.63, 392.00, 493.88] // Cmaj7 open
  };

  private CHORDS: Record<string, number[][]> = {
    lofi: [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [110.00, 130.81, 164.81, 196.00], // Am7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [123.47, 146.83, 174.61, 220.00]  // G7
    ],
    synthwave: [
      [110.00, 130.81, 164.81], // Am
      [87.31, 110.00, 130.81],  // F
      [130.81, 164.81, 196.00], // C
      [98.00, 123.47, 146.83]   // G
    ],
    acoustic: [
      [98.00, 123.47, 146.83, 196.00],  // G
      [110.00, 130.81, 164.81, 220.00], // Am
      [130.81, 164.81, 196.00, 261.63], // C
      [146.83, 185.00, 220.00, 293.66]  // D
    ],
    romantic: [
      [130.81, 155.56, 196.00], // Cm
      [103.83, 130.81, 155.56], // Ab
      [116.54, 146.83, 174.61], // Bb
      [98.00, 123.47, 146.83]   // G
    ],
    ambient: [
      [65.41, 130.81, 196.00, 246.94],
      [55.00, 110.00, 164.81, 220.00],
      [73.42, 146.83, 220.00, 261.63]
    ]
  };

  public setGenre(genre: string, durationSec = 180) {
    this.currentGenre = genre;
    this.duration = durationSec;
    if (genre === 'synthwave') this.tempo = 110;
    else if (genre === 'lofi') this.tempo = 75;
    else if (genre === 'acoustic') this.tempo = 85;
    else if (genre === 'romantic') this.tempo = 68;
    else this.tempo = 60;
  }

  public start(onTick?: (currentTime: number) => void) {
    if (this.isPlaying) return;
    const ctx = this.getAudioContext();
    this.isPlaying = true;
    this.onTickCallback = onTick || null;
    this.startTime = ctx.currentTime - this.pausedAt;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    this.gainNode.connect(ctx.destination);

    const stepIntervalMs = (60 / this.tempo / 2) * 1000; // Eighth notes
    this.currentStep = 0;

    const playStep = () => {
      if (!this.isPlaying) return;
      const now = ctx.currentTime;
      const elapsed = Math.min(this.duration, now - this.startTime);

      if (this.onTickCallback) {
        this.onTickCallback(elapsed);
      }

      if (elapsed >= this.duration) {
        this.stop();
        return;
      }

      // Play Chord every 8 steps
      if (this.currentStep % 8 === 0) {
        const chordList = this.CHORDS[this.currentGenre] || this.CHORDS.lofi;
        const chordIndex = Math.floor(this.currentStep / 8) % chordList.length;
        this.playChord(chordList[chordIndex], 2.2);
      }

      // Play Melodic Note every 1-2 steps
      if (Math.random() > 0.25) {
        const scale = this.SCALES[this.currentGenre] || this.SCALES.lofi;
        const note = scale[Math.floor(Math.random() * scale.length)];
        this.playMelodyNote(note, 0.6);
      }

      // Play Soft Kick & Snare/HiHat
      if (this.currentStep % 4 === 0) {
        this.playDrum('kick');
      } else if (this.currentStep % 4 === 2) {
        this.playDrum('snare');
      }
      if (this.currentStep % 2 === 1 && Math.random() > 0.3) {
        this.playDrum('hihat');
      }

      this.currentStep++;
      this.timerId = setTimeout(playStep, stepIntervalMs);
    };

    playStep();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.ctx) {
      this.pausedAt = this.ctx.currentTime - this.startTime;
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.pausedAt = 0;
    this.currentStep = 0;
  }

  public seek(seconds: number) {
    this.pausedAt = Math.max(0, Math.min(seconds, this.duration));
    if (this.ctx) {
      this.startTime = this.ctx.currentTime - this.pausedAt;
    }
  }

  private playChord(freqs: number[], duration: number) {
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;
    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = this.currentGenre === 'synthwave' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.gainNode!);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  private playMelodyNote(freq: number, duration: number) {
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = this.currentGenre === 'acoustic' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playDrum(type: 'kick' | 'snare' | 'hihat') {
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;

    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'snare') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'hihat') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'highpass' as any;
      osc.frequency.setValueAtTime(8000, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }
}

export const aiMusicEngine = new AiMusicEngine();
