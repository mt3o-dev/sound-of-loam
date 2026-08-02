import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth/current-user';

export const prerender = false;

// Status probe for the UI — always 200 so an anonymous page load doesn't log a
// console error. Protected resources (e.g. /api/tracks) still return 401.
export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  return Response.json({
    authenticated: !!session,
    user: session ? { id: session.userId, email: session.email } : null,
  });
};
