// Stateless sessions: an HMAC-signed, httpOnly cookie. No DB read per request.
// value = base64url(JSON payload) + "." + base64url(HMAC(payload)).

import { hmacSign, hmacVerify, b64urlEncode, b64urlDecode } from './crypto';

export const SESSION_COOKIE = 'sol_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface Session {
  userId: string;
  email: string;
  exp: number; // absolute expiry, unix seconds
}

const nowSec = () => Math.floor(Date.now() / 1000);

export async function createSessionCookie(secret: string, s: Session): Promise<string> {
  const payload = b64urlEncode(new TextEncoder().encode(JSON.stringify(s)));
  const sig = await hmacSign(secret, payload);
  const maxAge = Math.max(0, s.exp - nowSec());
  return `${SESSION_COOKIE}=${payload}.${sig}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

/** Verify + parse a session cookie value (the `name=value` value, not the header). */
export async function verifySession(secret: string, value: string | null): Promise<Session | null> {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!(await hmacVerify(secret, payload, sig))) return null;
  try {
    const s = JSON.parse(new TextDecoder().decode(b64urlDecode(payload))) as Session;
    if (typeof s.exp !== 'number' || s.exp < nowSec()) return null;
    return s;
  } catch {
    return null;
  }
}
