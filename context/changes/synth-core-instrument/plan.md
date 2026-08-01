# Plan: synth-core-instrument

Goal `a82bf842`. Deliver the north star: open → single entry gesture → fully-synthesized,
self-evolving soundscape → biasable by macro controls + pointer. Client-only Svelte island,
no backend/network. Grounds: `[node:4e6bb635]` OU engine, `[node:98a286b8]` coherence-by-
construction, `[node:208861e8]` glitch-free disciplines, `[node:5153e9f6]` entry-gesture,
`[node:d5caec8d]` seed-driven, `[node:85fa71d6]` layered voices, `[node:ccccdf98]` stack.

## Non-goals (deferred to later slices)
Save/load state file, MP3 export, login, sensors beyond pointer (motion/mic/sun/weather/cat),
full generative visuals. A minimal state indicator is allowed; a full visual layer is S-09.

## Architecture
Pure-TS engine primitives (no Web Audio) ← unit-testable → separated from the audio-graph
layer. Engine is seed-driven so later render/MP3/share slices reuse it unchanged.

```
src/lib/engine/
  prng.ts        # seeded PRNG (mulberry32)
  ou.ts          # Ornstein–Uhlenbeck param: baseline drift + decaying user bias
  scale.ts       # scale/mode + drone root → coherent pitch set
  state.ts       # SystemState = {seed, macros, engineVersion}; types
  voices.ts      # drone / melodic / texture voice builders (Web Audio)
  audioGraph.ts  # AudioContext, master bus, reverb (Convolver+synth impulse), delay
  scheduler.ts   # look-ahead scheduler (worker/interval tick)
  engine.ts      # orchestrator: ties primitives → voices → scheduler; macro→param mapping
src/components/SynthCore.svelte   # island: entry gesture, controls, pointer, indicator
src/layouts/Layout.astro          # imports src/styles/global.css (Tailwind)
src/pages/index.astro             # static shell + <SynthCore client:only="svelte" />
```

## Phases (each ends in a verifiable state)

### Phase 0 — Island shell + entry gesture
Wire Tailwind (`import '../styles/global.css'` in Layout), mount `SynthCore.svelte` as
`client:only`, render a "Begin" control. No audio yet.
- **Verify:** `npm run build` passes; dev server shows the page + Begin button; Tailwind styles apply.

### Phase 1 — Engine primitives (pure TS, tested)
`prng.ts`, `ou.ts`, `scale.ts`, `state.ts`. Add Vitest. OU: `x += theta*(mu-x)*dt + sigma*randn()`;
user bias is a separate additive term that decays `bias *= exp(-dt/tau)` `[node:58044d71]`.
Coherence by construction `[node:98a286b8]`.
- **Verify:** `npx vitest run` — OU stays within bounds over long runs; same seed → identical
  sequence `[node:d5caec8d]`; every generated pitch ∈ the scale set.

### Phase 2 — Audio graph + scheduler (the sound)
`audioGraph.ts`, `voices.ts`, `scheduler.ts`, `engine.ts`. Layered drone + sparse melodic +
filtered-noise texture through shared reverb/delay `[node:85fa71d6]`. Look-ahead scheduler;
all audible params via `setTargetAtTime`/ramps `[node:208861e8]`. AudioContext resumed inside
the Begin gesture handler `[node:5153e9f6]`.
- **Verify:** driving the app — Begin → sound starts, audibly evolves over 2 min (not looping),
  no dropouts; Network tab shows zero audio-file requests `[node:35763b2a]`; works offline.

### Phase 3 — Nudge surface (bias, not control)
Macro sliders (density, brightness, motion, mood) + pointer X-Y pad, each injecting into the
OU user-bias term `[node:ad1ea535]` `[node:58044d71]`. Optional minimal state indicator.
- **Verify:** moving a control/pointer audibly biases the sound within ~1s and, on release,
  decays back toward the system's own drift; the sound is never "played" note-for-note.

### Phase 4 — End-to-end verification & polish
Confirm US-01 acceptance holds; tune OU/scale params for a pleasant result; confirm anonymous +
offline `[node:c1b0d7c2]`.
- **Verify:** full US-01 walk in a real browser; coherence holds (`[node:fe1e63ac]`); no glitches.

## Risks
- **Audio perf/glitches** → keep voice count modest, reuse/disconnect nodes; AudioWorklet only if standard nodes prove insufficient (later).
- **Autoplay** → entry gesture resumes context (Phase 2) `[node:5153e9f6]`.
- **OU tuning for pleasantness** → iterate theta/sigma/tau and scale choice in Phase 4; coherence is guaranteed structurally, "pleasant" is the tuning work.

## Route
Multi-phase, judgment-heavy (sound design) → after `/gw-plan-review`, `/gw-implement`.
