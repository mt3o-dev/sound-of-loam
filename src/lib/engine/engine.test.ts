import { describe, it, expect } from 'vitest';
import { mulberry32, gaussian, hashStringToSeed } from './prng';
import { OUParam, type OUConfig } from './ou';
import { scaleFrequencies, midiToFreq, SCALES } from './scale';

describe('prng', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = Array.from({ length: 100 }, () => a());
    const seqB = Array.from({ length: 100 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces values in [0,1)', () => {
    const r = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('hashStringToSeed is stable and 32-bit', () => {
    expect(hashStringToSeed('loam')).toBe(hashStringToSeed('loam'));
    expect(hashStringToSeed('loam')).not.toBe(hashStringToSeed('sand'));
    expect(hashStringToSeed('x')).toBeLessThanOrEqual(0xffffffff);
  });
});

const cfg: OUConfig = {
  mu: 0.5,
  theta: 0.5,
  sigma: 0.3,
  min: 0,
  max: 1,
  biasTau: 4,
};

describe('OUParam', () => {
  it('stays within [min,max] over a long run (coherence invariant)', () => {
    const p = new OUParam(cfg);
    const rng = mulberry32(7);
    for (let i = 0; i < 100_000; i++) {
      p.step(0.05, rng);
      expect(p.value).toBeGreaterThanOrEqual(cfg.min);
      expect(p.value).toBeLessThanOrEqual(cfg.max);
    }
  });

  it('same seed reproduces the same drift (seed-driven)', () => {
    const run = () => {
      const p = new OUParam(cfg);
      const rng = mulberry32(99);
      const out: number[] = [];
      for (let i = 0; i < 500; i++) {
        p.step(0.02, rng);
        out.push(p.baseline);
      }
      return out;
    };
    expect(run()).toEqual(run());
  });

  it('a nudge biases the value then decays back toward baseline (bias, not control)', () => {
    const p = new OUParam(cfg, 0.5);
    const rng = mulberry32(3);
    const before = p.value;
    p.nudge(0.4);
    const afterNudge = p.value;
    expect(afterNudge).toBeGreaterThan(before); // nudge took effect

    // Let time pass with no further nudges; bias must decay toward 0.
    let biasContribution = afterNudge; // rough proxy
    for (let i = 0; i < 600; i++) p.step(0.05, rng); // 30s >> biasTau (4s)
    // After many tau, the bias term is effectively gone: value is baseline-only,
    // which lives inside [min,max] and is not pinned near the nudged peak.
    expect(Math.abs(p.value - p.baseline)).toBeLessThan(0.01);
    void biasContribution;
  });
});

describe('scale', () => {
  it('midiToFreq maps A4 to 440Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
  });

  it('every generated frequency belongs to the scale set (coherence by construction)', () => {
    const root = 48;
    const freqs = scaleFrequencies(root, 'minorPentatonic', 4);
    const allowedPitchClasses = new Set(SCALES.minorPentatonic.map((o) => (root + o) % 12));
    for (const f of freqs) {
      // recover midi from freq and check its pitch class is in the scale
      const midi = Math.round(69 + 12 * Math.log2(f / 440));
      expect(allowedPitchClasses.has(((midi % 12) + 12) % 12)).toBe(true);
    }
  });

  it('gaussian returns finite numbers', () => {
    const rng = mulberry32(5);
    for (let i = 0; i < 100; i++) expect(Number.isFinite(gaussian(rng))).toBe(true);
  });
});
