import { describe, it, expect } from 'vitest';
import { encodeMp3 } from './mp3';

function sine(seconds: number, sampleRate: number, freq = 220): Float32Array {
  const n = seconds * sampleRate;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = 0.3 * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  return out;
}

describe('encodeMp3', () => {
  it('encodes mono PCM to non-empty MP3 with a valid frame header', () => {
    const bytes = encodeMp3([sine(0.5, 44100)], 44100);
    expect(bytes.length).toBeGreaterThan(500);
    // MP3 frame sync: 11 set bits → 0xFF then top 3 bits of next byte set.
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1] & 0xe0).toBe(0xe0);
  });

  it('encodes stereo PCM', () => {
    const bytes = encodeMp3([sine(0.3, 44100, 220), sine(0.3, 44100, 330)], 44100);
    expect(bytes.length).toBeGreaterThan(500);
    expect(bytes[0]).toBe(0xff);
  });
});
