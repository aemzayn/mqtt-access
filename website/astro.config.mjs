// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: replace with the real production domain before deploying.
  site: 'https://mqtt-access.app',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});