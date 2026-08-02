import { describe, it, expect, beforeEach } from 'vitest';
import { makeTestDb } from '../test/d1-shim';
import type { D1Like } from './types';
import * as repo from './repo';

const MIGRATIONS = [new URL('../../../migrations/0001_init.sql', import.meta.url)];

let db: D1Like;
beforeEach(() => {
  db = makeTestDb(MIGRATIONS);
});

describe('users', () => {
  it('creates and reads a user by email', async () => {
    await repo.createUser(db, { id: 'u1', email: 'a@b.co', now: 1000 });
    expect(await repo.getUserByEmail(db, 'a@b.co')).toMatchObject({
      id: 'u1',
      email: 'a@b.co',
      created_at: 1000,
    });
  });

  it('returns null for a missing user', async () => {
    expect(await repo.getUserByEmail(db, 'none@x.co')).toBeNull();
  });

  it('rejects a duplicate email', async () => {
    await repo.createUser(db, { id: 'u1', email: 'a@b.co', now: 1 });
    await expect(repo.createUser(db, { id: 'u2', email: 'a@b.co', now: 2 })).rejects.toThrow();
  });
});

describe('tracks', () => {
  const base = {
    id: 't1',
    userId: 'u1',
    name: 'first',
    stateJson: '{"seed":1}',
    engineVersion: 1,
    now: 500,
  };

  it('saves, reads, and preserves state_json', async () => {
    await repo.saveTrack(db, base);
    expect(await repo.getTrack(db, 't1')).toMatchObject({
      id: 't1',
      user_id: 'u1',
      name: 'first',
      state_json: '{"seed":1}',
    });
  });

  it('upserts on id', async () => {
    await repo.saveTrack(db, base);
    await repo.saveTrack(db, { ...base, name: 'renamed', stateJson: '{"seed":2}', now: 900 });
    const t = await repo.getTrack(db, 't1');
    expect(t?.name).toBe('renamed');
    expect(t?.state_json).toBe('{"seed":2}');
    expect(t?.updated_at).toBe(900);
  });

  it("lists a user's tracks newest-first", async () => {
    await repo.saveTrack(db, { ...base, id: 'a', now: 100 });
    await repo.saveTrack(db, { ...base, id: 'b', now: 300 });
    expect((await repo.listUserTracks(db, 'u1')).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('supports an anonymous (null user) track', async () => {
    await repo.saveTrack(db, { ...base, id: 'anon', userId: null });
    expect((await repo.getTrack(db, 'anon'))?.user_id).toBeNull();
  });
});

describe('shares', () => {
  it('creates and reads a self-contained snapshot', async () => {
    await repo.createShare(db, { slug: 'abc', stateJson: '{"seed":7}', engineVersion: 1, now: 10 });
    expect(await repo.getShare(db, 'abc')).toMatchObject({
      slug: 'abc',
      state_json: '{"seed":7}',
      engine_version: 1,
    });
  });

  it('rejects a duplicate slug', async () => {
    const s = { slug: 'dup', stateJson: '{}', engineVersion: 1, now: 1 };
    await repo.createShare(db, s);
    await expect(repo.createShare(db, s)).rejects.toThrow();
  });

  it('returns null for a missing slug', async () => {
    expect(await repo.getShare(db, 'nope')).toBeNull();
  });
});
