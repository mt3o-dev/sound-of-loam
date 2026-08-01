---
memory_goal: f08e69b8-001b-408c-a5cd-05696d91441e
change_node: 591fa4b1-cd07-4732-b455-47477fdd95d1
distilled: 2026-08-01
---

# Foundation → graph distillation

The foundation documents (`prd.md`, `roadmap.md`, `tech-stack.md`) remain the human-readable
source of truth. This file records their **normative content** as it was distilled into the
`agentic-memory` graph under the `foundation` scope, so a future amendment session can find
the nodes an edit invalidates.

All nodes below are **lifetime-promotion candidates** — foundation knowledge that must survive
every change sweep. They are captured at `mid-term`; a human promotes them to lifetime in the
GUI (the agent never promotes). Until promoted, they go dormant on the next sweep.

## Captured nodes

### Invariants (always hold)
| Node | Statement |
| --- | --- |
| `35763b2a` | No pre-recorded audio, ever — 100% synthesized at runtime. |
| `58044d71` | Influence is bias, never control; bias decays back to the system's own drift. |
| `fe1e63ac` | Autonomous evolution stays within a coherent musical range; never degenerates unbidden. |

### Constraints (rules every change obeys)
| Node | Statement |
| --- | --- |
| `3037236e` | Privacy: raw mic/camera/motion/location stays on-device by default, never recorded; off-device needs explicit consent. |
| `c1b0d7c2` | Anonymous-first: core sound + tweak usable with no account and no network; login is additive. |
| `306c084e` | Git: work lands on main via merge commit from a per-change branch; Conventional Commits; self-review at /gw-review. |
| `0857d056` | Save-file format is self-contained and version-stamped (migrate or decline old files gracefully). |

### Concepts (domain language)
| Node | Statement |
| --- | --- |
| `b8212a2f` | "Tend, not author" (garden, not keyboard) — cultivate by nudging, not composing. |
| `ad1ea535` | "Nudge" — input that biases the engine without deterministic output; decays over time. |
| `cb3ae8cf` | "System state" — seed + params; the unit saved/reloaded/rendered/shared. |

### Decisions (with the why)
| Node | Statement | Edges |
| --- | --- | --- |
| `ccccdf98` | Stack: Astro islands + Svelte + TS + Tailwind; synth core is a client-only island. | — |
| `0005f4be` | Runtime/hosting: Cloudflare Pages/Workers (edge). | — |
| `84fcdc4b` | ~~Persistence: SQLite on MyDevil (over a BaaS) for control/cost.~~ **SUPERSEDED by `0d98d40a` (D1); flagged for review.** | DEPENDS_ON `0005f4be` |
| `4d3e471b` | Access model: anon play; login to save/own; public links unauth; flat roles. | DEPENDS_ON `c1b0d7c2` |
| `4e4060ca` | Git: feature-branch → merge commit to main; Conventional Commits. | DEPENDS_ON `306c084e` |
| `1cade23e` | MP3 export: reproducible render + live capture; in-browser encode preferred. | DEPENDS_ON `cb3ae8cf` |

### Issues (accepted open gaps)
| Node | Statement | Edges |
| --- | --- | --- |
| `3bf08d2f` | ~~Cloudflare↔MyDevil bridge (thin API vs D1) must be chosen before accounts/storage/sharing.~~ **DISSOLVED by `0d98d40a` (D1 = no bridge); flagged for review.** | DEPENDS_ON `84fcdc4b`, `0005f4be` |
| `413e88af` | Cat detection: off-device consent model + recognition approach unresolved; blocks cat slice. | DEPENDS_ON `3037236e` |

## Amendments

### 2026-08-01 — Persistence: MyDevil-SQLite → Cloudflare D1
- `0d98d40a` (decision) — Persistence backend = Cloudflare D1, not SQLite-on-MyDevil.
  CONTRADICTS `84fcdc4b` and `3bf08d2f` (both auto-flagged for review); DEPENDS_ON
  `0005f4be` (CF runtime) and `4530f889`.
- `4530f889` (concept) — persistence workload is tiny + low-write → store choice is ops, not perf.
- `f91239cb` (issue) — accepted D1 tradeoffs (data on CF / vendor lock / single-primary
  serialized writes / size caps); non-issues at hobby scale.
- Human action: in the GUI review queue, close/supersede `84fcdc4b` and `3bf08d2f`, and
  promote `0d98d40a` + `4530f889`.

## Post-distillation

- **Promotion pending (human).** All 18 nodes are lifetime candidates — promote in the GUI.
- **Deactivate-and-sweep pending.** After promotion, run
  `memory_lifecycle.py deactivate foundation --sweep` (a `/gw-resolve` step). Promoted nodes
  survive in the root set; anything declined goes dormant. Not run yet — promotion first.
