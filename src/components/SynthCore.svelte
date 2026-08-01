<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Engine } from '../lib/engine/engine';
  import { defaultState, type Macros } from '../lib/engine/state';

  let engine: Engine | null = null;
  let started = $state(false);
  let starting = $state(false);

  // Slider-bound macro targets.
  let macros = $state<Macros>(defaultState().macros);
  // Live snapshot of the drifting parameter values, for the indicator.
  let live = $state<Macros>({ ...macros });
  let raf = 0;

  const MACROS: { key: keyof Macros; label: string }[] = [
    { key: 'density', label: 'Density' },
    { key: 'brightness', label: 'Brightness' },
    { key: 'motion', label: 'Motion' },
    { key: 'mood', label: 'Mood' },
  ];

  async function begin() {
    if (started || starting) return;
    starting = true;
    engine = new Engine(defaultState());
    // apply any pre-Begin slider positions
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

  // Pointer X-Y pad → transient nudges.
  function onPadMove(e: PointerEvent) {
    if (!engine || !started) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    engine.nudgeXY(Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y)));
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
    <!-- X-Y pad -->
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

    <!-- Macro sliders -->
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
          <!-- live drifting value -->
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
    <p class="text-center text-xs text-neutral-500">
      Sliders set where each quality settles; the pad nudges — the system drifts back on its own.
    </p>
  {/if}
</div>
