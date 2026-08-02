# cloudflare-deploy

status: archived
created: 2026-08-02
archived: 2026-08-02
epic: sound-of-loam
memory_goal: e6f6bf02-f077-4f81-9b83-effb746055c1

## Goal
Deploy Sound of Loam to Cloudflare — provision the real D1 database, apply migrations, set secrets (AUTH_SECRET + email provider), wire deploy, and go live.

## Roadmap
Foundation slice F-03. Gated on the user's Cloudflare auth + secrets.
Cloudflare runtime [node:0005f4be], D1 persistence [node:0d98d40a], git workflow [node:306c084e].

## Archive note
Merged to master (merge commit `8220bcf`). LIVE: https://sound-of-loam.teodor-kulej.workers.dev
(Workers + remote D1 0d99cea2…, binding env.DB). Scope deactivated + swept 2026-08-02: 3 nodes
dormant. Change summary `[node:922f9a4a]`. **Trailing config** `[node:e2c03bd2]`: Resend key
invalid (401) → magic-link email disabled until a valid key + verified sender domain are set,
then `wrangler secret put RESEND_API_KEY` (no redeploy). Anonymous instrument + visuals live.
