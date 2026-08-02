// Browser sensor sources. Each normalizes to 0..1 and reports its own status.
// All DOM/Web access is inside start(); nothing runs at import. Mic is analysis-only
// (AnalyserNode, never recorded). Weather/sun are opt-in and use geolocation.

import type { SensorSource, SensorStatus } from './types';
import { clamp01 } from './types';
import { sunAltitudeNormalized } from './sun';
import { mapWeather, weatherIntensity, openMeteoUrl, type OpenMeteoCurrent } from './weather';
import { SensorHub } from './hub';

/** Exponential smoothing toward a target, frame-rate independent enough for visuals. */
function smooth(cur: number, target: number, a = 0.15): number {
  return cur + (target - cur) * a;
}

class PointerSource implements SensorSource {
  id = 'pointer';
  label = 'Pointer';
  needsPermission = false;
  status: SensorStatus = 'idle';
  value = 0;
  private lastX = 0;
  private lastY = 0;
  private lastT = 0;
  private onMove = (e: PointerEvent) => {
    const t = e.timeStamp;
    if (this.lastT) {
      const dist = Math.hypot(e.clientX - this.lastX, e.clientY - this.lastY);
      const dt = Math.max(1, t - this.lastT);
      this.value = clamp01((dist / dt) * 0.15);
    }
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.lastT = t;
  };
  private decay = 0;
  start() {
    if (typeof window === 'undefined') { this.status = 'unsupported'; return; }
    window.addEventListener('pointermove', this.onMove, { passive: true });
    this.status = 'active';
    this.decay = window.setInterval(() => { this.value = smooth(this.value, 0, 0.08); }, 100);
  }
  stop() {
    if (typeof window !== 'undefined') { window.removeEventListener('pointermove', this.onMove); clearInterval(this.decay); }
    this.status = 'idle';
  }
}

class TimeSource implements SensorSource {
  id = 'time';
  label = 'Time of day';
  needsPermission = false;
  status: SensorStatus = 'idle';
  value = 0;
  private timer = 0;
  private tick = () => {
    const d = new Date();
    this.value = (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
    this.detail = d.toLocaleTimeString();
  };
  detail?: string;
  start() {
    this.tick();
    this.status = 'active';
    if (typeof window !== 'undefined') this.timer = window.setInterval(this.tick, 1000);
  }
  stop() { if (typeof window !== 'undefined') clearInterval(this.timer); this.status = 'idle'; }
}

class BatterySource implements SensorSource {
  id = 'battery';
  label = 'Battery';
  needsPermission = false;
  status: SensorStatus = 'idle';
  value = 1;
  detail?: string;
  async start() {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number }> };
    if (typeof nav.getBattery !== 'function') { this.status = 'unsupported'; return; }
    try {
      const b = await nav.getBattery();
      const read = () => { this.value = clamp01(b.level); this.detail = `${Math.round(b.level * 100)}%`; };
      read();
      (b as unknown as EventTarget).addEventListener?.('levelchange', read);
      this.status = 'active';
    } catch { this.status = 'unsupported'; }
  }
  stop() { this.status = 'idle'; }
}

class ViewportSource implements SensorSource {
  id = 'viewport';
  label = 'Scroll';
  needsPermission = false;
  status: SensorStatus = 'idle';
  value = 0;
  private onScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    this.value = clamp01(window.scrollY / max);
  };
  start() {
    if (typeof window === 'undefined') { this.status = 'unsupported'; return; }
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
    this.status = 'active';
  }
  stop() { if (typeof window !== 'undefined') window.removeEventListener('scroll', this.onScroll); this.status = 'idle'; }
}

class MotionSource implements SensorSource {
  id = 'motion';
  label = 'Device motion';
  needsPermission = true;
  status: SensorStatus = 'idle';
  value = 0;
  detail?: string;
  private onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
    this.value = smooth(this.value, clamp01(Math.abs(mag - 9.8) / 15), 0.2);
    this.status = 'active';
  };
  async start() {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') { this.status = 'unsupported'; return; }
    const anyDME = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<PermissionState> };
    try {
      if (typeof anyDME.requestPermission === 'function') {
        this.status = 'prompt';
        const res = await anyDME.requestPermission();
        if (res !== 'granted') { this.status = 'denied'; return; }
      }
      window.addEventListener('devicemotion', this.onMotion);
      this.status = 'granted';
    } catch { this.status = 'denied'; }
  }
  stop() { if (typeof window !== 'undefined') window.removeEventListener('devicemotion', this.onMotion); this.status = 'idle'; }
}

class MicSource implements SensorSource {
  id = 'mic';
  label = 'Mic level';
  needsPermission = true;
  status: SensorStatus = 'idle';
  value = 0;
  private ctx?: AudioContext;
  private stream?: MediaStream;
  private raf = 0;
  async start() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) { this.status = 'unsupported'; return; }
    try {
      this.status = 'prompt';
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.ctx = new AudioContext();
      const src = this.ctx.createMediaStreamSource(this.stream);
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser); // analysis only — not connected to any output, never recorded
      const buf = new Uint8Array(analyser.fftSize);
      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        this.value = smooth(this.value, clamp01(Math.sqrt(sum / buf.length) * 4), 0.3);
        this.raf = requestAnimationFrame(loop);
      };
      loop();
      this.status = 'active';
    } catch { this.status = 'denied'; }
  }
  stop() {
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.status = 'idle';
  }
}

class LightSource implements SensorSource {
  id = 'light';
  label = 'Ambient light';
  needsPermission = true;
  status: SensorStatus = 'idle';
  value = 0.5;
  private sensor?: { start(): void; stop(): void; addEventListener(t: string, cb: () => void): void; illuminance?: number };
  async start() {
    const AL = (globalThis as unknown as { AmbientLightSensor?: new () => NonNullable<LightSource['sensor']> }).AmbientLightSensor;
    if (typeof AL !== 'function') { this.status = 'unsupported'; return; }
    try {
      this.sensor = new AL();
      this.sensor.addEventListener('reading', () => {
        const lux = this.sensor?.illuminance ?? 0;
        this.value = clamp01(Math.log10(lux + 1) / 4); // 0..~10000 lux → 0..1
        this.status = 'active';
      });
      this.sensor.start();
      this.status = 'granted';
    } catch { this.status = 'denied'; }
  }
  stop() { try { this.sensor?.stop(); } catch { /* ignore */ } this.status = 'idle'; }
}

/** Weather + sun: opt-in, geolocation → local sun calc + Open-Meteo fetch. */
class WeatherSunSource implements SensorSource {
  constructor(
    public id: 'weather' | 'sun',
    public label: string,
    private shared: GeoShared,
  ) {}
  needsPermission = true;
  status: SensorStatus = 'idle';
  value = 0;
  detail?: string;
  private timer = 0;
  async start() {
    this.status = 'prompt';
    const pos = await this.shared.getPosition();
    if (!pos) { this.status = 'denied'; return; }
    this.status = 'granted';
    const update = async () => {
      if (this.id === 'sun') {
        this.value = sunAltitudeNormalized(pos.lat, pos.lon, new Date());
        this.detail = this.value > 0.05 ? 'day' : 'night';
        this.status = 'active';
      } else {
        const w = await this.shared.getWeather(pos.lat, pos.lon);
        if (w) { this.value = weatherIntensity(w); this.detail = `cloud ${Math.round(w.cloud * 100)}%`; this.status = 'active'; }
      }
    };
    await update();
    if (typeof window !== 'undefined') this.timer = window.setInterval(update, this.id === 'sun' ? 60_000 : 600_000);
  }
  stop() { if (typeof window !== 'undefined') clearInterval(this.timer); this.status = 'idle'; }
}

/** Shares one geolocation grant + weather fetch between the sun and weather sources. */
class GeoShared {
  private posPromise?: Promise<{ lat: number; lon: number } | null>;
  getPosition() {
    if (this.posPromise) return this.posPromise;
    this.posPromise = new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => resolve(null),
        { timeout: 10_000, maximumAge: 600_000 },
      );
    });
    return this.posPromise;
  }
  async getWeather(lat: number, lon: number) {
    try {
      const r = await fetch(openMeteoUrl(lat, lon));
      if (!r.ok) return null;
      const j = (await r.json()) as { current?: OpenMeteoCurrent };
      return j.current ? mapWeather(j.current) : null;
    } catch {
      return null;
    }
  }
}

/** Build a hub with every source registered. */
export function createDefaultHub(): SensorHub {
  const geo = new GeoShared();
  return new SensorHub()
    .register(new PointerSource())
    .register(new TimeSource())
    .register(new BatterySource())
    .register(new ViewportSource())
    .register(new MotionSource())
    .register(new MicSource())
    .register(new LightSource())
    .register(new WeatherSunSource('sun', 'Sun', geo))
    .register(new WeatherSunSource('weather', 'Weather', geo));
}
