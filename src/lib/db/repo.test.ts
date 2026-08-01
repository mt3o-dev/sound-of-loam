import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { D1Like, D1StmtLike } from './types';
import * as repo from './repo';

// The repo targets the D1 API subset (prepare/bind/first/all/run). This shim
// implements that subset over node:sqlite so the data layer is unit-tested
// against real SQL with no Cloudflare account and no extra deps.
const schema = readFileSync(new URL('../../../migrations/0001_init.sql', import.meta.url), 'utf8');

class Stmt implements D1StmtLike {
  private args: unknown[] = [];
  constructor(private readonly stmt: ReturnType<DatabaseSync['prepare']>) {}
  bind(...values: unknown[]): D1StmtLike {
    this.args = values;
    return this;
  }
  async first<T = unknown>(): Promise<T | null> {
    const row = this.stmt.get(...(this.args as never[]));
    return (row ?? null) as T | null;
  }
  async all<T = unknown>(): Promise<{ results: T[] }> {
    return { results: this.stmt.all(...(this.args as never[])) as T[] };
  }
  async run(): Promise<unknown> {
    return this.stmt.run(...(this.args as never[]));
  }
}

class ShimDb implements D1Like {
  constructor(private readonly raw: DatabaseSync) {}
  prepare(sql: string): D1StmtLike {
    return new Stmt(this.raw.prepare(sql));
  }
}

function makeDb(): D1Like {
  const raw = new DatabaseSync(':memory:');
  raw.exec(schema);
  return new ShimDb(raw);
}

let db: D1Like;
beforeEach(() => {
  db = makeDb();
});

describe('users', () => {
  it('creates and reads a user by email', async () => {
    await repo.createUser(db, { id: 'u1', email: 'a@b.co', now: 1000 });
    const u = await repo.getUserByEmail(db, 'a@b.co');
    expect(u).toMatchObject({ id: 'u1', email: 'a@b.co', created_at: 1000 });
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
    const t = await repo.getTrack(db, 't1');
    expect(t).toMatchObject({ id: 't1', user_id: 'u1', name: 'first', state_json: '{"seed":1}' });
  });

  it('upserts on id (updates name/state, keeps id)', async () => {
    await repo.saveTrack(db, base);
    await repo.saveTrack(db, { ...base, name: 'renamed', stateJson: '{"seed":2}', now: 900 });
    const t = await repo.getTrack(db, 't1');
    expect(t?.name).toBe('renamed');
    expect(t?.state_json).toBe('{"seed":2}');
    expect(t?.updated_at).toBe(900);
  });

  it('lists a user\'s tracks newest-first', async () => {
    await repo.saveTrack(db, { ...base, id: 'a', now: 100 });
    await repo.saveTrack(db, { ...base, id: 'b', now: 300 });
    const list = await repo.listUserTracks(db, 'u1');
    expect(list.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('supports an anonymous (null user) track', async () => {
    await repo.saveTrack(db, { ...base, id: 'anon', userId: null });
    const t = await repo.getTrack(db, 'anon');
    expect(t?.user_id).toBeNull();
  });
});

describe('shares', () => {
  it('creates and reads a self-contained share snapshot', async () => {
    await repo.createShare(db, { slug: 'abc', stateJson: '{"seed":7}', engineVersion: 1, now: 10 });
    const s = await repo.getShare(db, 'abc');
    expect(s).toMatchObject({ slug: 'abc', state_json: '{"seed":7}', engine_version: 1 });
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
