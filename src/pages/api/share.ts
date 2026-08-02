import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import type { D1Like } from '../../lib/db/types';
import { getSession } from '../../lib/auth/current-user';
import { createShare } from '../../lib/db/repo';
import { randomToken } from '../../lib/auth/crypto';

export const prerender = false;

/** Publish the given state as a public share. Requires a session. */
export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const d = (env as unknown as { DB?: D1Like }).DB;
  if (!d) return Response.json({ error: 'DB not available' }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as { state?: unknown };
  if (!body.state || typeof body.state !== 'object') {
    return Response.json({ error: 'missing state' }, { status: 400 });
  }
  const slug = randomToken(9); // ~72-bit, url-safe, unguessable
  const engineVersion = Number((body.state as { engineVersion?: number }).engineVersion ?? 1);
  await createShare(d, {
    slug,
    stateJson: JSON.stringify(body.state),
    engineVersion,
    now: Math.floor(Date.now() / 1000),
  });
  return Response.json({ slug });
};
