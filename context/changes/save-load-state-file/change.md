# save-load-state-file

status: open
created: 2026-08-03
epic: sound-of-loam
memory_goal: 8f1bb3f4-a2d9-45db-9611-9f6eebfa4ef0

## Goal
A user can save the current soundscape to a custom, versioned file and download it, then load that file back to resume — all local, no account.

## Roadmap
Slice S-03. FR-020 (save custom format + download), FR-021 (load). Reuses Engine.serialize;
self-contained + version-stamped format [node:0857d056], system state [node:cb3ae8cf].
Anonymous-first [node:c1b0d7c2] — no login needed.
