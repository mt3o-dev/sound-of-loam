# Plan: email-auth (F-02)

Goal `609be706`. Passwordless magic-link login + stateless signed sessions on the D1 layer,
additive to the anonymous instrument. Grounds: `[node:57d8fc3f]` auth approach,
`[node:e65ec8a0]` pluggable email sender, `[node:c1b0d7c2]` anonymous-first, `[node:0d98d40a]` D1.

## Non-goals (later slices)
The save/library UI (S-05), share UX (S-06), password auth, account deletion, rate-limit
tuning, the real email provider + domain (deploy/F-03). Instrument stays untouched.

## Approach
- **Login**: POST email → create single-use ~10-min token in D1 `login_tokens` → email a link
  `/api/auth/callback?token=…` (ConsoleSender logs it locally). Callback verifies + consumes
  the token, upserts the user, sets a signed session cookie, redirects.
- **Session**: stateless httpOnly cookie `sol_session` = `base64url(payload).HMAC` signed with
  `AUTH_SECRET` (Cloudflare secret; stubbed in dev). `getSession()` verifies + parses.
- **Crypto**: Web Crypto (`crypto.subtle` HMAC-SHA256, `crypto.getRandomValues`,
  `crypto.randomUUID`) — available in workerd and Node 26, so pure + testable.
- **Email**: `EmailSender` interface; `ConsoleSender` (default, logs link) / `ResendSender`
  (when `RESEND_API_KEY`+`EMAIL_FROM` set), chosen by env `[node:e65ec8a0]`.

## Phases

### Phase 0 — Schema
`migrations/0002_login_tokens.sql`: `login_tokens(token TEXT PK, email TEXT, expires_at INT, consumed_at INT)`.
- **Verify:** apply `--local`; table listed.

### Phase 1 — Crypto + session utils (pure, tested)
`src/lib/auth/crypto.ts` (hmacSign/hmacVerify base64url, randomToken) and
`src/lib/auth/session.ts` (createSessionCookie/verifySessionCookie with expiry).
- **Verify:** Vitest — sign→verify round-trip; tampered payload rejected; expired cookie rejected;
  token is high-entropy + url-safe.

### Phase 2 — Email sender abstraction
`src/lib/auth/email.ts`: `EmailSender`, `ConsoleSender`, `ResendSender`, `getSender(env)`.
- **Verify:** Vitest — `getSender` returns Console without a key, Resend with one; ConsoleSender
  captures the link; ResendSender POSTs the right shape (fetch mocked).

### Phase 3 — Repo + endpoints
Extend `src/lib/db/repo.ts`: `createLoginToken`, `consumeLoginToken` (atomic single-use),
`upsertUserByEmail`. Endpoints (all `prerender = false`): `POST /api/auth/request`,
`GET /api/auth/callback`, `POST /api/auth/logout`; `src/lib/auth/current-user.ts` `getSession(request)`.
- **Verify:** Vitest for repo token round-trip (create → consume once → second consume fails,
  expired rejected) against node:sqlite.

### Phase 4 — Local end-to-end
Drive on the wrangler-dev worker: POST /api/auth/request → console logs the link →
GET the link → session cookie set → a `/api/auth/me` (temp) returns the user; logout clears it.
- **Verify:** the flow works locally with the console sender; instrument page still static
  (re-run audio verify); `astro check` + build clean.

## Risks
- **Single-use token races** → `consumeLoginToken` does a conditional UPDATE (`SET consumed_at WHERE token=? AND consumed_at IS NULL`) and checks rows-affected, so double-use can't both win.
- **Cookie security** → httpOnly + Secure + SameSite=Lax; short session TTL; secret from env, never committed.
- **output:'server' regressions** → endpoints already server; index stays prerendered; re-verify audio.

## Route
After `/gw-plan-review`, `/gw-implement`. Real email provider + domain + `AUTH_SECRET` provisioning at F-03.
