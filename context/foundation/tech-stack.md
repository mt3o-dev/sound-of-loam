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
  persistence: sqlite
  persistence_host: mydevil     # SQLite file lives on MyDevil shared hosting
  runtime: cloudflare           # Cloudflare Pages/Workers serve the app + edge functions
---

## Why this stack

Sound of Loam is a browser instrument: the hard, novel part (live audio synthesis + an
autonomous evolving engine) runs entirely client-side and needs no backend for the first
milestone. Astro's islands architecture fits this exactly — a static, fast shell with the
synth engine mounted as a single interactive **Svelte** island (TypeScript, Tailwind).
Cloudflare Pages/Workers give cheap, global edge hosting for the app and, later, the
public share pages. Persistence (saved tracks, accounts, share records) is **SQLite hosted
on MyDevil**, reached from the app's server/edge functions — chosen deliberately over a
managed BaaS for control and low cost. Every quality gate holds: Astro + Svelte + TS are
typed, popular in training data, and well documented. The base `astro` starter is
`verified` for bootstrapping; the deviations (Svelte islands, Tailwind, SQLite/MyDevil)
are added on top after scaffolding.

## Deviations from the base starter (bootstrapper: apply after scaffold)

The base `astro` starter scaffolds plain Astro + TypeScript. After `npm create astro`, add:
- `npx astro add svelte` — Svelte integration for interactive islands.
- `npx astro add tailwind` — Tailwind CSS.
- `npx astro add cloudflare` — Cloudflare adapter (runtime target).
- A SQLite client/driver for the persistence layer (added at the persistence milestone,
  not slice 1).

## Architecture decision to resolve before the persistence milestone

**Cloudflare runtime + SQLite-on-MyDevil is a hybrid that needs a bridge.** Cloudflare
Workers/Pages functions cannot open a SQLite file living on MyDevil's disk directly. Before
the auth/storage/sharing slices, choose one:

1. **Thin persistence API on MyDevil** — a small service on MyDevil owns the SQLite file
   and exposes it over HTTP(S); Cloudflare functions call it. (Matches the user's stated
   intent most directly.)
2. **Move edge-adjacent data to Cloudflare D1** (edge SQLite) and keep MyDevil for
   heavier/off-edge storage — revisit only if #1 proves too slow.

This does NOT block the synth-core MVP (slice 1 has no backend). Tracked as PRD Open
Question #1 territory and to be settled at the persistence slice's plan step.
