# accounts-and-cloud-save

status: archived
created: 2026-08-02
archived: 2026-08-02
epic: sound-of-loam
memory_goal: de4efd31-9c8d-4ae2-bc72-c738b920f638

## Goal
A signed-in user can save the current soundscape state to their account and see/reload their saved tracks — login required to save/own; the anonymous instrument is untouched.

## Roadmap
Slice S-05. Builds on F-01 (D1 tracks + repo) and F-02 (session/getSession).
Access model [node:4d3e471b], anonymous-first [node:c1b0d7c2], system state [node:cb3ae8cf].

## Archive note
Merged to master (merge commit `940afa1`). Scope deactivated + swept 2026-08-02: 4 nodes
dormant (recoverable via `memory_lifecycle.py activate accounts-and-cloud-save`). Change
summary `[node:a587f6e3]` — promote in the GUI. Verified e2e (save/list/load + cross-user
isolation). Unlocks S-06.
