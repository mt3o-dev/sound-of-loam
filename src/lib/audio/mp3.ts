// In-browser MP3 encoding via @breezystack/lamejs (pure JS) — keeps export
// browser-only, no server [node:1cade23e]. Pure PCM→MP3; unit-tested in Node.

import { Mp3Encoder } from '@breezystack/lamejs';

function floatTo16(f: Float32Array): Int16Array {
  const out = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) {
    const s = Math.max(-1, Math.min(1, f[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function concat(chunks: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const c of chunks) len += c.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

/** Encode interleaved-by-channel Float32 PCM to MP3 bytes. Mono or stereo. */
export function encodeMp3(channels: Float32Array[], sampleRate: number, kbps = 128): Uint8Array {
  const stereo = channels.length > 1;
  const nCh = stereo ? 2 : 1;
  const enc = new Mp3Encoder(nCh, sampleRate, kbps);
  const left = floatTo16(channels[0]);
  const right = stereo ? floatTo16(channels[1]) : left;

  const block = 1152;
  const out: Uint8Array[] = [];
  for (let i = 0; i < left.length; i += block) {
    const lc = left.subarray(i, i + block);
    const rc = right.subarray(i, i + block);
    const buf = stereo ? enc.encodeBuffer(lc, rc) : enc.encodeBuffer(lc);
    if (buf.length > 0) out.push(new Uint8Array(buf));
  }
  const end = enc.flush();
  if (end.length > 0) out.push(new Uint8Array(end));
  return concat(out);
}

export function mp3Blob(channels: Float32Array[], sampleRate: number, kbps = 128): Blob {
  return new Blob([encodeMp3(channels, sampleRate, kbps) as BlobPart], { type: 'audio/mpeg' });
}
