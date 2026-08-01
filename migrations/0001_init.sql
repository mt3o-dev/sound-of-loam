-- F-01 persistence schema. Applied locally with:
--   wrangler d1 execute sound-of-loam --local --file=./migrations/0001_init.sql
-- state_json holds the serialized system state (seed + params) [node:cb3ae8cf].

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tracks (
  id             TEXT PRIMARY KEY,
  user_id        TEXT,
  name           TEXT NOT NULL,
  state_json     TEXT NOT NULL,
  engine_version INTEGER NOT NULL,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tracks_user ON tracks(user_id);

-- Self-contained snapshot so public playback needs no join and is edge-cacheable
-- [node:6ea99c40].
CREATE TABLE IF NOT EXISTS shares (
  slug           TEXT PRIMARY KEY,
  state_json     TEXT NOT NULL,
  engine_version INTEGER NOT NULL,
  created_at     INTEGER NOT NULL
);
