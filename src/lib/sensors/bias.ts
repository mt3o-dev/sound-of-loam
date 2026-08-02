import type { SensorSnapshot, SensorSnapshotEntry, NudgeTarget } from './types';

const isLive = (e?: SensorSnapshotEntry) => !!e && (e.status === 'active' || e.status === 'granted');

/**
 * Continuously bias engine macros from the active sensors. Each sensor pushes its
 * macro toward its value; because engine bias decays, this settles to a gentle
 * offset — influence, never control [node:58044d71].
 */
export function applySensorBias(engine: NudgeTarget, snap: SensorSnapshot, dt: number): void {
  const k = 0.6 * Math.min(dt, 0.1);
  const push = (
    id: string,
    macro: 'density' | 'brightness' | 'motion' | 'mood',
    gain = 1,
  ) => {
    const e = snap[id];
    if (isLive(e)) engine.nudge(macro, (e!.value - 0.5) * k * gain);
  };
  push('mic', 'density', 1.4);
  push('motion', 'motion', 1.4);
  push('light', 'brightness', 1.2);
  push('sun', 'mood', 1.0);
  push('weather', 'brightness', 0.8);
  push('time', 'mood', 0.5);
}
