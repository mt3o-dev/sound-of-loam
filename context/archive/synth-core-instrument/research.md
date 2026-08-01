# Research: synth-core-instrument

Goal: `a82bf842`. Recall loaded the foundation (invariants, concepts, stack) but held no
technical engine knowledge — that was the gap. Codebase is a bare Astro scaffold
(`src/pages/index.astro` default; Svelte + Tailwind in `astro.config.mjs`), no synth code,
no `graphify-out/`. Research was therefore domain/technical, not codebase archaeology.

## Questions & answers

1. **How does drift stay coherent yet always-changing?**
   A mean-reverting random walk (Ornstein–Uhlenbeck) per macro parameter:
   `dx = theta*(mu - x)*dt + sigma*dW`. One process gives autonomous drift (sigma),
   bounded coherence (reversion to mu), and nudge-with-decay (a nudge displaces x, reversion
   pulls it back). → `[node:4e6bb635]`. Coherence is also enforced *by construction*: pitches
   from a fixed scale/mode over a drone root, all params clamped → `[node:98a286b8]`.

2. **How to make it glitch-free?**
   Look-ahead scheduler (schedule ahead of `AudioContext.currentTime` via a worker/interval
   tick — "Tale of Two Clocks"), and all audible `AudioParam` changes via
   `setTargetAtTime`/`linearRampToValueAtTime`, never direct `.value`. → `[node:208861e8]`.

3. **Can it really be "alive on arrival"?**
   Not literally — browser autoplay policy blocks `AudioContext` until a user gesture. Realized
   as a single entry gesture (a Begin control) that resumes the context; after that, no further
   action. Nuances US-01. → `[node:5153e9f6]`.

4. **How to keep the save/MP3/share slices from forcing an engine rewrite?**
   Seed-driven engine from day one (seeded PRNG); system state = {seed, macro params, engine
   version} reproduces drift given no live input. → `[node:d5caec8d]`.

5. **What's the sound architecture?**
   Layered: continuous drone + sparse stochastic melodic/gesture + filtered-noise texture,
   mixed through shared reverb (ConvolverNode w/ synthesized impulse) + delay. Macros bias
   per-layer params, not trigger notes. → `[node:85fa71d6]`.

## Artifacts captured
`[node:4e6bb635]` OU engine core · `[node:98a286b8]` coherence by construction ·
`[node:208861e8]` glitch-free disciplines · `[node:5153e9f6]` autoplay entry-gesture ·
`[node:d5caec8d]` seed-driven engine · `[node:85fa71d6]` layered voice architecture.

Journaled: CONFIRMED coherent-drift + bias-not-control invariants; USED no-audio, tend,
nudge, system-state, anonymous-first, stack.

## Route → /gw-plan
Ground is now understood. Key design decisions to formalize in the plan: OU parameter model,
scale-locked coherence, look-ahead scheduler, entry-gesture, seed-driven state, layered voices.
