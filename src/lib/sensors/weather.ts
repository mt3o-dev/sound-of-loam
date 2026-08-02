// Weather via Open-Meteo — free, no API key, CORS-enabled. Keyed by geolocation
// lat/lon (opt-in behind consent, since the request leaves the device [node:3037236e]).
// The response→values mapping is pure and unit-tested.

import { clamp01 } from './types';

export interface OpenMeteoCurrent {
  temperature_2m?: number;
  precipitation?: number;
  wind_speed_10m?: number;
  cloud_cover?: number;
  is_day?: number;
}

export interface WeatherValues {
  warmth: number; // -10..35°C → 0..1
  wetness: number; // precipitation mm → 0..1
  wind: number; // km/h → 0..1
  cloud: number; // % → 0..1
  day: number; // 0 | 1
}

const num = (v: number | undefined, dflt: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : dflt;

export function mapWeather(c: OpenMeteoCurrent): WeatherValues {
  return {
    warmth: clamp01((num(c.temperature_2m, 15) + 10) / 45),
    wetness: clamp01(num(c.precipitation, 0) / 10),
    wind: clamp01(num(c.wind_speed_10m, 0) / 60),
    cloud: clamp01(num(c.cloud_cover, 0) / 100),
    day: c.is_day ? 1 : 0,
  };
}

/** A single 0..1 "weather intensity" for the debug bar / a one-dim visual driver. */
export function weatherIntensity(w: WeatherValues): number {
  return clamp01(0.4 * w.wetness + 0.4 * w.wind + 0.2 * w.cloud);
}

export function openMeteoUrl(lat: number, lon: number): string {
  const p = 'temperature_2m,precipitation,wind_speed_10m,cloud_cover,is_day';
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${p}`;
}
