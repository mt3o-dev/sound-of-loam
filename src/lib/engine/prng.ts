// Seeded pseudo-random number generation.
// The engine is seed-driven [node:d5caec8d] so a given seed reproduces the same
// drift when no live input is applied. Deterministic, dependency-free.

export type Rng = () => number; // returns a float in [0, 1)

/** mulberry32 — small, fast, well-distributed 32-bit seeded PRNG. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample via Box–Muller, driven by an Rng. */
export function gaussian(rng: Rng): number {
  // Guard against log(0).
  let u = 0;
  while (u === 0) u = rng();
  const v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Deterministically fold an arbitrary string into a 32-bit seed. */
export function hashStringToSeed(s: string): number {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
