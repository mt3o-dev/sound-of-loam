# mp3-export

status: archived
created: 2026-08-03
archived: 2026-08-03
epic: sound-of-loam
memory_goal: f6e15819-6a46-4718-8ad2-99da306a21c6

## Goal
A user can download the soundscape as an MP3 — a reproducible render of a chosen duration from the current state, or a capture of the live session — all encoded in-browser.

## Roadmap
Slice S-04. FR-022 (deterministic render from state), FR-023 (live capture). In-browser encode
per [node:1cade23e]; synthesis-only preserved [node:35763b2a]; reproducible render leans on the
seed-driven engine [node:cb3ae8cf].

## Archive note
Merged to master (`586aa92`). Scope swept: 2 nodes dormant. Change summary `[node:2a363099]`. Deterministic render→MP3 verified headless; live capture implemented. Not yet redeployed.
