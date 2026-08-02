import type { SensorSource, SensorSnapshot } from './types';

/** Registry over sensor sources; produces one snapshot per animation frame. */
export class SensorHub {
  private sources = new Map<string, SensorSource>();

  register(source: SensorSource): this {
    this.sources.set(source.id, source);
    return this;
  }

  get(id: string): SensorSource | undefined {
    return this.sources.get(id);
  }

  list(): SensorSource[] {
    return [...this.sources.values()];
  }

  /** Start every source that needs no permission (safe to auto-run). */
  startAmbient(): void {
    for (const s of this.sources.values()) {
      if (!s.needsPermission) void s.start();
    }
  }

  stopAll(): void {
    for (const s of this.sources.values()) s.stop();
  }

  snapshot(): SensorSnapshot {
    const out: SensorSnapshot = {};
    for (const s of this.sources.values()) {
      out[s.id] = {
        id: s.id,
        label: s.label,
        status: s.status,
        value: s.value,
        detail: s.detail,
        needsPermission: s.needsPermission,
      };
    }
    return out;
  }
}
