-- F-02 magic-link login tokens. Single-use, short-lived.
--   wrangler d1 execute sound-of-loam --local --file=./migrations/0002_login_tokens.sql

CREATE TABLE IF NOT EXISTS login_tokens (
  token       TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,
  consumed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_login_tokens_email ON login_tokens(email);
