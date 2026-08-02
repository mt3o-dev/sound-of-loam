# Plan: cloudflare-deploy (F-03)

Goal `e6f6bf02`. Take the local-complete app live on Cloudflare. Gated on the user's
Cloudflare auth + secrets. Cloudflare runtime `[node:0005f4be]`, D1 `[node:0d98d40a]`.

## Blocking inputs (from the user)
1. **Cloudflare auth** — one of: complete the Cloudflare MCP OAuth, OR a scoped API token
   (`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`) so wrangler runs headless.
2. **Email provider** for magic links (prod) — Resend API key + a verified `EMAIL_FROM`,
   or defer (login/save/share disabled until provided; anonymous instrument still live).
3. **Deploy path** — `wrangler deploy` (Workers, direct) vs Cloudflare Pages connected to the
   GitHub repo (auto-deploy on push).
4. **Push to origin** (`github.com/mt3o-dev/sound-of-loam`) — needed for the Pages+git path.

## Phases (once inputs land)
### Phase 0 — Provision D1
`wrangler d1 create sound-of-loam` → copy the real `database_id` into `wrangler.jsonc`
(replaces the local placeholder).
- **Verify:** `wrangler d1 list` shows it.

### Phase 1 — Migrate remote
Apply `migrations/0001_init.sql` + `0002_login_tokens.sql` with `--remote`.
- **Verify:** `wrangler d1 execute sound-of-loam --remote --command="SELECT name FROM sqlite_master WHERE type='table'"` lists users/tracks/shares/login_tokens.

### Phase 2 — Secrets
`wrangler secret put AUTH_SECRET` (generate 32+ random bytes); if email chosen,
`wrangler secret put RESEND_API_KEY` + set `EMAIL_FROM` (var). Never commit these.
- **Verify:** `wrangler secret list`.

### Phase 3 — Deploy + smoke
`wrangler deploy` (or connect Pages to git). Then smoke the live URL: instrument loads +
plays; `/api/health-db` returns counts; if email set, a magic-link round-trip; a public
share link opens.
- **Verify:** live-URL checks above.

### Phase 4 — CI (optional, per git-workflow auto-deploy-on-merge)
GitHub Actions workflow (or Pages git integration) to build + deploy on merge to main.
Rate-limit /api/auth/request before opening real email sending (recorded follow-up).

## Risks
- **Secrets in repo** → all via `wrangler secret` / CI secrets; `.dev.vars` stays gitignored.
- **Remote D1 id** → the only wrangler.jsonc change; keep local placeholder documented.
- **Email domain** → Resend needs a verified sender domain; use their onboarding/testing
  domain first if the real domain isn't verified yet.
