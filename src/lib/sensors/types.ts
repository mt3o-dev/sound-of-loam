// A sensor source normalizes some real-world signal to a 0..1 value and reports
// its own availability/permission status. Sources feed the Visualizer, the engine
// bias adapter, and the debug bar. The instrument never depends on any of them.

export type SensorStatus =
  | 'unsupported' // API not present in this browser
  | 'idle' // available but not started (e.g. opt-in / needs a tap)
  | 'prompt' // permission requested, awaiting the user
  | 'granted' // permission granted, warming up
  | 'active' // producing values
  | 'denied'; // permission refused

export interface SensorSource {
  readonly id: string;
  readonly label: string;
  readonly needsPermission: boolean;
  status: SensorStatus;
  value: number; // 0..1
  detail?: string;
  start(): void | Promise<void>;
  stop(): void;
}

export interface SensorSnapshotEntry {
  id: string;
  label: string;
  status: SensorStatus;
  value: number;
  detail?: string;
  needsPermission: boolean;
}

export type SensorSnapshot = Record<string, SensorSnapshotEntry>;

/** The subset of the engine the sensor-bias adapter needs — keeps bias testable. */
export interface NudgeTarget {
  nudge(name: 'density' | 'brightness' | 'motion' | 'mood', delta: number): void;
}

export const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
