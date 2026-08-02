// Test-only shim: implements the D1 API subset over Node's built-in node:sqlite,
// so the data layer is unit-tested against real SQL with no Cloudflare account.
// Not imported by app code, so it never reaches the worker bundle.

import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { D1Like, D1StmtLike } from '../db/types';

class Stmt implements D1StmtLike {
  private args: unknown[] = [];
  constructor(private readonly stmt: ReturnType<DatabaseSync['prepare']>) {}
  bind(...values: unknown[]): D1StmtLike {
    this.args = values;
    return this;
  }
  async first<T = unknown>(): Promise<T | null> {
    return (this.stmt.get(...(this.args as never[])) ?? null) as T | null;
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

/** Build an in-memory D1-like DB seeded from the given migration .sql file URLs. */
export function makeTestDb(migrationUrls: URL[]): D1Like {
  const raw = new DatabaseSync(':memory:');
  for (const u of migrationUrls) raw.exec(readFileSync(u, 'utf8'));
  return new ShimDb(raw);
}
