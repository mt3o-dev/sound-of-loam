# public-track-sharing

status: open
created: 2026-08-02
epic: sound-of-loam
memory_goal: 0fdf2f19-c9c0-4a31-9138-3978a7f6f664

## Goal
A signed-in user publishes a soundscape to a public link (/s/:slug) that anyone can open and play without an account.

## Roadmap
Slice S-06. Uses F-01 shares table (self-contained snapshot) + repo createShare/getShare,
S-05 serialize, F-02 session. Public read unauth; publish requires a session.
Access model [node:4d3e471b], anonymous-first [node:c1b0d7c2], system state [node:cb3ae8cf].
