<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Engine } from '../lib/engine/engine';
  import { defaultState, type Macros, type SystemState } from '../lib/engine/state';

  let engine: Engine | null = null;
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

  const MACROS: { key: keyof Macros; label: string }[] = [
    { key: 'density', label: 'Density' },
    { key: 'brightness', label: 'Brightness' },
    { key: 'motion', label: 'Motion' },
    { key: 'mood', label: 'Mood' },
  ];

  onMount(refreshMe);

  async function refreshMe() {
    try {
      const r = await fetch('/api/auth/me');
      if (r.ok) {
        user = (await r.json()).user;
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
    engine = new Engine(defaultState());
    for (const { key } of MACROS) engine.setMacro(key, macros[key]);
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
    raf = requestAnimationFrame(tickIndicator);
  }

  function onSlider(key: keyof Macros, value: number) {
    macros[key] = value;
    engine?.setMacro(key, value);
  }

  function onPadMove(e: PointerEvent) {
    if (!engine || !started) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    engine.nudgeXY(Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y)));
  }

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
  });
</script>

<div class="mx-auto flex max-w-xl flex-col gap-6 p-6 text-neutral-100">
  <header class="text-center">
    <h1 class="text-3xl font-light tracking-wide">Sound of Loam</h1>
    <p class="mt-1 text-sm text-neutral-400">
      A soundscape you tend, not play. It drifts on its own — nudge it, never control it.
    </p>
  </header>

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
    >
      <span class="pointer-events-none absolute left-2 top-2 text-xs text-neutral-500">
        drag: ← darker · brighter → / ↑ denser · sparser ↓
      </span>
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
          <button onclick={signOut} class="rounded border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800">
            Sign out
          </button>
        </div>
      </div>
      {#if saveMsg}<p class="mt-1 text-xs text-neutral-500">{saveMsg}</p>{/if}
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
