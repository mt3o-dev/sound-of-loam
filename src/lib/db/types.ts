// Row types + a minimal structural interface for the D1 subset the repo uses.
// A real Cloudflare `D1Database` satisfies `D1Like` structurally, and so does the
// node:sqlite-backed test shim — so the repo never hard-depends on workers-types.

export interface UserRow {
  id: string;
  email: string;
  created_at: number;
}

export interface TrackRow {
  id: string;
  user_id: string | null;
  name: string;
  state_json: string;
  engine_version: number;
  created_at: number;
  updated_at: number;
}

export interface ShareRow {
  slug: string;
  state_json: string;
  engine_version: number;
  created_at: number;
}

export interface LoginTokenRow {
  token: string;
  email: string;
  expires_at: number;
  consumed_at: number | null;
}

export interface D1StmtLike {
  bind(...values: unknown[]): D1StmtLike;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1Like {
  prepare(sql: string): D1StmtLike;
}
