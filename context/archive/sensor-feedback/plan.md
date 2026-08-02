# Plan: sensor-feedback

Goal `dab57e87`. Every sensor the app reads visibly affects the visualization AND biases the
engine (bias-not-control `[node:58044d71]`), plus a hidable debug bar of live sensor states.
Cat deferred (S-08 blocked). Weather/sun opt-in behind consent (off-device → privacy
`[node:3037236e]`).

## Architecture
`src/lib/sensors/` — a `SensorHub` over pluggable `SensorSource`s. Each source exposes
`{ id, label, status: 'unsupported'|'idle'|'prompt'|'granted'|'denied', value: number (0..1),
detail?: string }` and updates itself. The hub gives a `snapshot()` (all sources) each frame.
- Visualizer reads the snapshot to modulate visuals (in addition to engine macros).
- Engine gets sensor bias: a small adapter maps sensor values → `engine.nudge(macro, delta)`
  (decaying bias, never control).
- Debug bar renders the snapshot: id, value bar, status.

## Sensors
- **pointer** (have) · **time-of-day** · **battery** (getBattery) · **viewport/scroll** —
  cheap, no permission.
- **device motion/orientation** (DeviceMotion/Orientation; iOS requires a tap to grant).
- **mic level** (getUserMedia + AnalyserNode RMS; never recorded `[node:35763b2a]` — analysis only).
- **ambient light** (AmbientLightSensor; degrade to `unsupported` where absent).
- **weather + sun** (opt-in): geolocation → Open-Meteo (no API key, CORS) for temp/precip/
  wind/cloud/is_day; sun altitude computed locally from lat/lon+time. Off by default; enabling
  triggers the consent + geolocation prompt.

## Phases
### Phase 0 — Hub + cheap sources + debug bar + wiring
`SensorHub`, `SensorSource` iface, sources: pointer/time/battery/viewport. `SensorBar.svelte`
(hidable). Wire hub → Visualizer modulation + engine bias adapter.
- **Verify:** Vitest for hub (registration, snapshot, normalization, status). Headless: debug bar
  toggles, shows cheap sensors active, visuals still animate, instrument works.

### Phase 1 — Permission-gated local sources
motion/orientation, mic level, ambient light. Each: enable action in the bar, status transitions,
graceful `unsupported`/`denied`. Mic uses an AnalyserNode (no recording).
- **Verify:** Vitest for status logic (mocked); headless: sources show correct status when APIs
  absent (unsupported) without errors; instrument unaffected.

### Phase 2 — Weather + sun (opt-in, consent)
A `weather` source: off until the user enables "location-based weather" (explicit consent copy),
then geolocation → Open-Meteo fetch (cached, low poll). Sun altitude from lat/lon+time.
- **Verify:** Vitest for the Open-Meteo response→value mapping + sun math (pure). Headless: source
  is `idle` until enabled; no network/location without consent (privacy).

### Phase 3 — End-to-end
- **Verify:** `astro check` + build + vitest green; headless run — bar hides/shows, each available
  sensor reports state, visuals respond, engine biased, instrument fully usable with ALL sensors
  off (anonymous/offline), zero audio-file requests, no console errors.

## Non-goals
Cat (S-08, blocked). Persisting sensor prefs. Per-sensor mapping UI (fixed sensible mappings).

## Risks
- **Privacy** → weather/sun strictly opt-in; mic/camera analysis on-device; nothing recorded.
- **Permission UX / availability** → every source degrades to a clear status; the instrument never
  depends on any sensor (anonymous-first `[node:c1b0d7c2]`).
- **Perf** → one rAF for visuals reads the snapshot; sources update on their own cadence; mic uses
  a single AnalyserNode; no per-frame allocations.

## Route
After `/gw-plan-review`, `/gw-implement`.
