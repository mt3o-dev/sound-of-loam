# Plan: generative-visuals (S-09)

Goal `1ee25a1e`. A cheap, tasteful generative background that reads the engine's live
macro snapshot and drifts with it. Client-only, additive `[node:c1b0d7c2]`.

## Approach
`Visualizer.svelte` — a fixed full-bleed `<canvas>` behind the UI. A rAF loop reads a
`snapshot: () => Macros | null` prop (SynthCore passes `() => engine?.running ? engine.snapshot() : null`).
Render a handful of soft radial-gradient orbs on a dark field:
- **mood** → palette hue (cool/deep → warm), **brightness** → luminance,
- **density** → number of active orbs, **motion** → drift speed.
Cheap: ~10-14 orbs, canvas 2D, `lighter` blend, low alpha. When snapshot is null (not started)
the canvas fades to the base background. Honor `prefers-reduced-motion` (freeze/slow).

## Non-goals
WebGL/shaders, audio-FFT-driven visuals, per-note reactivity. Just macro-state drift.

## Phases
### Phase 0 — Visualizer component + wiring
Add `Visualizer.svelte`; mount it in `SynthCore` as a fixed background; pass the snapshot getter.
Pause rAF on destroy; DPR-aware sizing; resize handling.
- **Verify:** `astro check` + build clean; headless — canvas present, animates a few frames with
  no errors, and the instrument (audio) still works unchanged (re-run audio verify).

## Risks
- **Stealing audio CPU** → cap orb count, single rAF, no per-frame allocations in the loop; the
  audio scheduler is independent (its own timer).
- **Reduced-motion / accessibility** → respect the media query.
