// The custom save-file format (.loam) — a self-contained, version-stamped JSON
// envelope [node:0857d056]. Pure + unit-tested; the UI wraps it with download/upload.

import { type SystemState } from './engine/state';

export const LOAM_MAGIC = 'sound-of-loam';
export const LOAM_FORMAT_VERSION = 1;

export interface LoamFile {
  magic: string;
  formatVersion: number;
  engineVersion: number;
  savedAt: number;
  state: SystemState;
}

export function toLoamFile(state: SystemState, now: number): string {
  const file: LoamFile = {
    magic: LOAM_MAGIC,
    formatVersion: LOAM_FORMAT_VERSION,
    engineVersion: state.engineVersion,
    savedAt: now,
    state,
  };
  return JSON.stringify(file, null, 2);
}

export type ParseResult = { ok: true; state: SystemState } | { ok: false; error: string };

export function parseLoamFile(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file isn’t valid JSON.' };
  }
  const f = parsed as Partial<LoamFile>;
  if (!f || f.magic !== LOAM_MAGIC) {
    return { ok: false, error: 'That doesn’t look like a Sound of Loam file.' };
  }
  if (typeof f.formatVersion !== 'number' || f.formatVersion > LOAM_FORMAT_VERSION) {
    return {
      ok: false,
      error: `This file uses a newer format (v${String(f.formatVersion)}). Update the app to open it.`,
    };
  }
  const s = f.state as SystemState | undefined;
  if (!s || typeof s !== 'object' || !s.macros || typeof s.seed !== 'number') {
    return { ok: false, error: 'This file is missing its soundscape state.' };
  }
  return { ok: true, state: s };
}
