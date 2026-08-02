import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import type { D1Like } from '../../../lib/db/types';
import { getSession } from '../../../lib/auth/current-user';
import { saveTrack, listUserTracks } from '../../../lib/db/repo';

export const prerender = false;

const db = () => (env as unknown as { DB?: D1Like }).DB;

/** List the signed-in user's tracks (id, name, updated_at only). */
export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const d = db();
  if (!d) return Response.json({ error: 'DB not available' }, { status: 500 });

  const tracks = await listUserTracks(d, session.userId);
  return Response.json({
    tracks: tracks.map((t) => ({ id: t.id, name: t.name, updated_at: t.updated_at })),
  });
};

/** Save the current state as a new owned track. */
export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const d = db();
  if (!d) return Response.json({ error: 'DB not available' }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as { name?: string; state?: unknown };
  if (!body.state || typeof body.state !== 'object') {
    return Response.json({ error: 'missing state' }, { status: 400 });
  }
  const name = String(body.name ?? 'Untitled').trim().slice(0, 100) || 'Untitled';
  const engineVersion = Number((body.state as { engineVersion?: number }).engineVersion ?? 1);
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await saveTrack(d, {
    id,
    userId: session.userId,
    name,
    stateJson: JSON.stringify(body.state),
    engineVersion,
    now,
  });
  return Response.json({ id, name });
};
