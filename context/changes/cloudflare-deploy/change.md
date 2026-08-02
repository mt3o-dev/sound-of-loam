# cloudflare-deploy

status: open
created: 2026-08-02
epic: sound-of-loam
memory_goal: e6f6bf02-f077-4f81-9b83-effb746055c1

## Goal
Deploy Sound of Loam to Cloudflare — provision the real D1 database, apply migrations, set secrets (AUTH_SECRET + email provider), wire deploy, and go live.

## Roadmap
Foundation slice F-03. Gated on the user's Cloudflare auth + secrets.
Cloudflare runtime [node:0005f4be], D1 persistence [node:0d98d40a], git workflow [node:306c084e].
