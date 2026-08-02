import { describe, it, expect } from 'vitest';
import { Engine } from './engine';
import { defaultState, MOOD_PRESETS } from './state';

describe('nudge surfaces', () => {
  it('applyMacros sets macro means', () => {
    const e = new Engine(defaultState(1));
    e.applyMacros({ density: 0.9, mood: 0.1 });
    expect(e.state.macros.density).toBe(0.9);
    expect(e.state.macros.mood).toBe(0.1);
  });

  it('perturb shifts the live values (then they would decay)', () => {
    const e = new Engine(defaultState(2));
    const before = e.serialize().macros;
    e.perturb(0.6);
    const after = e.serialize().macros;
    const changed = (['density', 'brightness', 'motion', 'mood'] as const).some(
      (k) => Math.abs(after[k] - before[k]) > 1e-6,
    );
    expect(changed).toBe(true);
  });

  it('reseed sets the seed (deterministic) and default reseed changes it', () => {
    const e = new Engine(defaultState(3));
    e.reseed(4242);
    expect(e.serialize().seed).toBe(4242);
    e.reseed();
    expect(e.serialize().seed).not.toBe(4242);
  });

  it('mood presets are all within 0..1', () => {
    for (const macros of Object.values(MOOD_PRESETS)) {
      for (const v of Object.values(macros)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
