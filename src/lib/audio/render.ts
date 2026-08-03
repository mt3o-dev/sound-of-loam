// Deterministic offline render (FR-022): re-run the engine's generative loop against
// an OfflineAudioContext with a FIXED timestep, so a given SystemState + duration
// renders the same audio every time [node:cb3ae8cf]. Reuses the same voices/primitives
// as the live engine (kept in sync via those shared modules); the ~15-line schedule
// loop mirrors Engine.tick but is driven by simulated time instead of a wall clock.
// Browser-only (OfflineAudioContext) — verified end-to-end, not in Node unit tests.

import { mulberry32 } from '../engine/prng';
import { OUParam } from '../engine/ou';
import { scaleFrequencies } from '../engine/scale';
import { createBus } from '../engine/audioGraph';
import { Drone, Texture, playNote } from '../engine/voices';
import { moodToTonality } from '../engine/engine';
import { type SystemState } from '../engine/state';

export async function renderStateToBuffer(
  state: SystemState,
  seconds: number,
  sampleRate = 44100,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext({
    numberOfChannels: 2,
    length: Math.ceil(seconds * sampleRate),
    sampleRate,
  });
  const rng = mulberry32(state.seed);
  const bus = createBus(ctx as unknown as AudioContext, rng);
  const mk = (mu: number) =>
    new OUParam({ mu, theta: 0.25, sigma: 0.12, min: 0, max: 1, biasTau: 5 }, mu);
  const params = {
    density: mk(state.macros.density),
    brightness: mk(state.macros.brightness),
    motion: mk(state.macros.motion),
    mood: mk(state.macros.mood),
  };

  bus.master.gain.setValueAtTime(0.0001, 0);
  bus.master.gain.linearRampToValueAtTime(0.9, Math.min(2, seconds * 0.1));

  let tonality = moodToTonality(params.mood.value);
  let currentRoot = tonality.rootMidi;
  const drone = new Drone(bus, tonality.rootMidi, rng);
  const texture = new Texture(bus, rng);
  let nextNoteTime = 0.5;
  const dt = 0.05;

  for (let t = 0; t < seconds; t += dt) {
    for (const p of Object.values(params)) p.step(dt, rng);
    const density = params.density.value;
    const brightness = params.brightness.value;
    const motion = params.motion.value;
    const mood = params.mood.value;

    drone.update(t, brightness, motion);
    texture.update(t, brightness, motion);
    tonality = moodToTonality(mood);
    if (tonality.rootMidi !== currentRoot) {
      currentRoot = tonality.rootMidi;
      drone.setRoot(t, tonality.rootMidi);
    }
    const pitches = scaleFrequencies(tonality.rootMidi + 12, tonality.scale, 3);
    while (nextNoteTime < t + dt) {
      const freq = pitches[Math.floor(rng() * pitches.length)];
      playNote(bus, freq, nextNoteTime, { brightness, motion, velocity: 0.6 + rng() * 0.4 });
      nextNoteTime += (6.0 - density * 4.5) * (0.5 + rng() * 1.5);
    }
  }
  // Gentle fade out.
  bus.master.gain.setTargetAtTime(0.0001, Math.max(0, seconds - 1), 0.3);
  return ctx.startRendering();
}

export function audioBufferToChannels(buf: AudioBuffer): Float32Array[] {
  const chans: Float32Array[] = [];
  for (let c = 0; c < buf.numberOfChannels; c++) chans.push(buf.getChannelData(c));
  return chans;
}

/** Decode an arbitrary encoded audio Blob (e.g. a MediaRecorder capture) to channels. */
export async function blobToChannels(blob: Blob): Promise<{ channels: Float32Array[]; sampleRate: number }> {
  const ctx = new AudioContext();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    return { channels: audioBufferToChannels(buf), sampleRate: buf.sampleRate };
  } finally {
    void ctx.close();
  }
}
