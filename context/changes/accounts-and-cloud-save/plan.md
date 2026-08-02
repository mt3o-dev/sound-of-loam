# Plan: accounts-and-cloud-save (S-05)

Goal `de4efd31`. A signed-in user saves the current soundscape to their account and
reloads saved tracks. Login required to save/own; anonymous instrument untouched
`[node:c1b0d7c2]` `[node:4d3e471b]`. Reuses F-01 repo (saveTrack/getTrack/listUserTracks)
+ F-02 getSession. state_json = serialized system state `[node:cb3ae8cf]`.

## Non-goals
Public sharing (S-06), local file save (S-03), rename/delete UI polish, pagination. Keep the
library minimal (name + load).

## What "save" captures / "load" restores
`Engine.serialize()` → `{ seed, macros (current drifting values), scale, rootMidi, engineVersion }`.
Load = start a fresh engine from that state (seed-driven; resumes near the saved sound, not the
exact future — consistent with the bias-not-control model). No exact-timeline guarantee.

## Phases

### Phase 0 — Engine serialization (pure, tested)
Add `Engine.serialize(): SystemState` (uses current macro values via snapshot() + seed +
tonality) and confirm `new Engine(state)` reproduces. Keep `state.macros` authoritative on save.
- **Verify:** Vitest — serialize()→JSON→parse→`new Engine(...)` reproduces the OU baselines for
  a fixed seed; engineVersion stamped.

### Phase 1 — /api/tracks endpoints (session-scoped)
`POST /api/tracks` (save {name, state}), `GET /api/tracks` (list mine), `GET /api/tracks/[id]`
(load mine) — all `prerender=false`, all require `getSession`; 401 if anonymous. Ownership
enforced by `user_id = session.userId`; getTrack checks the row's user_id matches.
- **Verify:** wrangler-dev e2e (below) — anonymous → 401; owner CRUD works; another user can't read.

### Phase 2 — Account/library UI (Svelte island)
Extend `SynthCore.svelte` (or a child `AccountPanel.svelte`): on mount, `GET /api/auth/me`.
- Signed out: an email field → `POST /api/auth/request` → "check your email" (console link in dev).
- Signed in: show email, a **Save** button (name prompt → `POST /api/tracks` with `engine.serialize()`),
  a **track list** (`GET /api/tracks`) with **Load** (`GET /api/tracks/[id]` → apply to engine),
  and **Sign out** (`POST /api/auth/logout`).
- The panel is purely additive; with no session the instrument is fully usable.
- **Verify:** driven in-browser (headless) — see Phase 3.

### Phase 3 — End-to-end
On the wrangler-dev worker: anonymous instrument works + Save hidden/prompts login →
console magic-link → signed in → Save a track → it appears in the list → Load re-applies it →
`GET /api/tracks` scoped to the user. Re-run the audio verify (instrument unaffected).
- **Verify:** headless script drives login+save+list+load; `astro check` + build + vitest clean.

## Risks
- **Applying a loaded state to a running engine** → simplest correct: tear down + recreate the
  engine from the saved state (stop current, new Engine(state), start). Avoids partial-apply bugs.
- **Ownership leaks** → every /api/tracks handler filters by session.userId; getTrack returns 404
  if the row isn't the caller's.
- **output/anon regressions** → panel is client-only; index stays prerendered; re-verify audio.

## Route
After `/gw-plan-review`, `/gw-implement`.
