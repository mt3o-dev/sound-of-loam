# Plan: nudge-surfaces (S-02)

Goal `d7ed233c`. Richer nudges, all bias-not-control `[node:58044d71]`.

## Engine additions (pure-ish, tested)
- `Engine.perturb(amount=0.4)` — nudge every macro by `(rng()-0.5)*amount`: a transient "stir"
  that decays back (FR-006). Uses the seeded rng.
- `Engine.reseed(seed?)` — reset the PRNG to a new seed and update `state.seed`, giving a fresh
  drift path without tearing down audio (FR-006 / seed).
- `applyMacros(partial)` — set several macro means at once (for presets).
- `MOOD_PRESETS` in `state.ts` — Calm / Restless / Deep / Bright (macro value sets) (FR-005).

## UI (SynthCore)
A "nudge" row (when started): preset buttons (apply via setMacro → drift toward), **Stir**
(perturb), **New seed** (reseed). X-Y pad gains light **momentum**: track pointer velocity, and
on release apply a final velocity-scaled nudge (the OU bias then decays) (FR-004).

## Phases
### Phase 0 — Engine methods + presets + tests
- **Verify:** Vitest — perturb moves values then they decay; reseed with same seed reproduces,
  different seed diverges; applyMacros sets means; presets are valid 0..1.
### Phase 1 — UI wiring
Preset/Stir/New-seed controls + pad momentum in SynthCore.
- **Verify:** `astro check` + build; headless — controls present, clicking Stir/preset changes the
  live indicator, audio intact, no errors.

## Non-goals
New sensors (done), per-preset persistence, custom preset editor.

## Route
After a quick self plan-review, `/gw-implement`.
