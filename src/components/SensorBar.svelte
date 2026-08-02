<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { SensorHub } from '../lib/sensors/hub';
  import type { SensorSnapshot } from '../lib/sensors/types';

  let { hub }: { hub: SensorHub } = $props();
  let open = $state(false);
  let snap = $state<SensorSnapshot>({});
  let timer = 0;

  onMount(() => {
    snap = hub.snapshot();
    timer = window.setInterval(() => (snap = hub.snapshot()), 250);
  });
  onDestroy(() => clearInterval(timer));

  function enable(id: string) {
    void hub.get(id)?.start();
  }

  const statusClass = (s: string) =>
    s === 'active' || s === 'granted'
      ? 'text-emerald-400'
      : s === 'denied' || s === 'unsupported'
        ? 'text-neutral-600'
        : 'text-amber-400';
</script>

<div class="fixed bottom-3 right-3 z-20 text-xs">
  <button
    onclick={() => (open = !open)}
    class="rounded border border-neutral-700 bg-neutral-900/80 px-2 py-1 text-neutral-300 backdrop-blur hover:bg-neutral-800"
  >
    {open ? '× sensors' : '☰ sensors'}
  </button>

  {#if open}
    <div class="mt-2 max-h-[70vh] w-72 overflow-y-auto rounded border border-neutral-700 bg-neutral-950/90 p-3 backdrop-blur">
      <p class="mb-2 text-neutral-500">Live sensor state — each nudges the sound + visuals.</p>
      {#each Object.values(snap) as s (s.id)}
        <div class="mb-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-neutral-300">{s.label}</span>
            <span class={statusClass(s.status)}>{s.status}{s.detail ? ` · ${s.detail}` : ''}</span>
          </div>
          <div class="mt-1 h-1 rounded bg-neutral-800">
            <div class="h-1 rounded bg-emerald-500/70" style={`width:${Math.round(s.value * 100)}%`}></div>
          </div>
          {#if s.needsPermission && (s.status === 'idle' || s.status === 'denied')}
            <button
              onclick={() => enable(s.id)}
              class="mt-1 rounded border border-neutral-700 px-2 py-0.5 text-[11px] text-sky-300 hover:bg-neutral-800"
            >
              enable{s.id === 'weather' || s.id === 'sun' ? ' — uses your location' : ''}
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
