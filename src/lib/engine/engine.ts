// The engine orchestrator: ties the seed-driven primitives to the audio graph
// and the scheduler. Macros set the *mean* each parameter reverts toward; the
// parameters drift autonomously (OU) and decay any pointer/user bias back toward
// that mean — so influence is bias, never control [node:58044d71] [node:4e6bb635].

import { mulberry32, type Rng } from './prng';
import { OUParam } from './ou';
import { scaleFrequencies, type ScaleName } from './scale';
import { createBus, type AudioBus } from './audioGraph';
import { Drone, Texture, playNote } from './voices';
import { LookAheadScheduler } from './scheduler';
import { defaultState, type Macros, type SystemState } from './state';

type MacroName = keyof Macros;

/** Map mood 0..1 → (scale, root). Lower = darker/lower, higher = brighter/higher. */
function moodToTonality(mood: number): { scale: ScaleName; rootMidi: number } {
  if (mood < 0.34) return { scale: 'minorPentatonic', rootMidi: 46 };
  if (mood < 0.67) return { scale: 'dorian', rootMidi: 48 };
  return { scale: 'lydian', rootMidi: 50 };
}

export class Engine {
  private ctx: AudioContext | null = null;
  private bus: AudioBus | null = null;
  private drone: Drone | null = null;
  private texture: Texture | null = null;
  private scheduler: LookAheadScheduler | null = null;
  private rng: Rng;

  private params: Record<MacroName, OUParam>;
  private nextNoteTime = 0;
  private currentRoot = 46;

  state: SystemState;

  constructor(state: SystemState = defaultState()) {
    this.state = state;
    this.rng = mulberry32(state.seed);
    const mk = (mu: number) =>
      new OUParam({ mu, theta: 0.25, sigma: 0.12, min: 0, max: 1, biasTau: 5 }, mu);
    this.params = {
      density: mk(state.macros.density),
      brightness: mk(state.macros.brightness),
      motion: mk(state.macros.motion),
      mood: mk(state.macros.mood),
    };
  }

  /** MUST be called from a user gesture — creates & resumes the AudioContext
   *  [node:5153e9f6]. Anonymous, no network [node:c1b0d7c2]. */
  async start(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.bus = createBus(this.ctx, this.rng);
    const tonality = moodToTonality(this.params.mood.value);
    this.currentRoot = tonality.rootMidi;
    this.drone = new Drone(this.bus, tonality.rootMidi, this.rng);
    this.texture = new Texture(this.bus, this.rng);
    this.nextNoteTime = this.ctx.currentTime + 0.5;

    // Fade master in to avoid a click.
    this.bus.master.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.bus.master.gain.linearRampToValueAtTime(0.9, this.ctx.currentTime + 2.0);

    this.scheduler = new LookAheadScheduler(this.ctx, (now, horizon, dt) =>
      this.tick(now, horizon, dt),
    );
    this.scheduler.start();
  }

  stop(): void {
    this.scheduler?.stop();
    if (this.bus && this.ctx) {
      this.bus.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.5);
    }
  }

  get running(): boolean {
    return !!this.scheduler?.running;
  }

  /** User slider: move the mean this parameter reverts toward. */
  setMacro(name: MacroName, value: number): void {
    const v = Math.min(1, Math.max(0, value));
    this.state.macros[name] = v;
    this.params[name].setMu(v);
  }

  /** Transient nudge (e.g. pointer): adds decaying bias. */
  nudge(name: MacroName, delta: number): void {
    this.params[name].nudge(delta);
  }

  /** Pointer X-Y pad: x → brightness bias, y → density bias. */
  nudgeXY(x: number, y: number): void {
    this.nudge('brightness', (x - 0.5) * 0.5);
    this.nudge('density', (0.5 - y) * 0.5);
    this.nudge('motion', (Math.abs(x - 0.5) + Math.abs(y - 0.5)) * 0.15);
  }

  /** Live snapshot of the four parameter values (for a UI indicator). */
  snapshot(): Macros {
    return {
      density: this.params.density.value,
      brightness: this.params.brightness.value,
      motion: this.params.motion.value,
      mood: this.params.mood.value,
    };
  }

  private tick(now: number, horizon: number, dt: number): void {
    if (!this.ctx || !this.bus || !this.drone || !this.texture) return;
    // Advance autonomous drift + bias decay.
    const step = Math.max(dt, 0.001);
    for (const p of Object.values(this.params)) p.step(step, this.rng);

    const density = this.params.density.value;
    const brightness = this.params.brightness.value;
    const motion = this.params.motion.value;
    const mood = this.params.mood.value;

    this.drone.update(now, brightness, motion);
    this.texture.update(now, brightness, motion);

    // Retune the tonality slowly as mood drifts.
    const tonality = moodToTonality(mood);
    if (tonality.rootMidi !== this.currentRoot) {
      this.currentRoot = tonality.rootMidi;
      this.drone.setRoot(now, tonality.rootMidi);
    }
    const pitches = scaleFrequencies(tonality.rootMidi + 12, tonality.scale, 3);

    // Schedule sparse melodic notes up to the horizon.
    // Higher density → shorter gaps between notes.
    while (this.nextNoteTime < horizon) {
      const freq = pitches[Math.floor(this.rng() * pitches.length)];
      playNote(this.bus, freq, this.nextNoteTime, {
        brightness,
        motion,
        velocity: 0.6 + this.rng() * 0.4,
      });
      const baseGap = 6.0 - density * 4.5; // 6s (sparse) → 1.5s (dense)
      const jitter = 0.5 + this.rng() * 1.5;
      this.nextNoteTime += baseGap * jitter;
    }
  }
}
