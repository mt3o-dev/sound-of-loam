# email-auth

status: archived
created: 2026-08-01
archived: 2026-08-02
epic: sound-of-loam
memory_goal: 609be706-561b-41a0-9789-338db81daaf6

## Goal
Add email login + sessions on the Cloudflare D1 layer, so a user can be created and authenticated — additive only, never gating the anonymous instrument.

## Roadmap
Foundation slice F-02. Builds on F-01 D1 layer, access model [node:4d3e471b],
anonymous-first [node:c1b0d7c2]. Unlocks S-05 (cloud save) and S-06 (share ownership).

## Archive note
Merged to master (merge commit `a36c04b`). Memory scope deactivated + swept 2026-08-02:
5 F-02 nodes dormant (recoverable via `memory_lifecycle.py activate email-auth`). The auth
approach + email-sender decisions live under the change scope now dormant — promote the
change-summary + auth-approach nodes in the GUI to keep them in live recall. Real email
provider + domain + AUTH_SECRET remain for F-03. Accepted follow-up: rate-limit
/api/auth/request before real sending.
