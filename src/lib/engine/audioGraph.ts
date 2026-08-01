// The shared audio bus: master output plus send effects (reverb + delay).
// Everything here is synthesized at runtime — the reverb impulse and the noise
// used for texture are generated from math/PRNG, never loaded [node:35763b2a].

import type { Rng } from './prng';

export interface AudioBus {
  ctx: AudioContext;
  master: GainNode; // final gain → destination
  dry: GainNode; // dry mix input
  reverbSend: GainNode; // → reverb
  delaySend: GainNode; // → delay
  reverbWet: GainNode;
  delayFeedback: GainNode;
}

/** A synthesized impulse response: exponentially-decaying noise. */
function makeImpulse(ctx: BaseAudioContext, seconds: number, decay: number, rng: Rng): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const env = Math.pow(1 - i / len, decay);
      data[i] = (rng() * 2 - 1) * env;
    }
  }
  return buf;
}

/** A looping white-noise buffer, generated (not recorded). */
export function makeNoiseBuffer(ctx: BaseAudioContext, seconds: number, rng: Rng): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.max(1, Math.floor(rate * seconds));
  const buf = ctx.createBuffer(1, len, rate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = rng() * 2 - 1;
  return buf;
}

export function createBus(ctx: AudioContext, rng: Rng): AudioBus {
  const master = ctx.createGain();
  master.gain.value = 0.0; // faded up on start to avoid a click
  master.connect(ctx.destination);

  const dry = ctx.createGain();
  dry.gain.value = 0.8;
  dry.connect(master);

  // Reverb send → convolver → wet gain → master
  const reverbSend = ctx.createGain();
  reverbSend.gain.value = 1.0;
  const convolver = ctx.createConvolver();
  convolver.buffer = makeImpulse(ctx, 4.5, 3.2, rng);
  const reverbWet = ctx.createGain();
  reverbWet.gain.value = 0.5;
  reverbSend.connect(convolver);
  convolver.connect(reverbWet);
  reverbWet.connect(master);

  // Delay send → delay (+ feedback) → master
  const delaySend = ctx.createGain();
  delaySend.gain.value = 0.5;
  const delay = ctx.createDelay(2.0);
  delay.delayTime.value = 0.5;
  const delayFeedback = ctx.createGain();
  delayFeedback.gain.value = 0.35;
  delaySend.connect(delay);
  delay.connect(delayFeedback);
  delayFeedback.connect(delay); // feedback loop
  delay.connect(master);

  return { ctx, master, dry, reverbSend, delaySend, reverbWet, delayFeedback };
}
