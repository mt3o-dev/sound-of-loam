import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../lib/auth/session';

export const prerender = false;

export const POST: APIRoute = async () =>
  new Response(null, { status: 302, headers: { location: '/', 'set-cookie': clearSessionCookie() } });
