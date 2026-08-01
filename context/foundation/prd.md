---
project: "Sound of Loam"
version: 1
status: draft
created: 2026-08-01
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: null
  after_hours_only: true
---

# Sound of Loam — PRD

## Vision & Problem Statement

Existing ambient-sound tools are built from pre-recorded samples or loops, ship fixed
presets, or are full production environments that require the user to compose. None let a
person *tend* a living, fully-synthesized soundscape that evolves on its own and leans
toward the user's device and surroundings. The result is sameness (loops repeat, presets
are frozen), authoring overhead (capable tools make you build from nothing), and trapped
output (a generative setup cannot be saved as a portable file or shared as a living track).

The insight: a soundscape you *tend rather than author* is a distinct creative posture —
garden, not keyboard. When the system is autonomous and always drifting, biased but never
overridden by real-world signals, the output is personal and alive without the user ever
composing a note. Producing every sound at runtime, with no recordings anywhere, makes each
session weightless, endless, and portable as pure state.

## User & Persona

Primary persona: **the creator themselves** — a self-directed ambient tinkerer building the
instrument first for their own listening and tending. Low ceremony, high curiosity, drawn to
evolving systems; not assumed to be a trained musician. They arrive wanting sound that is
already alive, and they stay to nudge its mood rather than to program it.

Note: differences in audience or mood are modeled as **generation options** (mood presets and
biases), not as separate personas. There is one user type; "who it is for" is a dial, not a
segment.

## Success Criteria

### Primary
- On opening the app, and with no user action, the user hears a fully-synthesized soundscape
  that audibly and continuously evolves on its own — never static, never looping.
- Macro nudges and at least one live input demonstrably bias the sound without ever "playing"
  it for the user: influence, not control.

### Secondary
- The user can save the current system state to a file and reload it to resume/replay.
- The user can download the soundscape as an MP3 file.
- Email login, track ownership, and public share links.
- A generative visual layer that evolves with the sound.

### Guardrails
- **No pre-recorded audio, ever.** Every sound is produced at runtime; no audio recording is
  fetched or played in any flow. Violating this defeats the product.
- The soundscape plays without perceptible dropouts or glitches under normal single-tab use.
- Raw input from the microphone, camera, motion, and location never leaves the device by
  default and is never recorded; only user-derived parameters persist, and only on explicit
  save.
- Core sound and tweaking must work with no account and no network connection.

## User Stories

### US-01: The instrument is alive on arrival
- **Given** a first-time visitor who has not signed in
- **When** they open the app and permit audio playback
- **Then** a fully-synthesized soundscape begins and audibly evolves on its own, with no
  further action required

#### Acceptance Criteria
- Sound is produced with no audio-recording fetched from the network (synthesis only).
- Over a two-minute observation, timbre / density / motion measurably changes (not a loop).
- Moving the pointer produces an audible bias within about one second, which decays back
  toward the system's own drift when the input stops.

## Functional Requirements

### Core synthesis & evolution
- FR-001: User can start a fully-synthesized, live soundscape. Priority: must-have
- FR-002: The system evolves its generative state over time on its own, with no user action. Priority: must-have
  > Socratic: Counter-argument — "autonomous drift could wander into unpleasant or incoherent
  > territory." Resolution: kept; the process must keep output within a coherent range (see
  > NFRs), and the perturb / re-seed control (FR-006) is the escape hatch.
- FR-003: User can nudge generation with a few macro controls (e.g. density, brightness, motion, mood). Priority: must-have

### Nudge surfaces
- FR-004: User can nudge generation via a two-dimensional pad / gesture with momentum and decay. Priority: nice-to-have
- FR-005: User can choose a mood preset / seed to bias the starting state. Priority: nice-to-have
- FR-006: User can perturb / re-seed the system to inject controlled randomness. Priority: nice-to-have
  > Socratic: Counter-argument — "re-seed contradicts 'never fully control'." Resolution:
  > kept; perturb injects randomness, it does not set a deterministic output — still a nudge,
  > not authoring.

### Input signals
- FR-010: Pointer / touch position and movement bias generation. Priority: must-have
- FR-011: Device motion / orientation biases generation. Priority: nice-to-have
- FR-012: Ambient microphone loudness / spectrum (analysed only, never recorded) biases generation. Priority: nice-to-have
- FR-013: Time of day / ambient light / battery level bias slow drift. Priority: nice-to-have
- FR-014: The user's location and the time of day (sun position) bias tonal / day–night drift. Priority: nice-to-have
- FR-015: Weather conditions for the user's location bias texture (e.g. rain = denser, wind = motion). Priority: nice-to-have
- FR-016: A cat's presence, purr, meow, and emotional tone and tempo (via camera and microphone) bias generation. Priority: nice-to-have
  > Socratic: Counter-argument — "cat detection is a large recognition lift for a whimsical
  > input." Resolution: kept as a defining, delightful feature but isolated to its own late
  > slice; may require the user's consent to process environmental data off-device. Never
  > blocks the core instrument.

### Persistence, export, sharing
- FR-020: User can save the current system state to a custom file format and download it. Priority: nice-to-have
- FR-021: User can load a saved state file to resume / replay the system. Priority: nice-to-have
  > Socratic: Counter-argument — "an autonomous, input-biased system cannot reproduce exactly
  > on reload." Resolution: the file captures the starting state (seed + parameters + a format
  > version); replay is reproducible given no live input, and live signals then re-bias from
  > that starting point. Reproducibility is of the starting state, not the exact future.
- FR-022: User can export a reproducible MP3 of a chosen duration rendered from the current state. Priority: nice-to-have
- FR-023: User can capture a live session (with nudges and input) and export it as an MP3. Priority: nice-to-have
- FR-024: User can create an account via email to save and own tracks. Priority: nice-to-have
- FR-025: A user who has not signed in can play and tweak the instrument. Priority: must-have
- FR-026: User can publish a track to a public link that anyone can play without an account. Priority: nice-to-have

### Visuals
- FR-030: A generative visual layer evolves with the sound. Priority: nice-to-have

> Priority note: `must-have` here is scoped to the first shippable version — the synth core
> (open → self-evolving sound → macro nudges → one input → no account, no backend). Items
> marked `nice-to-have` are genuine product requirements sequenced into later milestones
> (save format, MP3, auth, sharing, richer inputs, cat, visuals), not dropped. See
> `## Open Questions` and the roadmap for sequencing.

## Non-Functional Requirements

- Every sound is produced at runtime; no audio recording is fetched or played at any point in
  any flow. (Binary; the product's defining guarantee.)
- The soundscape plays without perceptible dropouts or glitches during continuous single-tab
  use on a mid-range device.
- The autonomous evolution stays within a coherent musical range at all times — it drifts, but
  it does not degenerate into noise or silence unbidden.
- Raw microphone, camera, motion, and location input leaves no trace in any
  operator-accessible storage and is never transmitted off the device by default; only
  user-derived parameters persist, and only when the user explicitly saves.
- Any processing that sends environmental data off the device happens only after explicit,
  revocable user consent.
- Core sound generation and tweaking remain fully usable with no account and no network
  connection.
- A saved file is self-contained and reloadable, and it carries a format version so later
  versions can migrate or decline it gracefully rather than mis-play it.
- A public share link plays for any visitor without an account.
- The product remains usable on the latest two major versions of the mainstream evergreen
  browsers, on desktop and mobile web.

## Business Logic

**The app runs an autonomous, continuously-evolving parameter state that drives live sound
generation through a constrained organic / stochastic process, so the output is always
shifting yet coherent — biased, never overridden, by input signals and user nudges.**

The rule consumes the passage of time (the system drifts on its own), the user's nudges (macro
controls, a two-dimensional push, a chosen mood or seed, a "stir it up" perturbation), and
real-world signals (pointer movement, device motion, ambient microphone loudness, time of day,
ambient light, battery, location and sun position, weather, and a cat's presence and sounds).
Its output is the evolving sound itself, together with a visible sense of the current state.
The user encounters it as a soundscape that is already alive when they arrive and that leans
toward — but is never forced to — where they nudge it; any bias decays back toward the system's
own drift over time. This is explicitly not a records-in-a-list application: the product
continuously decides what to play.

## Access Control

Flat, single user-type model.

- **Not signed in**: can open, play, tweak, and hear the full instrument with no account and no
  network dependency for core sound.
- **Signed in (email)**: required only to save / own tracks and to publish them.
- **Public links**: unauthenticated — anyone with the link can play a shared track. No sign-in,
  no account.

There is no administrator or creator/consumer role split.

## Non-Goals

- **No live multi-user jam / real-time collaboration.** Sharing is asynchronous via public
  links only; synchronised sessions are out of scope.
- **No native mobile app.** Web only (responsive; installable at most); no app-store builds.
- **No production-tool export or hardware integration** (multitrack stems, instrument-control
  hardware) — only the custom state file, MP3, and public link. Weak non-goal; noted so it does
  not creep into the MVP.
- **No social graph** (profiles, follows, likes, or a marketplace). Weak non-goal; sharing is
  just links.

## Open Questions

1. **What does the custom save-file format contain, and how is it versioned?** — Owner: user /
   downstream design. Not blocking for the synth-core MVP (no save in the first slice); must be
   resolved before the save-format milestone.
2. **What are the bounds and default for MP3 export duration**, and how do the reproducible
   render and the live-session capture differ in the UI? — Owner: user / downstream design. By:
   the MP3 milestone.
3. **Is off-device processing of environmental data (for cat detection) acceptable, and under
   what consent model?** — Owner: user. This bears on the privacy guardrail; must be resolved
   before the cat milestone. Block: yes for that milestone only.
4. **What defines "coherent" for the autonomous process** — the constraints that keep drift
   musical? — Owner: downstream design/research. By: the synth-core plan.
