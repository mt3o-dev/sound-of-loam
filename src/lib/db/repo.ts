// Typed data-access layer for the D1 store. Pure functions taking a D1Like, so
// they run against real D1 in the app and a node:sqlite shim in tests. Every query
// is parameterized via .bind(). No business logic beyond CRUD — auth (F-02) and
// the save/share UX (S-05/S-06) build on top of this.

import type { D1Like, UserRow, TrackRow, ShareRow } from './types';

export interface NewTrack {
  id: string;
  userId: string | null;
  name: string;
  stateJson: string;
  engineVersion: number;
  now: number;
}

export interface NewShare {
  slug: string;
  stateJson: string;
  engineVersion: number;
  now: number;
}

export async function createUser(
  db: D1Like,
  user: { id: string; email: string; now: number },
): Promise<void> {
  await db
    .prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)')
    .bind(user.id, user.email, user.now)
    .run();
}

export function getUserByEmail(db: D1Like, email: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
}

/** Insert or update a track (upsert on primary key). */
export async function saveTrack(db: D1Like, t: NewTrack): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tracks (id, user_id, name, state_json, engine_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         state_json = excluded.state_json,
         engine_version = excluded.engine_version,
         updated_at = excluded.updated_at`,
    )
    .bind(t.id, t.userId, t.name, t.stateJson, t.engineVersion, t.now, t.now)
    .run();
}

export function getTrack(db: D1Like, id: string): Promise<TrackRow | null> {
  return db.prepare('SELECT * FROM tracks WHERE id = ?').bind(id).first<TrackRow>();
}

export async function listUserTracks(db: D1Like, userId: string): Promise<TrackRow[]> {
  const { results } = await db
    .prepare('SELECT * FROM tracks WHERE user_id = ? ORDER BY updated_at DESC')
    .bind(userId)
    .all<TrackRow>();
  return results;
}

export async function createShare(db: D1Like, s: NewShare): Promise<void> {
  await db
    .prepare(
      'INSERT INTO shares (slug, state_json, engine_version, created_at) VALUES (?, ?, ?, ?)',
    )
    .bind(s.slug, s.stateJson, s.engineVersion, s.now)
    .run();
}

export function getShare(db: D1Like, slug: string): Promise<ShareRow | null> {
  return db.prepare('SELECT * FROM shares WHERE slug = ?').bind(slug).first<ShareRow>();
}
