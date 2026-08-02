<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Macros } from '../lib/engine/state';

  // Reads the engine's live macro snapshot each frame (null when not running).
  let { snapshot }: { snapshot: () => Macros | null } = $props();

  let canvas: HTMLCanvasElement;
  let raf = 0;
  const reduce =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  type Orb = { x: number; y: number; vx: number; vy: number; r: number; seed: number };
  const orbs: Orb[] = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
  }

  function draw() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const s = snapshot();
    const density = s?.density ?? 0.12;
    const brightness = s?.brightness ?? 0.25;
    const motion = s?.motion ?? 0.1;
    const mood = s?.mood ?? 0.3;

    // Trail fade over the dark base.
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(10, 10, 12, 0.16)';
    ctx.fillRect(0, 0, W, H);

    const hue = 210 - mood * 150; // deep blue (calm) → amber (restless)
    const count = Math.max(3, Math.round(3 + density * 11));
    const speed = 0.0004 + motion * 0.005;
    const light = 34 + brightness * 40;
    const alpha = 0.05 + brightness * 0.1;

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const o = orbs[i];
      o.x += o.vx * speed;
      o.y += o.vy * speed;
      if (o.x < 0) o.x += 1;
      if (o.x > 1) o.x -= 1;
      if (o.y < 0) o.y += 1;
      if (o.y > 1) o.y -= 1;

      const px = o.x * W;
      const py = o.y * H;
      const rad = (0.06 + o.r * 0.12) * Math.min(W, H) * (0.6 + brightness * 0.8);
      const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, `hsla(${hue + o.seed * 40}, 70%, ${light}%, ${alpha})`);
      g.addColorStop(1, `hsla(${hue}, 70%, ${light}%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame() {
    draw();
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  onMount(() => {
    for (let i = 0; i < 14; i++) {
      orbs.push({
        x: Math.random(),
        y: Math.random(),
        vx: Math.random() - 0.5,
        vy: Math.random() - 0.5,
        r: Math.random(),
        seed: Math.random(),
      });
    }
    resize();
    window.addEventListener('resize', resize);
    frame(); // draws at least one frame; loops unless reduced-motion
  });

  onDestroy(() => {
    cancelAnimationFrame(raf);
    if (typeof window !== 'undefined') window.removeEventListener('resize', resize);
  });
</script>

<canvas bind:this={canvas} aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 h-full w-full"></canvas>
