---
project: "Sound of Loam"
context_type: greenfield
created: 2026-08-01
updated: 2026-08-01
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: "primary persona"
      decision: "built for the creator (self) first; audience/mood differences become a generation OPTION, not a product segment"
    - topic: "access model"
      decision: "anonymous play + tweak; email login only to save/own; public links are unauthenticated read/play; flat user model"
    - topic: "input signals"
      decision: "pointer/X-Y, device motion, mic level, time/light/battery (cheap, MVP-eligible) + sun position, weather, cat (camera+audio ML) as later slices"
    - topic: "nudge surface"
      decision: "macro sliders + X-Y pad + mood presets/seeds + perturb/re-seed — all bias, never author"
    - topic: "MVP first-flow"
      decision: "synth core only: open -> self-evolving synthesized sound -> macro nudges -> one cheap sensor; no save/login/export"
    - topic: "MP3 export semantics"
      decision: "both deterministic render-from-state AND live-session capture; user chooses"
    - topic: "privacy"
      decision: "on-device analysis by default, raw sensor/mic/camera/location never uploaded; heavy ML (cat) may be opt-in cloud with explicit consent"
    - topic: "visuals"
      decision: "generative visual layer in scope as nice-to-have / later slice; audio is the product"
    - topic: "non-goals"
      decision: "no live multi-user jam; no native mobile app (web/PWA only)"
    - topic: "timeline"
      decision: "hobby project; no hard deadline; after-hours; 3-week working target for the synth-core MVP"
  frs_drafted: 27
  quality_check_status: accepted
---

# Shape notes: generative ambient soundscape instrument

> Seed (verbatim): "Generative ambient soundscape instrument. No samples, no recordings —
> everything synthesized live in the browser with the Web Audio API, driven by a slowly
> evolving system you can nudge but never fully control. Use available sensors and input
> methods to influence the generation. Allow user to save as custom file format and
> download as mp3. Login via email. Sharing tracks via public links."

## Vision & Problem Statement

Existing ambient-sound tools are sample- or loop-based, ship static presets, or are full
DAWs/modular rigs that demand you compose. None let a person *tend* a living, fully
synthesized soundscape that evolves on its own and reacts to their device and environment.
The result is sameness (loops repeat, presets are fixed), authoring overhead (powerful
tools make you build from zero), and trapped output (a generative setup can't be saved as
a portable file or shared as a living track).

The insight: a soundscape you *tend rather than author* is a distinct creative posture —
"garden, not keyboard." When the system is autonomous and always drifting, biased (never
overridden) by real-world signals, the output is personal and alive without the user ever
composing a note. Synthesis-only (no samples, ever) makes each session weightless,
infinite, and portable as pure state.

## User & Persona

Primary persona: **the creator themselves** — a self-directed ambient tinkerer building
this first for their own listening/tending. Low ceremony, high curiosity, enjoys evolving
systems. Not assumed to be a musician.

Note (load-bearing for design): audience/mood differences are modeled as **generation
options** (mood presets, biases) rather than distinct product personas. There is one user
type; "who it's for" is a dial, not a segment.

## Access Control

- **Anonymous**: can open, play, tweak, and hear the full instrument with no account and
  no network dependency for core sound.
- **Email login**: required only to **save/own** tracks and to **publish** them.
- **Public links**: unauthenticated — anyone with the link can play a shared track.
- Flat user model. No admin/creator role split.

## Success Criteria

### Primary
- Open the app and, with no user action, hear a fully-synthesized soundscape that
  audibly and continuously evolves on its own (never static, never looping).
- Macro nudges and at least one live sensor demonstrably bias the sound without ever
  "playing" it for the user (influence, not control).

### Secondary
- Save the system state to a custom file and reload it to resume/replay.
- Export the soundscape as MP3.
- Email login, track ownership, and public share links.
- A generative visual layer that evolves with the sound.

### Guardrails
- **No pre-recorded audio, ever.** 100% of sound is synthesized at runtime; zero audio
  files fetched or played. Violating this defeats the product.
- Audio must run without perceptible dropouts/glitches under normal single-tab load.
- Raw sensor/mic/camera/location data never leaves the device by default; nothing is
  recorded. Only derived parameters persist, and only on explicit save.
- Core sound + tweak must work with no account and no network.

## Business Logic

**The app runs an autonomous, continuously-evolving parameter state that drives live
synthesis via a constrained organic/stochastic process, so the output is always shifting
yet coherent — biased, never overridden, by sensor inputs and user nudges.**

Inputs the rule consumes (as user-facing inputs, not components): the passage of time
(the system drifts on its own), the user's nudges (macro dials, an X-Y push, a chosen
mood/seed, a "stir it up" perturbation), and real-world signals (pointer movement, device
motion, ambient mic loudness, time-of-day/light/battery, sun position, weather, and a
cat's presence/purr/meow/mood). Its output is the evolving sound itself plus a visible
sense of the current state. The user encounters it as a soundscape that is already alive
when they arrive and that leans toward — but is never forced to — where they nudge it;
influence decays back toward the system's own drift over time.

This is explicitly not CRUD: the application continuously *decides* what to play.

## Functional Requirements

### Core synthesis & evolution
- FR-001: User can start a fully-synthesized, live soundscape in the browser. Priority: must-have
- FR-002: The system autonomously evolves its generative state over time with no user action. Priority: must-have
  > Socratic: Counter-argument — "autonomous drift could wander into unpleasant/incoherent
  > territory." Resolution: kept; the constrained process must keep output within a
  > coherent range (a design constraint, captured as NFR), and the perturb/re-seed control
  > (FR-006) is the escape hatch.
- FR-003: User can nudge generation with a few macro sliders (e.g. density, brightness, motion, mood). Priority: must-have

### Nudge surfaces
- FR-004: User can nudge generation via an X-Y pad / gesture with momentum & decay. Priority: nice-to-have
- FR-005: User can choose a mood preset / seed to bias the starting state. Priority: nice-to-have
- FR-006: User can perturb / re-seed the system to inject controlled randomness. Priority: nice-to-have
  > Socratic: Counter-argument — "re-seed contradicts 'never fully control'." Resolution:
  > kept; perturb injects randomness, it does not set a deterministic output — still a
  > nudge, not authoring.

### Input signals / sensors
- FR-010: Pointer / touch position & movement bias generation. Priority: must-have
  (the one cheap, permissionless MVP sensor)
- FR-011: Device motion / orientation biases generation. Priority: nice-to-have
- FR-012: Ambient mic level/spectrum (analysis only, never recorded) biases generation. Priority: nice-to-have
- FR-013: Time-of-day / ambient light / battery bias slow drift. Priority: nice-to-have
- FR-014: Sun position (geolocation + clock) biases tonal/day-night drift. Priority: nice-to-have
- FR-015: Weather conditions (by location) bias texture (e.g. rain=denser, wind=motion). Priority: nice-to-have
- FR-016: Cat signals — presence, purr, meow, emotional tone & tempo (camera + audio ML) — bias generation. Priority: nice-to-have
  > Socratic: Counter-argument — "cat detection is a huge ML lift for a whimsical input."
  > Resolution: kept as a defining, delightful feature but isolated to its own late slice;
  > may require opt-in cloud ML. Never blocks the core instrument.

### Persistence, export, sharing
- FR-020: User can save the current system state to a custom file format and download it. Priority: nice-to-have
- FR-021: User can load a saved state file to resume / replay the system. Priority: nice-to-have
  > Socratic: Counter-argument — "an autonomous, sensor-biased system can't reproduce
  > exactly on reload." Resolution: the file captures seed + parameter state + engine
  > version; replay is deterministic *given no live sensor input*; live signals then
  > re-bias from that starting point. Reproducibility is of the starting state, not the
  > exact future.
- FR-022: User can export a deterministic MP3 render of a chosen duration from the current state. Priority: nice-to-have
- FR-023: User can capture a live session (with nudges & sensor input) and export it as MP3. Priority: nice-to-have
- FR-024: User can create an account via email to save & own tracks. Priority: nice-to-have
- FR-025: Anonymous user can play & tweak the instrument without logging in. Priority: must-have
- FR-026: User can publish a track to a public link that anyone can play without an account. Priority: nice-to-have

### Visuals
- FR-030: A generative visual layer evolves with the sound. Priority: nice-to-have

> Priority note: `must-have` here is scoped to the **synth-core MVP** (open → self-evolving
> sound → macro nudges → one sensor → anonymous, no backend). Everything marked
> `nice-to-have` is a real product requirement but is **sequenced into later roadmap
> slices** (save/format, MP3, auth, sharing, richer sensors, cat, visuals) — not dropped.
> See `## Forward: technical-roadmap`.

## User Stories

### US-01: The instrument is alive on arrival
- **Given** a first-time anonymous visitor
- **When** they open the app and permit audio playback
- **Then** a fully-synthesized soundscape begins and audibly evolves on its own, with no
  further action required

#### Acceptance Criteria
- Sound is produced with zero audio-file network requests (synthesis only).
- Over a 2-minute observation the timbre/density/motion measurably changes (not a loop).
- Moving the pointer (FR-010) produces an audible bias within ~1s, which decays back
  toward the system's own drift when input stops.

## Non-Functional Requirements

- 100% of audio is synthesized at runtime — no audio-file assets are fetched or played
  at any point in any flow. (Binary; the product's defining guarantee.)
- The soundscape plays without perceptible dropouts or glitches during continuous
  single-tab use on a mid-range device.
- Raw sensor, microphone, camera, and location data leave no trace in any
  operator-accessible storage and are never transmitted off-device by default; only
  user-derived parameters persist, and only when the user explicitly saves.
- Any processing that sends environmental data off-device (e.g. cloud cat ML) happens
  only after explicit, revocable user consent.
- Core sound generation and tweaking remain fully usable with no account and no network
  connection.
- A saved custom-format file is self-contained and reloadable; it carries an engine
  version so future versions can migrate or refuse gracefully rather than mis-play.
- A public share link plays for any visitor without an account.
- The product remains usable on the latest two major versions of the mainstream evergreen
  browsers, on desktop and mobile web.

## Non-Goals

- **No live multi-user jam / real-time collaboration.** Sharing is asynchronous via public
  links only; synchronized sessions are out of scope.
- **No native mobile app.** Web (responsive, PWA at most); no App Store / Play Store builds.
- (Weak, not hard-ruled — noted so they don't creep into MVP) No DAW/MIDI/multitrack-stems
  export, and no social feed / profiles / marketplace. Only the custom state file + MP3 +
  public link.

## Forward: tech-stack
*(informational — for /10x-tech-stack-selector, not part of the PRD schema)*

- Client-heavy by nature: the instrument is Web Audio API synthesis running entirely in the
  browser; the MVP synth-core slice needs **no backend at all**.
- A backend/BaaS enters only for later slices: email auth, saved-track storage, and public
  share links. Choose a stack that lets slice 1 ship fully client-side and adds persistence
  later without a rewrite.
- MP3 encoding: prefer in-browser (WASM encoder) to preserve the "browser-only" ethos;
  server-side render is a fallback to weigh at stack time.
- Cat ML (FR-016) may justify an opt-in cloud path; keep it isolable behind consent.
- No language/framework avoid-list was specified by the user.

## Forward: technical-roadmap
*(informational — for /10x-roadmap, not part of the PRD schema)*

Suggested slice order (synth-core first, per approved plan):
1. **Synth core** — self-evolving synthesized sound + macro nudges + pointer sensor. No backend.
2. Richer nudge surfaces (X-Y pad, mood presets, perturb) + more cheap sensors (motion, mic, time/light/battery).
3. Custom save-format + local load/reload.
4. MP3 export (deterministic render, then live capture).
5. Email auth + track ownership.
6. Public share links.
7. Environmental signals: sun position, weather.
8. Cat detection (camera + audio ML; opt-in cloud).
9. Generative visual layer.

## Quality cross-check

Status: **accepted** — no gaps.

- Access Control: present.
- Business Logic (one-sentence rule): present.
- Project artifacts: present.
- Timeline-cost acknowledged: present (hobby project, no hard deadline; 3-week working
  target for the small synth-core MVP).
- Non-Goals: present.
