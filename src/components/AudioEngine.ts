/**
 * Procedural Web Audio Synth for Lazy Parkour
 * Generates cozy lo-fi backing beats and comical lazy sound effects.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private musicVolume: GainNode | null = null;
  private sfxVolume: GainNode | null = null;
  private isMuted: boolean = false;
  private currentBeatInterval: any = null;
  private isMusicPlaying: boolean = false;
  
  // Lo-Fi Beat States
  private tempo: number = 72; // Slow chill tempo
  private currentStep: number = 0;
  // Dreamy chord progression: Cmaj7 -> Am7 -> Dm7 -> G13 (in G-key, soft and cozy)
  private chords = [
    [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C3, E3, G3, B3)
    [110.00, 130.81, 164.81, 196.00], // Am7   (A2, C3, E3, G3)
    [146.83, 174.61, 220.00, 261.63], // Dm7   (D3, F3, A3, C3)
    [98.00,  146.83, 185.00, 246.94], // G7/G13 (G2, D3, F#3, B3)
  ];
  private currentChordIndex: number = 0;

  constructor() {
    // Initialized on first user click to satisfy browser security policies
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);

      this.musicVolume = this.ctx.createGain();
      this.musicVolume.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.musicVolume.connect(this.masterVolume);

      this.sfxVolume = this.ctx.createGain();
      this.sfxVolume.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.sfxVolume.connect(this.masterVolume);

      this.startLofiNoise();
    } catch (e) {
      console.warn("Failed to initialize Web Audio API:", e);
    }
  }

  private startLofiNoise() {
    if (!this.ctx || !this.musicVolume) return;
    
    // Create soft crackle / vinyl sound using a custom buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // White noise with random popping crackles
      const rand = Math.random() * 2 - 1;
      let crackle = 0;
      if (Math.random() > 0.9995) {
        crackle = (Math.random() > 0.5 ? 1 : -1) * 0.15;
      }
      output[i] = rand * 0.01 + crackle * 0.1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter white noise to make it warmer/muffled
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicVolume);
    whiteNoise.start();
  }

  public setMasterVolume(vol: number) {
    this.init();
    if (!this.masterVolume) return;
    this.masterVolume.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx!.currentTime);
  }

  public setMusicVolume(vol: number) {
    this.init();
    if (!this.musicVolume) return;
    this.musicVolume.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx!.currentTime);
  }

  public toggleMute(): boolean {
    this.init();
    if (!this.masterVolume) return this.isMuted;
    this.isMuted = !this.isMuted;
    this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx!.currentTime);
    return this.isMuted;
  }

  public getMutedState() {
    return this.isMuted;
  }

  public startMusic() {
    this.init();
    if (!this.ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    
    // Ensure context is running (browser auto-suspends on load)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const stepDuration = 60 / this.tempo / 2; // Eighth notes
    this.currentStep = 0;
    this.currentChordIndex = 0;

    this.currentBeatInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state === 'suspended' || this.isMuted) return;
      this.playStep(this.ctx.currentTime);
    }, stepDuration * 1000);
  }

  public stopMusic() {
    if (this.currentBeatInterval) {
      clearInterval(this.currentBeatInterval);
      this.currentBeatInterval = null;
    }
    this.isMusicPlaying = false;
  }

  private playStep(time: number) {
    if (!this.ctx || !this.musicVolume) return;

    // Chord changes every 16 steps (8 beats)
    if (this.currentStep % 16 === 0) {
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
      this.playPadChord(this.chords[this.currentChordIndex], time, 60 / this.tempo * 4);
    }

    // Gentle lo-fi kick drum on steps 0, 8, 12
    if (this.currentStep % 8 === 0 || this.currentStep === 10) {
      this.playSoftKick(time);
    }

    // Warm soft snare/rim on step 4 and 12
    if (this.currentStep % 8 === 4) {
      this.playSoftSnare(time);
    }

    // Very soft acoustic keys/bells (melody) occasionally
    if (this.currentStep % 4 === 2 && Math.random() > 0.4) {
      const activeChord = this.chords[this.currentChordIndex];
      const randomNote = activeChord[Math.floor(Math.random() * activeChord.length)] * 2; // transpose up for melody
      this.playElectricTine(randomNote, time);
    }

    this.currentStep = (this.currentStep + 1) % 32;
  }

  // --- Cozy Synth Instruments ---

  private playPadChord(frequencies: number[], time: number, duration: number) {
    if (!this.ctx || !this.musicVolume) return;

    frequencies.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const lowpass = this.ctx!.createBiquadFilter();

      // Triangle wave is very soft
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      // Lowpass filter makes it extremely warm and muffled (lo-fi vibe)
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(350, time);
      lowpass.Q.setValueAtTime(1.0, time);

      gain.gain.setValueAtTime(0, time);
      // Gentle fade in
      gain.gain.linearRampToValueAtTime(0.06, time + 0.8);
      // Long fade out
      gain.gain.setValueAtTime(0.06, time + duration - 0.8);
      gain.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(this.musicVolume!);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  private playElectricTine(freq: number, time: number) {
    if (!this.ctx || !this.musicVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lowpass = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.04, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);

    osc.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.musicVolume);

    osc.start(time);
    osc.stop(time + 1.3);
  }

  private playSoftKick(time: number) {
    if (!this.ctx || !this.musicVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Deep bass punch sweeping down
    osc.frequency.setValueAtTime(90, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(this.musicVolume);

    osc.start(time);
    osc.stop(time + 0.21);
  }

  private playSoftSnare(time: number) {
    if (!this.ctx || !this.musicVolume) return;

    // Synthesized lo-fi rimshot/shaker
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(2.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicVolume);

    noiseSource.start(time);
    noiseSource.stop(time + 0.09);
  }

  // --- SFX Synthesizers ---

  public playSigh() {
    this.init();
    if (!this.ctx || !this.sfxVolume || this.isMuted) return;

    const time = this.ctx.currentTime;
    // Synthesis of a tired "aaahhhaaa..." sigh
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(130, time); // Low pitch masculine/guttural
    osc1.frequency.exponentialRampToValueAtTime(80, time + 0.7);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(133, time);
    osc2.frequency.exponentialRampToValueAtTime(81, time + 0.7);

    // Muffle the vocal sound to make it cozy
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(380, time);
    filter.frequency.exponentialRampToValueAtTime(220, time + 0.7);
    filter.Q.setValueAtTime(1.5, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolume);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.75);
    osc2.stop(time + 0.75);
  }

  public playFootstep() {
    this.init();
    if (!this.ctx || !this.sfxVolume || this.isMuted) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  public playJump() {
    this.init();
    if (!this.ctx || !this.sfxVolume || this.isMuted) return;

    const time = this.ctx.currentTime;
    // A soft comical "hup" grunt
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.15);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(time);
    osc.stop(time + 0.19);
  }

  public playBounce() {
    this.init();
    if (!this.ctx || !this.sfxVolume || this.isMuted) return;

    const time = this.ctx.currentTime;
    // A deep, satisfying "boooiiinnng" cushion spring sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, time);
    osc.frequency.linearRampToValueAtTime(150, time + 0.1);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.35);

    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxVolume);

    osc.start(time);
    osc.stop(time + 0.4);
  }

  public playCollect() {
    this.init();
    if (!this.ctx || !this.sfxVolume || this.isMuted) return;

    const time = this.ctx.currentTime;
    // Glassy coffee/coin chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, time); // A5
    osc1.frequency.setValueAtTime(1318.51, time + 0.08); // E6

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, time); // C6
    osc2.frequency.setValueAtTime(1567.98, time + 0.08); // G6

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxVolume);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.52);
    osc2.stop(time + 0.52);
  }

  public playSplat() {
    this.init();
    if (!this.ctx || !this.sfxVolume || this.isMuted) return;

    const time = this.ctx.currentTime;
    // Comedic "thud" for faceplants or long falls
    const osc = this.ctx.createOscillator();
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxVolume);

    noise.start(time);
    noise.stop(time + 0.22);

    // Also a low pitch grunt
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, time);
    const oscFilter = this.ctx.createBiquadFilter();
    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(110, time);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(this.sfxVolume);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  public playCheckpoint() {
    this.init();
    if (!this.ctx || !this.sfxVolume || this.isMuted) return;

    const time = this.ctx.currentTime;
    // A soft harp-like dream sound
    const frequencies = [261.63, 329.63, 392.00, 523.25, 659.25]; // C chord arpeggio
    frequencies.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time + idx * 0.08);

      gain.gain.setValueAtTime(0, time + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, time + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxVolume!);

      osc.start(time + idx * 0.08);
      osc.stop(time + idx * 0.08 + 0.4);
    });
  }
}

export const audioEngine = new AudioEngine();
