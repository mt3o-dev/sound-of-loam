---
starter_id: astro
package_manager: npm
project_name: sound-of-loam
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: verified
  path_taken: custom
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: true
  has_ai: true
  has_background_jobs: false
customizations:
  ui_framework: svelte          # Astro islands rendered with Svelte (not the starter's React default)
  styling: tailwind
  language: typescript
  persistence: cloudflare-d1    # AMENDED 2026-08-01: was SQLite-on-MyDevil; see [node:0d98d40a]
  runtime: cloudflare           # Cloudflare Pages/Workers serve the app + edge functions
---

## Why this stack

Sound of Loam is a browser instrument: the hard, novel part (live audio synthesis + an
autonomous evolving engine) runs entirely client-side and needs no backend for the first
milestone. Astro's islands architecture fits this exactly — a static, fast shell with the
synth engine mounted as a single interactive **Svelte** island (TypeScript, Tailwind).
Cloudflare Pages/Workers give cheap, global edge hosting for the app and, later, the
public share pages. Persistence (saved tracks, accounts, share records) is **Cloudflare D1**
(managed edge SQLite) — see the amendment below; the workload is tiny/low-write, so D1 is
free at this scale and its native Worker binding removes the earlier host-to-edge bridge.
Every quality gate holds: Astro + Svelte + TS are typed, popular in training data, and well
documented. The base `astro` starter is `verified` for bootstrapping; the deviations
(Svelte islands, Tailwind, D1) are added on top after scaffolding.

## Deviations from the base starter (bootstrapper: apply after scaffold)

The base `astro` starter scaffolds plain Astro + TypeScript. After `npm create astro`, add:
- `npx astro add svelte` — Svelte integration for interactive islands.
- `npx astro add tailwind` — Tailwind CSS.
- `npx astro add cloudflare` — Cloudflare adapter (runtime target).
- Cloudflare D1 binding + schema for the persistence layer (added at the persistence
  milestone / F-01, not slice 1).

## Persistence: RESOLVED — Cloudflare D1 (amended 2026-08-01)

The earlier plan (SQLite-on-MyDevil + Cloudflare runtime) required a bridge, because
Cloudflare Workers cannot open a SQLite file on MyDevil's disk. **That is superseded.**
Persistence is now **Cloudflare D1** (managed edge SQLite, native Worker binding), which
removes the bridge entirely.

- Reasoning + graph record: decision `[node:0d98d40a]` (CONTRADICTS the MyDevil decision
  `[84fcdc4b]` and the bridge issue `[3bf08d2f]`, both now flagged for review); backing
  fact `[node:4530f889]` (tiny low-write workload); accepted tradeoffs `[node:f91239cb]`
  (data on Cloudflare / vendor lock / single-primary serialized writes / size caps).
- This does NOT block the synth-core MVP (slice 1 has no backend). F-01 shrinks to
  "add a D1 binding + schema."
