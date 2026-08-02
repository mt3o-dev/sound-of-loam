import { describe, it, expect } from 'vitest';
import { SensorHub } from './hub';
import type { SensorSource } from './types';
import { sunAltitudeNormalized } from './sun';
import { mapWeather, weatherIntensity, openMeteoUrl } from './weather';
import { applySensorBias } from './bias';

function fakeSource(id: string, needsPermission: boolean): SensorSource & { started: boolean } {
  return {
    id,
    label: id,
    needsPermission,
    status: 'idle',
    value: 0.5,
    started: false,
    start() {
      this.started = true;
      this.status = 'active';
    },
    stop() {
      this.started = false;
      this.status = 'idle';
    },
  };
}

describe('SensorHub', () => {
  it('registers sources and snapshots them', () => {
    const hub = new SensorHub().register(fakeSource('a', false)).register(fakeSource('b', true));
    const snap = hub.snapshot();
    expect(Object.keys(snap).sort()).toEqual(['a', 'b']);
    expect(snap.a).toMatchObject({ id: 'a', value: 0.5, needsPermission: false });
  });

  it('startAmbient starts only permissionless sources', () => {
    const a = fakeSource('a', false);
    const b = fakeSource('b', true);
    new SensorHub().register(a).register(b).startAmbient();
    expect(a.started).toBe(true);
    expect(b.started).toBe(false);
  });
});

describe('sun', () => {
  it('is high near local noon and zero at night', () => {
    const noon = sunAltitudeNormalized(0, 0, new Date(Date.UTC(2025, 2, 21, 12, 0, 0)));
    const midnight = sunAltitudeNormalized(0, 0, new Date(Date.UTC(2025, 2, 21, 0, 0, 0)));
    expect(noon).toBeGreaterThan(0.8);
    expect(midnight).toBe(0);
  });
});

describe('weather', () => {
  it('maps + clamps current conditions to 0..1', () => {
    const w = mapWeather({ temperature_2m: 35, precipitation: 20, wind_speed_10m: 120, cloud_cover: 100, is_day: 1 });
    expect(w.warmth).toBeCloseTo(1, 2);
    expect(w.wetness).toBe(1);
    expect(w.wind).toBe(1);
    expect(w.cloud).toBe(1);
    expect(w.day).toBe(1);
    expect(weatherIntensity(w)).toBeGreaterThan(0.9);
  });
  it('defaults missing fields sanely', () => {
    const w = mapWeather({});
    expect(w.warmth).toBeGreaterThan(0);
    expect(w.day).toBe(0);
  });
  it('builds an Open-Meteo url', () => {
    expect(openMeteoUrl(52.2, 21.0)).toContain('latitude=52.2');
    expect(openMeteoUrl(52.2, 21.0)).toContain('current=');
  });
});

describe('bias', () => {
  it('nudges only active sensors, to the right macros', () => {
    const calls: [string, number][] = [];
    const engine = { nudge: (m: string, d: number) => calls.push([m, d]) };
    const snap = {
      mic: { id: 'mic', label: 'm', status: 'active' as const, value: 1, needsPermission: true },
      light: { id: 'light', label: 'l', status: 'idle' as const, value: 1, needsPermission: true },
    };
    applySensorBias(engine, snap, 0.1);
    const macros = calls.map((c) => c[0]);
    expect(macros).toContain('density'); // mic active
    expect(macros).not.toContain('brightness'); // light idle → skipped
    expect(calls.find((c) => c[0] === 'density')![1]).toBeGreaterThan(0); // value 1 > 0.5 → positive
  });
});
