# synth-core-instrument

status: archived
created: 2026-08-01
archived: 2026-08-01
epic: sound-of-loam
memory_goal: a82bf842-ca53-413e-8d57-cad057497dc9

## Goal
User opens the app and hears a fully-synthesized, self-evolving ambient soundscape, and can bias it with a few macro controls and pointer movement — no account, no backend, no network.

## PRD refs
US-01; FR-001, FR-002, FR-003, FR-010, FR-025. Roadmap slice S-01 (north star).

## Archive note
Merged to master (merge commit `e899e07`). Memory scope deactivated + swept
2026-08-01: 12 short/mid-term nodes went dormant (recoverable via
`memory_lifecycle.py activate synth-core-instrument`). Change-summary node
`3e89baaa` and the seeded-PRNG lesson `95607089` were **not promoted** before the
sweep — promote in the GUI (after reactivating) so future recall surfaces them.
Surviving-node handoff for the next slice's `parent_refs`: `3e89baaa`
(change summary), plus foundation nodes.
