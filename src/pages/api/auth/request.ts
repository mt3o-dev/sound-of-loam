import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import type { D1Like } from '../../../lib/db/types';
import { createLoginToken } from '../../../lib/db/repo';
import { randomToken } from '../../../lib/auth/crypto';
import { getSender } from '../../../lib/auth/email';

export const prerender = false;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const POST: APIRoute = async ({ request }) => {
  const e = env as unknown as { DB?: D1Like; RESEND_API_KEY?: string; EMAIL_FROM?: string };
  if (!e.DB) return Response.json({ ok: false, error: 'DB not available' }, { status: 500 });

  let email = '';
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown };
    email = String(body.email ?? '');
  } else {
    const form = await request.formData();
    email = String(form.get('email') ?? '');
  }
  email = email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: 'invalid email' }, { status: 400 });
  }

  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  await createLoginToken(e.DB, { token, email, expiresAt: now + 600 });

  const link = new URL(`/api/auth/callback?token=${encodeURIComponent(token)}`, request.url).toString();
  await getSender(e).sendMagicLink(email, link);

  // Do not reveal whether the email already has an account.
  return Response.json({ ok: true });
};
