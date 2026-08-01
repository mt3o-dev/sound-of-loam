# context/

The split that governs this directory:

- **Files here = lifecycle artifacts.** Thin, human-readable state for a change or the
  project: `change.md`, `plan.md`, `research.md`, foundation documents.
- **Graph = knowledge.** Decisions, constraints, issues, concepts, and invariants live in
  the `agentic-memory` graph (store: `context/memory-graph.db`), not in these files.

## Layout

- `changes/<change-id>/` — active changes. Lifecycle files only (`change.md` carries
  `memory_goal`, plus `plan.md`, `research.md`). No per-change `notes/`, `research/`, or
  `decisions/` subfolders — the graph replaces those.
- `archive/<change-id>/` — **immutable, append-only.** No skill writes here beyond the
  archive move. If a target path starts with `context/archive/`, stop and open a new
  change with `/gw-new`.
- `foundation/` — PRD, roadmap, tech-stack, ADRs: the human source of truth, mirrored
  into the graph at lifetime tier via `/gw-foundation`.

The SQLite store is gitignored; sync it via the memory repo's `scripts/dump_db.py` /
`restore_db.py` round-trip (dump before push, restore after pull).
