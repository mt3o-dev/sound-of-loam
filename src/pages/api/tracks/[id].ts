import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import type { D1Like } from '../../../lib/db/types';
import { getSession } from '../../../lib/auth/current-user';
import { getTrack } from '../../../lib/db/repo';

export const prerender = false;

/** Load one of the signed-in user's tracks (with its full state). */
export const GET: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const d = (env as unknown as { DB?: D1Like }).DB;
  if (!d) return Response.json({ error: 'DB not available' }, { status: 500 });

  const track = await getTrack(d, params.id ?? '');
  // 404 (not 403) when it isn't the caller's — don't reveal existence.
  if (!track || track.user_id !== session.userId) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }
  return Response.json({ id: track.id, name: track.name, state: JSON.parse(track.state_json) });
};
