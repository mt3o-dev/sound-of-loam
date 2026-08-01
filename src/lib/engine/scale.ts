// Coherence by construction [node:98a286b8].
//
// Every pitch the engine can emit is drawn from a fixed scale/mode over a drone
// root. "Coherent" is defined as membership in this pitch set — the engine is
// structurally incapable of a dissonant note, so coherence is guaranteed, not
// judged after the fact.

/** Semitone offsets from the root for a set of ambient-friendly modes. */
export const SCALES: Record<string, number[]> = {
  // Minor pentatonic — safe, spacious, hard to make ugly.
  minorPentatonic: [0, 3, 5, 7, 10],
  // Major pentatonic — brighter, still consonant.
  majorPentatonic: [0, 2, 4, 7, 9],
  // Dorian — gentle minor colour with a raised 6th.
  dorian: [0, 2, 3, 5, 7, 9, 10],
  // Lydian — floating, dreamy (raised 4th).
  lydian: [0, 2, 4, 6, 7, 9, 11],
};

export type ScaleName = keyof typeof SCALES;

/** Equal-tempered frequency of a MIDI note number (A4 = 69 = 440 Hz). */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * All frequencies of `scale` rooted at `rootMidi`, spanning `octaves` upward.
 * The returned list is the entire universe of pitches the engine may play.
 */
export function scaleFrequencies(
  rootMidi: number,
  scale: ScaleName,
  octaves: number,
): number[] {
  const offsets = SCALES[scale];
  const out: number[] = [];
  for (let o = 0; o < octaves; o++) {
    for (const off of offsets) {
      out.push(midiToFreq(rootMidi + o * 12 + off));
    }
  }
  return out;
}
