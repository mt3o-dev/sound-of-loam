import { env } from 'cloudflare:workers';
import { readCookie, verifySession, SESSION_COOKIE, type Session } from './session';

/** Resolve the current session from the request cookie, or null. */
export async function getSession(request: Request): Promise<Session | null> {
  const secret = (env as unknown as { AUTH_SECRET?: string }).AUTH_SECRET;
  if (!secret) return null;
  const value = readCookie(request.headers.get('cookie'), SESSION_COOKIE);
  return verifySession(secret, value);
}
