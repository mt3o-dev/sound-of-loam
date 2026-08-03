<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Engine } from '../lib/engine/engine';
  import { defaultState, MOOD_PRESETS, type Macros, type SystemState } from '../lib/engine/state';
  import Visualizer from './Visualizer.svelte';
  import SensorBar from './SensorBar.svelte';
  import { createDefaultHub } from '../lib/sensors/sources';
  import { applySensorBias } from '../lib/sensors/bias';
  import { toLoamFile, parseLoamFile } from '../lib/format';
  import { renderStateToBuffer, audioBufferToChannels, blobToChannels } from '../lib/audio/render';
  import { mp3Blob } from '../lib/audio/mp3';

  // When mounted on a /s/:slug share page, initialState seeds the engine.
  let { initialState = null, shared = false }: { initialState?: SystemState | null; shared?: boolean } =
    $props();

  let engine: Engine | null = null;
  const hub = createDefaultHub();
  let started = $state(false);
  let starting = $state(false);

  let macros = $state<Macros>(defaultState().macros);
  let live = $state<Macros>({ ...macros });
  let raf = 0;

  // Account / library (additive — the instrument works signed-out).
  let user = $state<{ email: string } | null>(null);
  let tracks = $state<{ id: string; name: string; updated_at: number }[]>([]);
  let email = $state('');
  let authMsg = $state('');
  let saveMsg = $state('');
  let shareUrl = $state('');
  let fileMsg = $state('');
  let exportMsg = $state('');
  let recording = $state(false);
  let renderSecs = $state(30);

  const MACROS: { key: keyof Macros; label: string }[] = [
    { key: 'density', label: 'Density' },
    { key: 'brightness', label: 'Brightness' },
    { key: 'motion', label: 'Motion' },
    { key: 'mood', label: 'Mood' },
  ];

  onMount(() => {
    void refreshMe();
    hub.startAmbient();
  });

  async function refreshMe() {
    try {
      const r = await fetch('/api/auth/me');
      const d = await r.json();
      if (d.authenticated) {
        user = d.user;
        await refreshTracks();
      } else {
        user = null;
      }
    } catch {
      user = null;
    }
  }

  async function refreshTracks() {
    const r = await fetch('/api/tracks');
    if (r.ok) tracks = (await r.json()).tracks;
  }

  async function requestLink() {
    authMsg = 'sending…';
    const r = await fetch('/api/auth/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    authMsg = r.ok
      ? 'Check your email for a sign-in link (in dev, see the server console).'
      : 'That email looks invalid.';
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    user = null;
    tracks = [];
  }

  async function begin() {
    if (started || starting) return;
    starting = true;
    const startState = initialState ?? defaultState();
    engine = new Engine(startState);
    for (const { key } of MACROS) {
      macros[key] = startState.macros[key];
      engine.setMacro(key, macros[key]);
    }
    await engine.start();
    started = true;
    starting = false;
    tickIndicator();
  }

  function stop() {
    engine?.stop();
    started = false;
    cancelAnimationFrame(raf);
  }

  function tickIndicator() {
    if (!engine) return;
    live = engine.snapshot();
    applySensorBias(engine, hub.snapshot(), 0.016);
    raf = requestAnimationFrame(tickIndicator);
  }

  function onSlider(key: keyof Macros, value: number) {
    macros[key] = value;
    engine?.setMacro(key, value);
  }

  let padLast = { x: 0.5, y: 0.5 };
  let padVel = { x: 0, y: 0 };
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

  function onPadMove(e: PointerEvent) {
    if (!engine || !started) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = clamp01((e.clientX - r.left) / r.width);
    const y = clamp01((e.clientY - r.top) / r.height);
    padVel = { x: x - padLast.x, y: y - padLast.y };
    padLast = { x, y };
    engine.nudgeXY(x, y);
  }

  // Momentum: after release, keep nudging along the last velocity, decaying (FR-004).
  function onPadUp() {
    if (!engine) return;
    let vx = padVel.x * 3;
    let vy = padVel.y * 3;
    let px = padLast.x;
    let py = padLast.y;
    const fling = () => {
      if (!engine || Math.hypot(vx, vy) < 0.004) return;
      px = clamp01(px + vx);
      py = clamp01(py + vy);
      engine.nudgeXY(px, py);
      vx *= 0.9;
      vy *= 0.9;
      requestAnimationFrame(fling);
    };
    fling();
  }

  function applyPreset(name: string) {
    const p = MOOD_PRESETS[name];
    if (!engine || !p) return;
    engine.applyMacros(p);
    for (const k of Object.keys(p) as (keyof Macros)[]) macros[k] = p[k];
  }
  const stir = () => engine?.perturb(0.5);
  const newSeed = () => engine?.reseed();

  async function saveCurrent() {
    if (!engine || !user) return;
    const name = prompt('Name this soundscape:', 'Untitled');
    if (name === null) return;
    saveMsg = 'saving…';
    const r = await fetch('/api/tracks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, state: engine.serialize() }),
    });
    if (r.ok) {
      saveMsg = 'Saved.';
      await refreshTracks();
    } else {
      saveMsg = 'Save failed.';
    }
  }

  async function shareCurrent() {
    if (!engine || !user) return;
    shareUrl = 'creating…';
    const r = await fetch('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ state: engine.serialize() }),
    });
    if (r.ok) {
      const { slug } = await r.json();
      shareUrl = new URL('/s/' + slug, location.origin).toString();
    } else {
      shareUrl = '';
    }
  }

  function saveFile() {
    if (!engine) return;
    const text = toLoamFile(engine.serialize(), Date.now());
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `sound-of-loam-${Date.now()}.loam`;
    a.click();
    URL.revokeObjectURL(url);
    fileMsg = 'Downloaded.';
  }

  async function loadFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const res = parseLoamFile(await file.text());
    input.value = '';
    if (!res.ok) {
      fileMsg = res.error;
      return;
    }
    engine?.stop();
    cancelAnimationFrame(raf);
    engine = new Engine(res.state);
    for (const { key } of MACROS) macros[key] = res.state.macros[key];
    await engine.start();
    started = true;
    tickIndicator();
    fileMsg = 'Loaded.';
  }

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function renderMp3() {
    if (!engine) return;
    exportMsg = 'rendering…';
    try {
      const secs = Math.max(5, Math.min(300, renderSecs || 30));
      const buf = await renderStateToBuffer(engine.serialize(), secs);
      downloadBlob(mp3Blob(audioBufferToChannels(buf), buf.sampleRate), `sound-of-loam-${Date.now()}.mp3`);
      exportMsg = 'MP3 downloaded.';
    } catch {
      exportMsg = 'Render failed.';
    }
  }

  async function toggleRecord() {
    if (!engine) return;
    if (!recording) {
      if (engine.startCapture()) {
        recording = true;
        exportMsg = 'recording…';
      } else {
        exportMsg = 'Recording not supported here.';
      }
      return;
    }
    recording = false;
    exportMsg = 'encoding…';
    const webm = await engine.stopCapture();
    if (!webm) {
      exportMsg = 'Nothing recorded.';
      return;
    }
    try {
      const { channels, sampleRate } = await blobToChannels(webm);
      downloadBlob(mp3Blob(channels, sampleRate), `sound-of-loam-live-${Date.now()}.mp3`);
      exportMsg = 'MP3 downloaded.';
    } catch {
      exportMsg = 'Encode failed.';
    }
  }

  async function loadTrack(id: string) {
    const r = await fetch('/api/tracks/' + id);
    if (!r.ok) return;
    const { state } = (await r.json()) as { state: SystemState };
    engine?.stop();
    cancelAnimationFrame(raf);
    engine = new Engine(state);
    for (const { key } of MACROS) macros[key] = state.macros[key];
    await engine.start();
    started = true;
    tickIndicator();
  }

  onDestroy(() => {
    cancelAnimationFrame(raf);
    engine?.stop();
    hub.stopAll();
  });
</script>

<Visualizer
  snapshot={() => (engine && started ? engine.snapshot() : null)}
  sensors={() => hub.snapshot()}
/>
<SensorBar {hub} />

<div class="mx-auto flex max-w-xl flex-col gap-6 p-6 text-neutral-100">
  <header class="text-center">
    <h1 class="text-3xl font-light tracking-wide">Sound of Loam</h1>
    <p class="mt-1 text-sm text-neutral-400">
      A soundscape you tend, not play. It drifts on its own — nudge it, never control it.
    </p>
  </header>

  {#if shared}
    <p class="rounded bg-emerald-950/50 px-3 py-2 text-center text-xs text-emerald-300">
      A shared soundscape — press Begin to play, then tend it yourself.
    </p>
  {/if}

  {#if !started}
    <button
      onclick={begin}
      disabled={starting}
      class="mx-auto rounded-full border border-neutral-500 px-8 py-3 text-lg font-light
             transition hover:border-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
    >
      {starting ? 'waking…' : 'Begin'}
    </button>
    <p class="text-center text-xs text-neutral-500">
      Sound is synthesized live in your browser — no recordings, nothing leaves your device.
    </p>
  {:else}
    <div
      role="application"
      aria-label="Nudge pad — drag to bias the sound"
      class="relative h-48 w-full cursor-crosshair rounded-lg border border-neutral-700
             bg-gradient-to-br from-neutral-900 to-neutral-800 select-none touch-none"
      onpointermove={onPadMove}
      onpointerdown={onPadMove}
      onpointerup={onPadUp}
    >
      <span class="pointer-events-none absolute left-2 top-2 text-xs text-neutral-500">
        drag: ← darker · brighter → / ↑ denser · sparser ↓ · fling for momentum
      </span>
    </div>

    <!-- Nudge surfaces: presets, stir, reseed (all bias, never control) -->
    <div class="flex flex-wrap items-center gap-2 text-xs">
      {#each Object.keys(MOOD_PRESETS) as name}
        <button
          onclick={() => applyPreset(name)}
          class="rounded border border-neutral-700 px-3 py-1 text-neutral-300 hover:bg-neutral-800"
        >
          {name}
        </button>
      {/each}
      <span class="mx-1 text-neutral-700">|</span>
      <button
        onclick={stir}
        class="rounded border border-violet-700 px-3 py-1 text-violet-300 hover:bg-violet-950"
      >
        Stir
      </button>
      <button
        onclick={newSeed}
        class="rounded border border-neutral-700 px-3 py-1 text-neutral-300 hover:bg-neutral-800"
      >
        New seed
      </button>
    </div>

    <!-- Local save/load (.loam) — no account needed -->
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <button
        onclick={saveFile}
        class="rounded border border-neutral-700 px-3 py-1 text-neutral-300 hover:bg-neutral-800"
      >
        Save file
      </button>
      <label class="cursor-pointer rounded border border-neutral-700 px-3 py-1 text-neutral-300 hover:bg-neutral-800">
        Load file
        <input type="file" accept=".loam,application/json" class="hidden" onchange={loadFile} />
      </label>
      {#if fileMsg}<span class="text-neutral-500">{fileMsg}</span>{/if}
    </div>

    <!-- Export MP3: reproducible render (FR-022) or live capture (FR-023) -->
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <label class="text-neutral-400">
        MP3
        <input
          type="number"
          min="5"
          max="300"
          bind:value={renderSecs}
          class="ml-1 w-16 rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
        /> s
      </label>
      <button
        onclick={renderMp3}
        class="rounded border border-amber-700 px-3 py-1 text-amber-300 hover:bg-amber-950"
      >
        Render MP3
      </button>
      <button
        onclick={toggleRecord}
        class={`rounded border px-3 py-1 hover:bg-neutral-800 ${recording ? 'border-red-600 text-red-300' : 'border-neutral-700 text-neutral-300'}`}
      >
        {recording ? 'Stop & save' : 'Record live'}
      </button>
      {#if exportMsg}<span class="text-neutral-500">{exportMsg}</span>{/if}
    </div>

    <div class="flex flex-col gap-4">
      {#each MACROS as m}
        <label class="flex items-center gap-3 text-sm">
          <span class="w-24 text-neutral-300">{m.label}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={macros[m.key]}
            oninput={(e) => onSlider(m.key, +e.currentTarget.value)}
            class="flex-1 accent-emerald-400"
          />
          <span class="w-16">
            <span class="block h-1.5 rounded bg-neutral-700">
              <span
                class="block h-1.5 rounded bg-emerald-400/70"
                style={`width:${Math.round(live[m.key] * 100)}%`}
              ></span>
            </span>
          </span>
        </label>
      {/each}
    </div>

    <button
      onclick={stop}
      class="mx-auto rounded-full border border-neutral-700 px-6 py-2 text-sm text-neutral-400
             transition hover:border-neutral-500 hover:text-neutral-200"
    >
      stop
    </button>
  {/if}

  <!-- Account / library — additive; never gates the instrument -->
  <section class="mt-2 border-t border-neutral-800 pt-4 text-sm">
    {#if !user}
      <p class="mb-2 text-neutral-400">Sign in to save and revisit your soundscapes.</p>
      <div class="flex gap-2">
        <input
          type="email"
          bind:value={email}
          placeholder="you@example.com"
          class="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5"
        />
        <button
          onclick={requestLink}
          class="rounded border border-neutral-600 px-3 py-1.5 hover:bg-neutral-800"
        >
          Email me a link
        </button>
      </div>
      {#if authMsg}<p class="mt-2 text-xs text-neutral-400">{authMsg}</p>{/if}
    {:else}
      <div class="flex items-center justify-between">
        <span class="text-neutral-400">Signed in as <span class="text-neutral-200">{user.email}</span></span>
        <div class="flex gap-2">
          <button
            onclick={saveCurrent}
            disabled={!started}
            class="rounded border border-emerald-700 px-3 py-1.5 text-emerald-300
                   hover:bg-emerald-950 disabled:opacity-40"
          >
            Save current
          </button>
          <button
            onclick={shareCurrent}
            disabled={!started}
            class="rounded border border-sky-700 px-3 py-1.5 text-sky-300
                   hover:bg-sky-950 disabled:opacity-40"
          >
            Share
          </button>
          <button onclick={signOut} class="rounded border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800">
            Sign out
          </button>
        </div>
      </div>
      {#if saveMsg}<p class="mt-1 text-xs text-neutral-500">{saveMsg}</p>{/if}
      {#if shareUrl}
        <p class="mt-1 break-all text-xs text-sky-400">
          Public link: <a href={shareUrl} class="underline">{shareUrl}</a>
        </p>
      {/if}
      {#if !started}<p class="mt-1 text-xs text-neutral-500">Press Begin, tend the sound, then Save.</p>{/if}

      {#if tracks.length}
        <ul class="mt-3 flex flex-col gap-1">
          {#each tracks as t}
            <li class="flex items-center justify-between rounded px-2 py-1 hover:bg-neutral-900">
              <span class="truncate text-neutral-300">{t.name}</span>
              <button onclick={() => loadTrack(t.id)} class="text-emerald-400 hover:underline">load</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="mt-3 text-xs text-neutral-500">No saved soundscapes yet.</p>
      {/if}
    {/if}
  </section>
</div>
