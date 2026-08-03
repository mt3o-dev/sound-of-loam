import { describe, it, expect } from 'vitest';
import { toLoamFile, parseLoamFile, LOAM_MAGIC } from './format';
import { defaultState } from './engine/state';

describe('loam file format', () => {
  it('round-trips state', () => {
    const state = defaultState(4321);
    const res = parseLoamFile(toLoamFile(state, 1000));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.state.seed).toBe(4321);
  });

  it('stamps magic + version', () => {
    const parsed = JSON.parse(toLoamFile(defaultState(1), 1));
    expect(parsed.magic).toBe(LOAM_MAGIC);
    expect(parsed.formatVersion).toBe(1);
  });

  it('rejects bad JSON', () => {
    expect(parseLoamFile('{not json')).toMatchObject({ ok: false });
  });

  it('rejects a foreign file', () => {
    expect(parseLoamFile(JSON.stringify({ hello: 'world' }))).toMatchObject({ ok: false });
  });

  it('declines a newer format version gracefully', () => {
    const future = JSON.stringify({ magic: LOAM_MAGIC, formatVersion: 99, state: defaultState(1) });
    const res = parseLoamFile(future);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/newer format/);
  });

  it('rejects a file missing state', () => {
    expect(parseLoamFile(JSON.stringify({ magic: LOAM_MAGIC, formatVersion: 1 }))).toMatchObject({ ok: false });
  });
});
