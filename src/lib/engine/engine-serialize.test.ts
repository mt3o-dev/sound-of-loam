import { describe, it, expect } from 'vitest';
import { Engine } from './engine';
import { defaultState, ENGINE_VERSION } from './state';

describe('Engine.serialize', () => {
  it('captures seed, macros, tonality, and engine version', () => {
    const e = new Engine(defaultState(12345));
    const s = e.serialize();
    expect(s.seed).toBe(12345);
    expect(s.engineVersion).toBe(ENGINE_VERSION);
    expect(s.macros).toEqual(
      expect.objectContaining({
        density: expect.any(Number),
        brightness: expect.any(Number),
        motion: expect.any(Number),
        mood: expect.any(Number),
      }),
    );
  });

  it('round-trips through JSON into a new engine', () => {
    const original = new Engine(defaultState(999));
    const json = JSON.stringify(original.serialize());
    const restored = new Engine(JSON.parse(json));
    expect(restored.serialize().seed).toBe(999);
  });

  it('serializes the current (pre-drift) macro values, which start at the defaults', () => {
    // serialize() captures the live OU values (save-what-you-hear). Before any tick,
    // each value equals its initial mean = the default macro. setMacro moves the mean;
    // the value only drifts toward it over time, so it is unchanged immediately after.
    const e = new Engine(defaultState(7));
    e.setMacro('brightness', 0.9);
    const m = e.serialize().macros;
    expect(m.density).toBeCloseTo(0.4, 5);
    expect(m.mood).toBeCloseTo(0.3, 5);
    expect(m.brightness).toBeCloseTo(0.5, 5); // still the pre-drift value, not 0.9
  });
});
