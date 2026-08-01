# Research: persistence-backend (F-01)

Goal `1cec632d`. Recall surfaced the D1 amendment cluster and flagged the superseded
MyDevil decision `[84fcdc4b]` + bridge issue `[3bf08d2f]` as `disputed` (working as designed).
Gap: concrete D1 + Astro-adapter integration. Verified against current docs (Aug 2026).

## Questions & answers

1. **How does D1 attach to Astro?** `output: 'server'` + `adapter: cloudflare()`
   (`@astrojs/cloudflare`); binding declared in `wrangler.jsonc` (`d1_databases`: `binding: DB`,
   `database_name`, `database_id`); accessed in server endpoints via
   `context.locals.runtime.env.DB.prepare(...).bind(...).first()/all()/run()`;
   `wrangler types` generates TS types. → `[node:552dffc6]`.

2. **Local dev without an account?** Yes — `astro dev`/`wrangler dev` use a local SQLite at
   `.wrangler/state/v3/d1`; schema applied with `wrangler d1 execute <db> --local --file=…`.
   Remote provisioning (`wrangler d1 create`, `--remote`) needs auth, deferred. → `[node:552dffc6]`.

3. **Does output:'server' break anonymous-first?** It would, unless the synth/index page stays
   prerendered (`export const prerender = true`). Core sound must remain static/offline/anon;
   only persistence endpoints are server. Load-bearing. → `[node:3c438e12]`.

4. **Testing the data layer?** Options: `@cloudflare/vitest-pool-workers` (real local D1 in
   Vitest) or a plain-SQLite mirror with the same schema. Decide at plan/implement.

## Schema shape (to formalize in plan)
- `users` (id, email, created_at) — populated by F-02 auth; table defined here.
- `tracks` (id, user_id, name, state_json, engine_version, created_at, updated_at).
- `shares` (slug PK, state_json, engine_version, created_at) — self-contained snapshot so
  public playback needs no user join and is edge-cacheable.

## Artifacts captured
`[node:552dffc6]` Astro+D1 integration pattern · `[node:3c438e12]` prerender-the-instrument
constraint. Journaled USED: `0d98d40a`, `c1b0d7c2`, `0005f4be`.

## Route → /gw-plan
Ground understood. Plan: adapter + binding config, schema/migrations, typed data-access module,
local-D1 tests, keep index prerendered.
