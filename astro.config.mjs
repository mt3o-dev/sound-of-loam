// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],

  vite: {
    plugins: [tailwindcss()]
  },

  // The adapter's workerd dev runtime auto-injects wrangler.jsonc bindings (D1)
  // into context.locals.runtime.env during `astro dev` — no account needed.
  adapter: cloudflare()
});