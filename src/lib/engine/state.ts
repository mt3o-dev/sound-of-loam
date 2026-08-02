// System state [node:cb3ae8cf] — the seed + parameter set that defines a
// soundscape at a moment. This is the unit that later slices save to the custom
// file format, reload, render to MP3, and share. Built seed-driven from day one
// [node:d5caec8d] so those slices need no engine rewrite.

import type { ScaleName } from './scale';

/** Bumped when the state shape or engine semantics change [node:0857d056]. */
export const ENGINE_VERSION = 1;

/** The four macro nudges [node:b6e6d5e3], each normalized 0..1. */
export interface Macros {
  /** how many melodic events occur */
  density: number;
  /** filter openness / spectral tilt */
  brightness: number;
  /** LFO depth / stereo & timbral movement */
  motion: number;
  /** scale + register colour (calm ↔ restless) */
  mood: number;
}

export interface SystemState {
  seed: number;
  macros: Macros;
  scale: ScaleName;
  rootMidi: number;
  engineVersion: number;
}

export function defaultMacros(): Macros {
  return { density: 0.4, brightness: 0.5, motion: 0.4, mood: 0.3 };
}

export function defaultState(seed = 0x5eed): SystemState {
  return {
    seed: seed >>> 0,
    macros: defaultMacros(),
    scale: 'minorPentatonic',
    rootMidi: 48, // C3 drone root
    engineVersion: ENGINE_VERSION,
  };
}

/** Mood presets (FR-005) — macro value-sets the engine drifts toward. */
export const MOOD_PRESETS: Record<string, Macros> = {
  Calm: { density: 0.2, brightness: 0.35, motion: 0.15, mood: 0.15 },
  Restless: { density: 0.75, brightness: 0.7, motion: 0.7, mood: 0.85 },
  Deep: { density: 0.35, brightness: 0.2, motion: 0.25, mood: 0.1 },
  Bright: { density: 0.5, brightness: 0.85, motion: 0.45, mood: 0.7 },
};
