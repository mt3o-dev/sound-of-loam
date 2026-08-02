import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import type { D1Like } from '../../../lib/db/types';
import { consumeLoginToken, upsertUserByEmail } from '../../../lib/db/repo';
import { createSessionCookie, SESSION_TTL_SECONDS } from '../../../lib/auth/session';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const e = env as unknown as { DB?: D1Like; AUTH_SECRET?: string };
  if (!e.DB || !e.AUTH_SECRET) return new Response('Auth not configured', { status: 500 });

  const token = url.searchParams.get('token') ?? '';
  const now = Math.floor(Date.now() / 1000);

  const consumed = await consumeLoginToken(e.DB, token, now);
  if (!consumed) return new Response('Invalid or expired sign-in link', { status: 400 });

  const user = await upsertUserByEmail(e.DB, {
    id: crypto.randomUUID(),
    email: consumed.email,
    now,
  });
  const cookie = await createSessionCookie(e.AUTH_SECRET, {
    userId: user.id,
    email: user.email,
    exp: now + SESSION_TTL_SECONDS,
  });
  return new Response(null, { status: 302, headers: { location: '/', 'set-cookie': cookie } });
};
