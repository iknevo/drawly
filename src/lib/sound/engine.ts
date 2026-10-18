import type { SoundName } from "./types";

const ALARM_RINGS = 7;
const ALARM_INTERVAL_MS = 750;

type ToneModule = typeof import("tone");
type TonePolySynth = import("tone").PolySynth;
type ToneVolume = import("tone").Volume;
type ToneReverb = import("tone").Reverb;

const PENTATONIC_SCALE = ["C", "D", "E", "G", "A"] as const;
const BASE_OCTAVE = 3;
const CHORD_WINDOW_MS = 100;
const TRIAD_OFFSETS = [0, 2, 4] as const;

class SoundEngine {
  private tone: ToneModule | null = null;
  private initializing: Promise<void> | null = null;
  private initialized = false;
  private muted = false;
  private volume = 1;

  private master: ToneVolume | null = null;
  private reverb: ToneReverb | null = null;

  private blip: TonePolySynth | null = null;
  private soft: TonePolySynth | null = null;
  private chime: TonePolySynth | null = null;
  private bass: TonePolySynth | null = null;
  private tick: TonePolySynth | null = null;
  private success: TonePolySynth | null = null;

  private currentNoteIndex = 0;
  private chordWindowStart: number | null = null;
  private chordStep = 0;
  private chordBaseIndex = 0;
  private chordBaseOctave = BASE_OCTAVE;

  private alarmTimer: ReturnType<typeof setTimeout> | null = null;

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isReady(): boolean {
    return this.initialized;
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (!this.master) return;
    this.master.volume.value = this.dbFor(volume);
  }

  private dbFor(volume: number): number {
    return volume === 0 ? -Infinity : -40 + volume * 40;
  }

  private async ensureTone(): Promise<ToneModule> {
    if (!this.tone) {
      this.tone = await import("tone");
    }
    return this.tone;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      const Tone = await this.ensureTone();
      await Tone.start();

      this.master = new Tone.Volume(this.dbFor(this.volume)).toDestination();
      this.reverb = new Tone.Reverb({ decay: 2.2, wet: 0.3 }).connect(this.master);

      this.blip = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
      }).connect(this.master);

      this.soft = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.002, decay: 0.15, sustain: 0.05, release: 0.3 },
      }).connect(this.reverb);

      this.chime = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.1, release: 1.2 },
      }).connect(this.reverb);

      this.bass = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.02, decay: 0.4, sustain: 0.1, release: 0.8 },
      }).connect(this.master);

      this.tick = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "square" },
        envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
      }).connect(this.master);

      this.success = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.08, decay: 0.5, sustain: 0.2, release: 1.6 },
      }).connect(this.reverb);

      this.initialized = true;
    })();

    try {
      await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  private nextNote(octaveOffset: number): string {
    const now = Date.now();
    const inChordWindow =
      this.chordWindowStart !== null && now - this.chordWindowStart <= CHORD_WINDOW_MS;

    if (!inChordWindow) {
      this.chordWindowStart = now;
      this.chordStep = 0;
      this.chordBaseIndex = this.currentNoteIndex % PENTATONIC_SCALE.length;
      this.chordBaseOctave = BASE_OCTAVE + octaveOffset;
    }

    const scaleIndex = (this.chordBaseIndex + this.chordStep) % PENTATONIC_SCALE.length;
    const note = `${PENTATONIC_SCALE[scaleIndex]}${this.chordBaseOctave}`;

    this.chordStep++;
    this.currentNoteIndex = (this.currentNoteIndex + 1) % (PENTATONIC_SCALE.length * 2);

    return note;
  }

  private randomNote(octave: number): string {
    const note = PENTATONIC_SCALE[Math.floor(Math.random() * PENTATONIC_SCALE.length)];
    return `${note}${octave}`;
  }

  private ringAlarm(Tone: ToneModule): void {
    let ring = 0;
    const ringOnce = () => {
      const at = Tone.now() + 0.02;
      this.chime?.triggerAttackRelease("E5", "8n", at, 0.5);
      this.chime?.triggerAttackRelease("A5", "8n", at + 0.12, 0.45);
      ring += 1;
      if (ring < ALARM_RINGS) {
        this.alarmTimer = setTimeout(ringOnce, ALARM_INTERVAL_MS);
      } else {
        this.alarmTimer = null;
      }
    };
    ringOnce();
  }

  stopAlarm(): void {
    if (this.alarmTimer) {
      clearTimeout(this.alarmTimer);
      this.alarmTimer = null;
    }
    this.chime?.releaseAll();
  }

  async play(name: SoundName): Promise<void> {
    if (this.muted) return;

    await this.initialize();
    const Tone = this.tone;
    if (!Tone) return;

    const now = Tone.now();

    switch (name) {
      case "hover":
        this.blip?.triggerAttackRelease(this.randomNote(6), "64n", now, 0.07);
        break;
      case "press":
      case "click":
        this.blip?.triggerAttackRelease(this.randomNote(6), "64n", now, 0.18);
        break;
      case "menu":
        this.blip?.triggerAttackRelease(this.randomNote(5), "64n", now, 0.16);
        break;
      case "option":
        this.blip?.triggerAttackRelease(this.randomNote(6), "64n", now, 0.18);
        break;
      case "tab":
        this.blip?.triggerAttackRelease("D6", "32n", now, 0.2);
        break;
      case "toggle":
        this.tick?.triggerAttackRelease(this.randomNote(5), "32n", now, 0.12);
        break;
      case "nav":
        this.soft?.triggerAttackRelease(this.randomNote(5), "32n", now, 0.2);
        break;
      case "nav-external":
        this.soft?.triggerAttackRelease("E5", "32n", now, 0.22);
        this.soft?.triggerAttackRelease("G5", "32n", now + 0.07, 0.22);
        break;
      case "open":
        this.soft?.triggerAttackRelease("G5", "64n", now, 0.2);
        this.soft?.triggerAttackRelease("A5", "32n", now + 0.05, 0.18);
        break;
      case "pause":
        this.blip?.triggerAttackRelease("A4", "32n", now, 0.22);
        break;
      case "start":
        this.soft?.triggerAttackRelease(this.nextNote(0.5), "32n", now, 0.25);
        break;
      case "add":
        this.soft?.triggerAttackRelease(this.nextNote(0), "16n", now, 0.3);
        break;
      case "alarm":
        this.stopAlarm();
        this.ringAlarm(Tone);
        break;
      case "success": {
        const baseIndex = this.currentNoteIndex % PENTATONIC_SCALE.length;
        TRIAD_OFFSETS.forEach((offset, index) => {
          const position = baseIndex + offset;
          const note = PENTATONIC_SCALE[position % PENTATONIC_SCALE.length];
          const octave = BASE_OCTAVE + Math.floor(position / PENTATONIC_SCALE.length);
          this.success?.triggerAttackRelease(`${note}${octave}`, "4n", now + index * 0.09, 0.28);
        });
        this.currentNoteIndex = (this.currentNoteIndex + 1) % (PENTATONIC_SCALE.length * 2);
        break;
      }
      case "reset":
        this.bass?.triggerAttackRelease(`G${BASE_OCTAVE}`, "16n", now, 0.5);
        this.bass?.triggerAttackRelease(`C${BASE_OCTAVE}`, "16n", now + 0.1, 0.5);
        break;
      case "delete":
        this.bass?.triggerAttackRelease(`C${BASE_OCTAVE - 1}`, "8n", now, 0.6);
        break;
      case "error":
        this.bass?.triggerAttackRelease(`D#${BASE_OCTAVE}`, "16n", now, 0.5);
        break;
    }
  }

  dispose() {
    this.stopAlarm();
    this.blip?.dispose();
    this.blip = null;
    this.soft?.dispose();
    this.soft = null;
    this.chime?.dispose();
    this.chime = null;
    this.bass?.dispose();
    this.bass = null;
    this.tick?.dispose();
    this.tick = null;
    this.success?.dispose();
    this.success = null;

    this.reverb?.dispose();
    this.reverb = null;
    this.master?.dispose();
    this.master = null;

    this.initialized = false;
  }
}

export const soundEngine = new SoundEngine();
