// Ornstein–Uhlenbeck parameter [node:4e6bb635].
//
// A mean-reverting random walk that, in a single process, delivers all three
// behaviours the product requires:
//   - autonomous drift        → the sigma noise term
//   - coherence / bounded      → reversion toward mu (+ hard clamp)  [node:fe1e63ac]
//   - nudge-with-decay         → a separate user-bias term that decays [node:58044d71]
//
// The baseline `x` drifts on its own; the user `bias` is added on read and
// exponentially decays back to zero, so influence is *bias, never control*.

import type { Rng } from './prng';
import { gaussian } from './prng';

export interface OUConfig {
  /** long-run mean the baseline reverts toward */
  mu: number;
  /** reversion strength (per second); larger = snaps back faster */
  theta: number;
  /** volatility of the drift (per sqrt-second) */
  sigma: number;
  /** hard lower bound on the emitted value */
  min: number;
  /** hard upper bound on the emitted value */
  max: number;
  /** time constant (seconds) for user-bias decay */
  biasTau: number;
}

export class OUParam {
  private x: number;
  private bias = 0;
  constructor(private cfg: OUConfig, initial?: number) {
    this.x = initial ?? cfg.mu;
  }

  /** Move the mean this parameter reverts toward (a user slider sets the target). */
  setMu(mu: number): void {
    this.cfg = { ...this.cfg, mu };
  }

  /** Advance the baseline drift and decay the user bias by dt seconds. */
  step(dt: number, rng: Rng): void {
    const { mu, theta, sigma, min, max, biasTau } = this.cfg;
    // Euler–Maruyama step of dx = theta*(mu - x)*dt + sigma*dW.
    this.x += theta * (mu - this.x) * dt + sigma * Math.sqrt(dt) * gaussian(rng);
    if (this.x < min) this.x = min;
    if (this.x > max) this.x = max;
    // Exponential decay of the user bias toward zero.
    this.bias *= Math.exp(-dt / biasTau);
  }

  /** Push the parameter by `delta` — a nudge, not a set. Decays over ~biasTau. */
  nudge(delta: number): void {
    this.bias += delta;
  }

  /** The value the engine reads: baseline + decaying bias, clamped. */
  get value(): number {
    const v = this.x + this.bias;
    if (v < this.cfg.min) return this.cfg.min;
    if (v > this.cfg.max) return this.cfg.max;
    return v;
  }

  /** Baseline only (no bias) — used for state serialization. */
  get baseline(): number {
    return this.x;
  }
}
