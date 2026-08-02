# Plan: public-track-sharing (S-06)

Goal `0fdf2f19`. Publish a soundscape to a public `/s/:slug` anyone can play, no account.
Publish needs a session; read is unauthenticated `[node:4d3e471b]`. Snapshot is self-contained
(shares table, F-01) so the public page needs no user join `[node:cb3ae8cf]`.

## Phases

### Phase 0 — Publish endpoint
`POST /api/share` (`prerender=false`, session required → 401 else): body `{ state }` →
`slug = randomToken(9)` → `createShare(slug, JSON.stringify(state), engineVersion, now)` →
`{ slug }`. Reuses the crypto token + repo.createShare.
- **Verify:** wrangler-dev — anon publish → 401; signed-in publish → slug returned.

### Phase 1 — Public play page
`src/pages/s/[slug].astro` (`prerender=false`): `getShare(slug)` via the D1 binding
(server frontmatter). Missing → 404 page. Found → render `<SynthCore initialState={state}
shared client:only="svelte" />` with a small "shared soundscape" banner. Fully public.
- **Verify:** GET `/s/<slug>` returns 200 with the instrument; `/s/bogus` → 404.

### Phase 2 — Share UI + engine seeding
`SynthCore` gains optional props `initialState?: SystemState`, `shared?: boolean`: `begin()`
starts `new Engine(initialState ?? defaultState())` and seeds the sliders from it. Signed-in
account panel gets a **Share current** button → `POST /api/share` with `engine.serialize()` →
shows the copyable public URL.
- **Verify:** headless — open a shared link, Begin, sound plays from the shared state; zero
  audio-file requests; publish round-trip (serialize → share → open link → plays).

## Non-goals
Share management (list/revoke), social metadata/OG images, share of a *saved* track by id
(share current state is enough for MVP), view counts.

## Risks
- **Anonymous publish spam** → publish requires a session; slug is unguessable (72-bit).
- **output/anon** → share page is its own server route; home instrument stays prerendered.

## Route
After `/gw-plan-review`, `/gw-implement`.
