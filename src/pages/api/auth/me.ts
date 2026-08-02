import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/current-user';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return Response.json({ authenticated: false }, { status: 401 });
  return Response.json({ authenticated: true, user: { id: session.userId, email: session.email } });
};
