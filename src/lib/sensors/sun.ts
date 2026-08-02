// Local solar-altitude computation — no network, no API. Given lat/lon + a Date,
// returns the sun's altitude normalized to 0..1 (0 = at/below horizon, 1 = zenith).
// Used by the sun sensor so day/night drives the visuals + mood without any service.

import { clamp01 } from './types';

const RAD = Math.PI / 180;

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - start) / 86_400_000);
}

/** 0 when the sun is at or below the horizon, up to 1 at the zenith. */
export function sunAltitudeNormalized(lat: number, lon: number, date: Date): number {
  const decl = 23.44 * RAD * Math.sin((2 * Math.PI * (dayOfYear(date) - 81)) / 365);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const solarTime = utcHours + lon / 15;
  const hourAngle = (solarTime - 12) * 15 * RAD;
  const latR = lat * RAD;
  const altitude = Math.asin(
    Math.sin(latR) * Math.sin(decl) + Math.cos(latR) * Math.cos(decl) * Math.cos(hourAngle),
  );
  return clamp01(altitude / (Math.PI / 2));
}
