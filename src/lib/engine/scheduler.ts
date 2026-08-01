// Look-ahead scheduler — the "Tale of Two Clocks" pattern [node:208861e8].
// A coarse JS timer wakes periodically and schedules audio events slightly ahead
// of AudioContext.currentTime, so timing never depends on setTimeout accuracy.

export class LookAheadScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param ctx       the AudioContext (its currentTime is the audio clock)
   * @param onTick    called each wake with (now, horizon); schedule events whose
   *                  time falls within [now, horizon] and advance any per-tick state
   * @param lookAhead seconds to schedule ahead of now
   * @param intervalMs how often the JS timer wakes
   */
  constructor(
    private ctx: AudioContext,
    private onTick: (now: number, horizon: number, dt: number) => void,
    private lookAhead = 0.15,
    private intervalMs = 25,
  ) {}

  start(): void {
    if (this.timer !== null) return;
    let last = this.ctx.currentTime;
    this.timer = setInterval(() => {
      const now = this.ctx.currentTime;
      const horizon = now + this.lookAhead;
      const dt = Math.max(0, now - last);
      last = now;
      this.onTick(now, horizon, dt);
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  get running(): boolean {
    return this.timer !== null;
  }
}
