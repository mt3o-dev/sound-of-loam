# Plan: persistence-backend (F-01)

Goal `1cec632d`. Minimal foundation enabler: give the app a Cloudflare D1 data layer,
testable locally with no account. Real save/share/auth UX belongs to S-05/S-06/F-02 —
F-01 provides the binding, schema, and typed access module, plus one smoke endpoint to
prove the wiring. Grounds: `[node:552dffc6]` D1+Astro pattern, `[node:3c438e12]`
keep-instrument-prerendered, `[node:0d98d40a]` D1 decision, `[node:4d3e471b]` access model.

## Non-goals (later slices)
Login/session logic (F-02), the save/library UI (S-05), the public share page + link UX (S-06),
remote D1 provisioning + deploy (needs auth; F-03). No MyDevil, no bridge.

## Scope cap
F-01 = binding + schema + data-access module + one smoke endpoint + local-D1 tests. It must
NOT build auth or user-facing flows; those slices consume this layer.

## Phases

### Phase 0 — Adapter + server output, instrument stays static
Add `@astrojs/cloudflare`; `output: 'server'`; `export const prerender = true` on
`src/pages/index.astro` so the synth core stays static/offline/anonymous `[node:3c438e12]`.
Add `wrangler.jsonc` with a `d1_databases` binding (`DB`, local; `database_id` placeholder
until remote provisioning).
- **Verify:** `npm run build` passes; `astro check` clean; index still prerenders (static);
  the synth core still runs (no regression) — re-run the headless audio check.

### Phase 1 — Schema + migrations
`migrations/0001_init.sql` (or `db/schema.sql`):
- `users(id TEXT PK, email TEXT UNIQUE, created_at INTEGER)`
- `tracks(id TEXT PK, user_id TEXT, name TEXT, state_json TEXT, engine_version INTEGER, created_at INTEGER, updated_at INTEGER)`
- `shares(slug TEXT PK, state_json TEXT, engine_version INTEGER, created_at INTEGER)` —
  self-contained snapshot so public playback needs no join and is edge-cacheable.
- **Verify:** `wrangler d1 execute sound-of-loam --local --file=…` then
  `--command="SELECT name FROM sqlite_master WHERE type='table'"` lists the three tables.

### Phase 2 — Typed data-access module (`src/lib/db/`)
`types.ts` (row types) + `repo.ts` with pure functions taking a `D1Database`:
`createUser`, `getUserByEmail`, `saveTrack`, `getTrack`, `listUserTracks`, `createShare`,
`getShare`. All queries parameterized (`.bind`). No business logic beyond CRUD.
- **Verify:** Vitest via `@cloudflare/vitest-pool-workers` against a real local D1 — round-trip
  each function (create → read → list); slugs unique; state_json preserved.

### Phase 3 — Smoke endpoint (verification scaffolding)
One server endpoint `src/pages/api/health-db.ts` (`prerender = false`) that runs a trivial
D1 query via `locals.runtime.env.DB` and returns row counts — proves the binding reaches
real code end-to-end. (S-05/S-06 replace/extend with real endpoints.)
- **Verify:** `astro dev`/`wrangler dev` → GET `/api/health-db` returns JSON from local D1;
  instrument page unaffected.

## Risks
- **output:'server' regressing the instrument** → mitigated by prerender on index + re-running the audio verify (Phase 0). This is the highest-value check.
- **Test tooling** → `@cloudflare/vitest-pool-workers` is the supported path for real-D1 tests; fall back to a better-sqlite3 mirror of the same schema if it fights the existing Vitest setup.
- **Binding name drift** → fix `DB` as the binding now; all data-access takes the `D1Database` explicitly so it's injection-testable.

## Route
After `/gw-plan-review`, `/gw-implement`. Remote provisioning + deploy stay in F-03 (needs the Cloudflare auth you just connected).
