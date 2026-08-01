// Voice factories for the layered architecture [node:85fa71d6]:
//   - drone: continuous detuned oscillator bed
//   - melodic: sparse plucked/padded notes (scheduled)
//   - texture: filtered noise wash
// All audible AudioParam moves use ramps / setTargetAtTime, never `.value =` on a
// live param, to avoid clicks and zipper noise [node:208861e8].

import type { AudioBus } from './audioGraph';
import { makeNoiseBuffer } from './audioGraph';
import { midiToFreq } from './scale';
import type { Rng } from './prng';

/** The continuous drone: root + fifth + octave, gently detuned, lowpass-shaped. */
export class Drone {
  private oscs: OscillatorNode[] = [];
  private filter: BiquadFilterNode;
  private gain: GainNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;

  constructor(bus: AudioBus, rootMidi: number, rng: Rng) {
    const { ctx } = bus;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 600;
    this.filter.Q.value = 0.7;

    this.gain = ctx.createGain();
    this.gain.gain.value = 0.14;

    const intervals = [0, 7, 12]; // root, fifth, octave
    for (const semi of intervals) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = midiToFreq(rootMidi + semi);
      // Seeded, not Math.random — the engine must be fully reproducible [node:d5caec8d].
      o.detune.value = (rng() - 0.5) * 6;
      o.connect(this.filter);
      o.start();
      this.oscs.push(o);
    }
    this.filter.connect(this.gain);
    this.gain.connect(bus.dry);
    this.gain.connect(bus.reverbSend);

    // Slow amplitude shimmer.
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 0.06;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0.04;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.gain.gain);
    this.lfo.start();
  }

  /** brightness 0..1 → cutoff; motion 0..1 → shimmer depth. */
  update(t: number, brightness: number, motion: number): void {
    const cutoff = 250 + brightness * 2600;
    this.filter.frequency.setTargetAtTime(cutoff, t, 0.4);
    this.lfoGain.gain.setTargetAtTime(0.02 + motion * 0.08, t, 0.5);
  }

  setRoot(t: number, rootMidi: number): void {
    const intervals = [0, 7, 12];
    this.oscs.forEach((o, i) => {
      o.frequency.setTargetAtTime(midiToFreq(rootMidi + intervals[i]), t, 0.8);
    });
  }
}

/** Play one sparse note. Self-contained: nodes are created, ramped, and stopped. */
export function playNote(
  bus: AudioBus,
  freq: number,
  when: number,
  opts: { brightness: number; motion: number; velocity: number },
): void {
  const { ctx } = bus;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400 + opts.brightness * 4000;

  const gain = ctx.createGain();
  const peak = 0.12 * opts.velocity;
  const attack = 0.6 + opts.motion * 0.8;
  const release = 2.5 + opts.motion * 3.0;

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.linearRampToValueAtTime(peak, when + attack);
  gain.gain.setTargetAtTime(0.0001, when + attack, release / 3);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(bus.dry);
  gain.connect(bus.reverbSend);
  gain.connect(bus.delaySend);

  osc.start(when);
  osc.stop(when + attack + release + 0.2);
  osc.onended = () => {
    osc.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
}

/** Continuous filtered-noise texture. */
export class Texture {
  private src: AudioBufferSourceNode;
  private filter: BiquadFilterNode;
  private gain: GainNode;

  constructor(bus: AudioBus, rng: Rng) {
    const { ctx } = bus;
    this.src = ctx.createBufferSource();
    this.src.buffer = makeNoiseBuffer(ctx, 2.0, rng);
    this.src.loop = true;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'bandpass';
    this.filter.frequency.value = 800;
    this.filter.Q.value = 0.8;

    this.gain = ctx.createGain();
    this.gain.gain.value = 0.03;

    this.src.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(bus.reverbSend);
    this.src.start();
  }

  update(t: number, brightness: number, motion: number): void {
    this.filter.frequency.setTargetAtTime(500 + brightness * 3500, t, 0.6);
    this.gain.gain.setTargetAtTime(0.015 + motion * 0.04, t, 0.7);
  }
}
