---
project: "Sound of Loam"
version: 1
status: draft
created: 2026-08-01
updated: 2026-08-01
prd_version: 1
main_goal: learn
top_blocker: skills
---

# Roadmap: Sound of Loam

> Derived from `context/foundation/prd.md` (v1) + `tech-stack.md` + the just-scaffolded codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

A browser instrument that produces a fully-synthesized, slowly-evolving ambient soundscape
you *tend rather than author* — it drifts on its own, biased but never overridden by your
nudges and by real-world signals (pointer, motion, mic, light, sun, weather, even a cat).
No recordings ever; every sound is made at runtime. The hard, novel part is the autonomous
generative engine; accounts, save/export, and sharing wrap around it later.

## North star

**S-01: user hears a self-evolving synthesized soundscape and can bias it** — this is the
validation milestone: if a tendable, always-alive, influence-not-control instrument doesn't
feel right, nothing downstream matters.

> "North star" here = the smallest end-to-end slice whose success proves the core product
> hypothesis, placed as early as its prerequisites allow because everything else only
> matters if this works.

## At a glance

| ID   | Change ID                | Outcome (user can …)                                            | Prerequisites        | PRD refs                              | Status   |
| ---- | ------------------------ | -------------------------------------------------------------- | -------------------- | ------------------------------------- | -------- |
| S-01 | synth-core-instrument    | hear self-evolving synthesized sound + nudge it (macro+pointer) | —                    | US-01, FR-001, FR-002, FR-003, FR-010, FR-025 | done     |
| S-02 | nudge-and-sensors        | shape it via X-Y pad, presets, perturb + motion/mic/time/light  | S-01                 | FR-004, FR-005, FR-006, FR-011, FR-012, FR-013 | done     |
| S-03 | save-load-state-file     | save system state to a file and reload it (local, no account)   | S-01                 | FR-020, FR-021                        | done     |
| S-04 | mp3-export               | download the soundscape as MP3 (render + live capture)          | S-01                 | FR-022, FR-023                        | done     |
| S-09 | generative-visuals       | see a generative visual layer evolve with the sound             | S-01                 | FR-030                                | done     |
| S-07 | environmental-signals    | have location/time (sun) + weather bias the sound               | S-01, S-02           | FR-014, FR-015                        | proposed |
| S-08 | cat-signals              | have a cat's presence/purr/meow bias the sound                  | S-02                 | FR-016                                | proposed |
| F-01 | persistence-backend      | (foundation) app can read/write persistent storage (Cloudflare D1) | —                | Access Control, NFR (self-contained file) | done     |
| F-02 | email-auth               | (foundation) email login + sessions in place                    | F-01                 | FR-024, Access Control                | done     |
| S-05 | accounts-and-cloud-save  | sign in via email and save/own tracks in an account             | F-01, F-02           | FR-024, FR-020                        | done     |
| F-03 | cloudflare-deploy        | (foundation) app deploys to a public URL                        | —                    | NFR (public link plays)               | done     |
| S-06 | public-track-sharing     | publish a track to a public link anyone can play                | F-01, S-05           | FR-026                                | done     |

## Streams

Navigation aid — groups items sharing a Prerequisites chain. Canonical ordering lives in the dependency graph below.

| Stream | Theme               | Chain                                         | Note                                                                 |
| ------ | ------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| A      | Instrument core     | `S-01` → `S-02` → `S-07`; `S-09`, `S-08` parallel off `S-01`/`S-02` | The learn-first track; exercises the novel synthesis/engine tech earliest. |
| B      | Portability         | `S-03` → `S-04`                               | Save + export; branches off the north star `S-01`, no backend.       |
| C      | Accounts & sharing  | `F-01` → `F-02` → `S-05` → `S-06` (`F-03` feeds `S-06`) | Backend-dependent; deferred to last per learn-goal. Joins B at `S-03`. |

## Baseline

What's already in place as of 2026-08-01 (scaffolded this session). Foundations assume these
exist and do NOT re-scaffold them.

- **Frontend:** present — Astro v7.1.6 + Svelte + Tailwind v4 (`astro.config.mjs`, `src/`, `package.json`).
- **Backend / API:** absent.
- **Data:** absent — SQLite-on-MyDevil chosen (`tech-stack.md`) but not wired.
- **Auth:** absent.
- **Deploy / infra:** per `tech-stack.md` → Cloudflare Pages; adapter not yet added.
- **Observability:** absent.

## Foundations

### F-01: Persistence backend

- **Outcome:** (foundation) the app can read and write persistent records (tracks, users, share entries).
- **Change ID:** persistence-backend
- **PRD refs:** Access Control, NFR (saved file self-contained; public link plays)
- **Unlocks:** F-02 (needs a user store), S-05 (cloud save), S-06 (share records)
- **Prerequisites:** —
- **Parallel with:** S-01, S-02, S-03, S-04, S-09 (instrument work needs no backend)
- **Blockers:** —
- **Unknowns:**
  - Cloudflare↔MyDevil bridge: thin persistence API on MyDevil vs Cloudflare D1? — Owner: user. Block: yes.
- **Risk:** the chosen hybrid (Cloudflare runtime + SQLite on MyDevil) has no direct disk access from edge functions; the bridge decision gates any real persistence work. Sequenced late so it never blocks the instrument.
- **Status:** blocked

### F-02: Email auth

- **Outcome:** (foundation) users can be created and authenticated via email; sessions issued.
- **Change ID:** email-auth
- **PRD refs:** FR-024, Access Control
- **Unlocks:** S-05 (account save/ownership), S-06 (ownership of shared tracks)
- **Prerequisites:** F-01
- **Parallel with:** F-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** must not gate anonymous play (FR-025) — auth is additive only. Kept minimal (email login), no roles.
- **Status:** proposed

### F-03: Cloudflare deploy

- **Outcome:** (foundation) the app builds and deploys to a public Cloudflare URL.
- **Change ID:** cloudflare-deploy
- **PRD refs:** NFR (public share link plays for any visitor)
- **Unlocks:** S-06 (public links need public hosting)
- **Prerequisites:** —
- **Parallel with:** F-01, F-02
- **Blockers:** —
- **Unknowns:**
  - Add `@astrojs/cloudflare` adapter + confirm SSR/edge functions needed for share pages — Owner: TBD. Block: no.
- **Risk:** deferred until sharing needs it (progressive disclosure); the instrument runs fine as a static/local page without it.
- **Status:** proposed

## Slices

### S-01: Synth core instrument

- **Outcome:** user opens the app and hears a fully-synthesized soundscape that evolves on its own, and can bias it with a few macro controls and pointer movement — no account, no network.
- **Change ID:** synth-core-instrument
- **PRD refs:** US-01, FR-001, FR-002, FR-003, FR-010, FR-025; NFRs (synthesis-only, glitch-free, coherent drift, offline/anonymous)
- **Prerequisites:** —
- **Parallel with:** F-01, F-03
- **Blockers:** —
- **Unknowns:**
  - What generative model keeps drift coherent yet always-changing (constrained stochastic / LFO / CA / Markov)? — Owner: user/research. Block: no (resolve during this slice's research/plan).
- **Risk:** the whole product's novelty lives here; the engine is unfamiliar tech (the #1 blocker: skills). Ship the smallest version that *feels* alive before adding surfaces.
- **Status:** ready

### S-02: Richer nudges & cheap sensors

- **Outcome:** user can shape the system via an X-Y pad, mood presets/seeds, a perturb/re-seed action, and device motion / mic level / time / ambient light.
- **Change ID:** nudge-and-sensors
- **PRD refs:** FR-004, FR-005, FR-006, FR-011, FR-012, FR-013
- **Prerequisites:** S-01
- **Parallel with:** S-03, S-04, S-09
- **Blockers:** —
- **Unknowns:**
  - Permission UX for motion (iOS) and mic — Owner: user. Block: no.
- **Risk:** each input must *bias then decay*, not control; getting the mapping/feel right is the work. Permission-gated APIs need graceful fallback.
- **Status:** proposed

### S-03: Save & load state file

- **Outcome:** user can save the current system state to a custom file and download it, then load it back to resume/replay — locally, no account.
- **Change ID:** save-load-state-file
- **PRD refs:** FR-020, FR-021
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-04, S-09
- **Blockers:** —
- **Unknowns:**
  - File format contents + versioning (seed + params + engine version) — Owner: user/design. Block: no (this slice defines it).
- **Risk:** reproducibility is of the starting state, not the exact future (live signals re-bias); the format must carry an engine version so future loads migrate or decline gracefully.
- **Status:** proposed

### S-04: MP3 export

- **Outcome:** user can download the soundscape as an MP3 — either a reproducible render of a chosen duration from the current state, or a capture of a live session.
- **Change ID:** mp3-export
- **PRD refs:** FR-022, FR-023
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-03, S-09
- **Blockers:** —
- **Unknowns:**
  - Duration bounds/defaults; in-browser encoder vs off-device render — Owner: user/design. Block: no.
- **Risk:** in-browser encoding preserves the "browser-only" ethos but has CPU/perf cost; deterministic render must match what the state would produce with no live input.
- **Status:** proposed

### S-09: Generative visuals

- **Outcome:** user sees a generative visual layer that evolves with the sound.
- **Change ID:** generative-visuals
- **PRD refs:** FR-030
- **Prerequisites:** S-01
- **Parallel with:** S-02, S-03, S-04
- **Blockers:** —
- **Unknowns:** —
- **Risk:** explicitly nice-to-have; must read from the same evolving state, not become a second source of truth. Keep it from stealing audio CPU.
- **Status:** proposed

### S-07: Environmental signals

- **Outcome:** user's location and time of day (sun position) and local weather bias the soundscape's tone and texture.
- **Change ID:** environmental-signals
- **PRD refs:** FR-014, FR-015
- **Prerequisites:** S-01, S-02
- **Parallel with:** S-09
- **Blockers:** weather data provider/API access (external).
- **Unknowns:**
  - Location consent UX; sun-position math source — Owner: user. Block: no.
- **Risk:** slow, ambient influences (day/night, weather) must be perceptible but subtle; external weather dependency introduces the first network requirement for an input.
- **Status:** proposed

### S-08: Cat signals

- **Outcome:** a cat's presence, purr, meow, and emotional tone/tempo (via camera and microphone) bias generation.
- **Change ID:** cat-signals
- **PRD refs:** FR-016
- **Prerequisites:** S-02
- **Parallel with:** S-07, S-09
- **Blockers:** —
- **Unknowns:**
  - Is off-device processing of camera/mic acceptable, and under what consent model? (PRD Open Q #3) — Owner: user. Block: yes.
  - Recognition approach (on-device model vs cloud) — Owner: user/research. Block: yes.
- **Risk:** ML-heavy and privacy-sensitive; the consent + approach decisions must land before planning. Isolated so it never blocks the core instrument.
- **Status:** blocked

### S-05: Accounts & cloud save

- **Outcome:** user can sign in via email and save/own their tracks in an account.
- **Change ID:** accounts-and-cloud-save
- **PRD refs:** FR-024, FR-020
- **Prerequisites:** F-01, F-02, S-03
- **Parallel with:** F-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** must extend the local save format (S-03) to cloud storage without breaking anonymous/local use.
- **Status:** proposed

### S-06: Public track sharing

- **Outcome:** user can publish a track to a public link that anyone can play without an account.
- **Change ID:** public-track-sharing
- **PRD refs:** FR-026
- **Prerequisites:** F-01, F-03, S-05
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Share record model; how a link reconstructs & plays state anonymously — Owner: design. Block: no.
- **Risk:** shared state must play for unauthenticated visitors; keep the public path free of account gating.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID               | Suggested issue title                                  | Ready for `/10x-plan` | Notes |
| ---------- | ----------------------- | ----------------------------------------------------- | --------------------- | ----- |
| S-01       | synth-core-instrument   | Synth core: self-evolving synthesized soundscape + nudges | yes               | North star. `/10x-plan synth-core-instrument` |
| S-02       | nudge-and-sensors       | Richer nudge surfaces + cheap sensor inputs           | no                    | After S-01 |
| S-03       | save-load-state-file    | Save/load custom state file (local)                   | no                    | After S-01 |
| S-04       | mp3-export              | MP3 export (render + live capture)                    | no                    | After S-01 |
| S-09       | generative-visuals      | Generative visual layer                               | no                    | After S-01; nice-to-have |
| S-07       | environmental-signals   | Sun-position + weather inputs                         | no                    | After S-02; needs weather API |
| S-08       | cat-signals             | Cat detection input (camera+audio)                   | no                    | Blocked: consent + ML approach |
| F-01       | persistence-backend     | Persistence backend (SQLite/MyDevil ↔ Cloudflare)     | no                    | Blocked: bridge decision |
| F-02       | email-auth              | Email login + sessions                               | no                    | After F-01 |
| S-05       | accounts-and-cloud-save | Accounts + cloud track save                          | no                    | After F-01, F-02, S-03 |
| F-03       | cloudflare-deploy       | Cloudflare deploy skeleton                            | no                    | Unlocks sharing |
| S-06       | public-track-sharing    | Public share links                                   | no                    | After F-01, F-03, S-05 |

## Open Roadmap Questions

1. **Custom save-file format contents + versioning?** — Owner: user/design. Block: S-03, S-05.
2. **MP3 export duration bounds/default; encoder location (in-browser vs off-device)?** — Owner: user/design. Block: S-04.
3. **Is off-device processing of environmental data (cat detection) acceptable, and under what consent model?** — Owner: user. Block: S-08.
4. **What defines "coherent" for the autonomous engine — the constraints that keep drift musical?** — Owner: user/research. Block: none (resolved inside S-01).
5. **Cloudflare↔MyDevil persistence bridge: thin API on MyDevil vs Cloudflare D1?** — Owner: user. Block: F-01 (and therefore S-05, S-06).

## Parked

- **Live multi-user jam / real-time collaboration** — Why parked: PRD §Non-Goals; sharing is async links only.
- **Native mobile app** — Why parked: PRD §Non-Goals; web/PWA only.
- **DAW/MIDI/multitrack-stems export & hardware integration** — Why parked: PRD §Non-Goals (weak); only file + MP3 + link.
- **Social graph (profiles, follows, likes, marketplace)** — Why parked: PRD §Non-Goals (weak); sharing is just links.

## Done

- **S-01: user hears a self-evolving synthesized soundscape and can bias it** — Archived
  2026-08-01 → `context/archive/synth-core-instrument/`. The north star shipped: OU engine,
  scale-locked coherence, layered voices, entry-gesture, seed-driven state, macro + pointer
  nudges. Verified headless (zero audio-file requests). Change summary: `[node:3e89baaa]`
  (dormant — promote to keep in live recall). Next slice (S-02) `parent_refs`: `3e89baaa`.
- **F-01: (foundation) app can read/write persistent storage** — Archived 2026-08-01 →
  `context/archive/persistence-backend/`. Cloudflare D1 (amended from MyDevil): adapter +
  binding + schema (users/tracks/shares, shares = self-contained snapshot) + typed data-access
  module + smoke endpoint. Verified on the wrangler-dev worker; instrument stays static.
  Remote provisioning + deploy remain for F-03. Change summary `[node:9078c137]` (dormant —
  promote). Unlocks F-02, S-05, S-06.
- **F-02: (foundation) email login + sessions in place** — Archived 2026-08-02 →
  `context/archive/email-auth/`. Passwordless magic-link auth on D1: single-use tokens,
  stateless HMAC-signed session cookie, pluggable email sender (console local / Resend prod).
  Endpoints `/api/auth/{request,callback,logout,me}`. Additive to the anonymous instrument;
  verified end-to-end on the worker + 35 tests. Real provider/domain/AUTH_SECRET at F-03.
  Follow-up: rate-limit the request endpoint. Change summary `[node:1712705e]` (dormant —
  promote). Unlocks S-05, S-06.
- **S-05: user signs in and saves/loads their tracks** — Archived 2026-08-02 →
  `context/archive/accounts-and-cloud-save/`. Engine.serialize() + session-scoped /api/tracks
  (ownership-enforced) + an additive account/library panel in the island. Verified e2e
  (save/list/load + cross-user isolation). Change summary `[node:a587f6e3]` (dormant — promote).
- **S-09: generative visual layer** — Archived 2026-08-02 → `context/archive/generative-visuals/`.
  Canvas-2D orb field driven by the engine's macro snapshot; reduced-motion aware; additive,
  no backend. Verified headless. Change summary `[node:a76ec921]` (dormant — promote).
- **S-06: publish a track to a public link** — Archived 2026-08-02 →
  `context/archive/public-track-sharing/`. Session-gated POST /api/share → unguessable slug;
  public unauth /s/[slug] mounts the instrument seeded with the shared state. Verified on the
  worker (401/slug/200/404). Change summary `[node:75a1614c]` (dormant — promote).
- **F-03: app deploys to a public URL** — Archived 2026-08-02 → `context/archive/cloudflare-deploy/`.
  LIVE at https://sound-of-loam.teodor-kulej.workers.dev (Workers + remote D1). Instrument,
  visuals, D1, public routes verified live. Trailing config: invalid Resend key disables
  magic-link email until fixed `[node:e2c03bd2]`. Change summary `[node:922f9a4a]` (dormant — promote).
- **S-02: richer nudges + cheap sensors** — Done 2026-08-02 (split across `sensor-feedback` + `nudge-surfaces`, both archived). Sensors (motion/mic/light/time…) shipped in sensor-feedback; nudge surfaces (mood presets, Stir/perturb, New-seed, X-Y pad momentum) in nudge-surfaces. Change summary `[node:a5d856de]`.
- **S-03: save/load a local .loam file** — Archived 2026-08-03 → `context/archive/save-load-state-file/`. Versioned self-contained format; download + upload-to-reload, no account. Round-trip verified. Change summary `[node:f51de156]`.
- **S-04: MP3 export** — Archived 2026-08-03 → `context/archive/mp3-export/`. In-browser MP3 (lamejs): reproducible OfflineAudioContext render from state + live capture. Render→MP3 verified. Change summary `[node:2a363099]`.
- **sensor-feedback (ad-hoc, beyond the original slices)** — Archived 2026-08-02 →
  `context/archive/sensor-feedback/`. SensorHub (pointer/time/battery/viewport + permission-gated
  motion/mic/light + opt-in weather/sun via Open-Meteo) drives visuals + biases the engine, with a
  hidable per-sensor debug bar. Delivered S-02's sensor half; S-02's nudge surfaces (X-Y pad,
  presets, perturb) remain. Cat (S-08) still blocked. Change summary `[node:ed32778a]` (dormant — promote).
