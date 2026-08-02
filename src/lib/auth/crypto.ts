// Auth crypto built on Web Crypto (crypto.subtle / getRandomValues) — available
// in both workerd (Cloudflare) and Node 26, so these functions are pure and
// unit-testable with no polyfills.

const enc = new TextEncoder();

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message) as BufferSource);
  return b64urlEncode(new Uint8Array(sig));
}

/** Constant-time verify via crypto.subtle.verify. */
export async function hmacVerify(secret: string, message: string, sig: string): Promise<boolean> {
  try {
    const key = await importKey(secret);
    return await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig) as BufferSource,
      enc.encode(message) as BufferSource,
    );
  } catch {
    return false;
  }
}

/** A high-entropy, url-safe random token (default 32 bytes = 256 bits). */
export function randomToken(bytes = 32): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return b64urlEncode(b);
}
