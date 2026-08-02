import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hmacSign, hmacVerify, randomToken, b64urlEncode, b64urlDecode } from './crypto';
import { createSessionCookie, verifySession, clearSessionCookie, readCookie, SESSION_COOKIE, type Session } from './session';
import { getSender, ConsoleSender, ResendSender } from './email';
import { makeTestDb } from '../test/d1-shim';
import type { D1Like } from '../db/types';
import * as repo from '../db/repo';

const SECRET = 'test-secret';
const nowSec = () => Math.floor(Date.now() / 1000);

describe('crypto', () => {
  it('sign → verify round-trips', async () => {
    const sig = await hmacSign(SECRET, 'hello');
    expect(await hmacVerify(SECRET, 'hello', sig)).toBe(true);
  });
  it('rejects a tampered message or wrong secret', async () => {
    const sig = await hmacSign(SECRET, 'hello');
    expect(await hmacVerify(SECRET, 'hell0', sig)).toBe(false);
    expect(await hmacVerify('other', 'hello', sig)).toBe(false);
  });
  it('base64url round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 250, 251, 252, 253, 254, 255]);
    expect(Array.from(b64urlDecode(b64urlEncode(bytes)))).toEqual(Array.from(bytes));
  });
  it('randomToken is url-safe and high-entropy', () => {
    const t = randomToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(t.length).toBeGreaterThanOrEqual(40);
    expect(randomToken()).not.toBe(randomToken());
  });
});

describe('session', () => {
  it('creates a verifiable session cookie', async () => {
    const s: Session = { userId: 'u1', email: 'a@b.co', exp: nowSec() + 100 };
    const setCookie = await createSessionCookie(SECRET, s);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    const value = readCookie(setCookie.split(';')[0], SESSION_COOKIE);
    expect(await verifySession(SECRET, value)).toMatchObject({ userId: 'u1', email: 'a@b.co' });
  });
  it('rejects an expired session', async () => {
    const s: Session = { userId: 'u1', email: 'a@b.co', exp: nowSec() - 1 };
    const value = readCookie((await createSessionCookie(SECRET, s)).split(';')[0], SESSION_COOKIE);
    expect(await verifySession(SECRET, value)).toBeNull();
  });
  it('rejects a tampered payload', async () => {
    const s: Session = { userId: 'u1', email: 'a@b.co', exp: nowSec() + 100 };
    const value = readCookie((await createSessionCookie(SECRET, s)).split(';')[0], SESSION_COOKIE)!;
    const forged = b64urlEncode(new TextEncoder().encode(JSON.stringify({ ...s, userId: 'admin' })));
    const tampered = `${forged}.${value.split('.')[1]}`;
    expect(await verifySession(SECRET, tampered)).toBeNull();
  });
  it('clear cookie expires immediately', () => {
    expect(clearSessionCookie()).toContain('Max-Age=0');
  });
});

describe('email sender selection', () => {
  it('defaults to ConsoleSender without a key', () => {
    expect(getSender({})).toBeInstanceOf(ConsoleSender);
  });
  it('uses ResendSender when key + from are set', () => {
    expect(getSender({ RESEND_API_KEY: 'k', EMAIL_FROM: 'a@b.co' })).toBeInstanceOf(ResendSender);
  });
  it('ConsoleSender logs the link', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await new ConsoleSender().sendMagicLink('a@b.co', 'https://x/y');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('https://x/y'));
    spy.mockRestore();
  });
  it('ResendSender POSTs to the API and throws on failure', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await new ResendSender('key', 'from@x.co').sendMagicLink('a@b.co', 'https://x/y');
    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({ method: 'POST' }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toBe('a@b.co');
    expect(body.html).toContain('https://x/y');

    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(new ResendSender('key', 'from@x.co').sendMagicLink('a@b.co', 'l')).rejects.toThrow();
    vi.unstubAllGlobals();
  });
});

describe('login tokens (repo)', () => {
  const MIGRATIONS = [
    new URL('../../../migrations/0001_init.sql', import.meta.url),
    new URL('../../../migrations/0002_login_tokens.sql', import.meta.url),
  ];
  let db: D1Like;
  beforeEach(() => {
    db = makeTestDb(MIGRATIONS);
  });

  it('consumes a valid token exactly once', async () => {
    await repo.createLoginToken(db, { token: 'tok', email: 'a@b.co', expiresAt: 1000 });
    expect(await repo.consumeLoginToken(db, 'tok', 500)).toEqual({ email: 'a@b.co' });
    // replay fails
    expect(await repo.consumeLoginToken(db, 'tok', 501)).toBeNull();
  });

  it('rejects an expired token', async () => {
    await repo.createLoginToken(db, { token: 'old', email: 'a@b.co', expiresAt: 100 });
    expect(await repo.consumeLoginToken(db, 'old', 200)).toBeNull();
  });

  it('rejects an unknown token', async () => {
    expect(await repo.consumeLoginToken(db, 'nope', 1)).toBeNull();
  });

  it('upsertUserByEmail is idempotent (same id on repeat)', async () => {
    const u1 = await repo.upsertUserByEmail(db, { id: 'id-1', email: 'a@b.co', now: 1 });
    const u2 = await repo.upsertUserByEmail(db, { id: 'id-2', email: 'a@b.co', now: 2 });
    expect(u2.id).toBe(u1.id);
    expect(u1.id).toBe('id-1');
  });
});
