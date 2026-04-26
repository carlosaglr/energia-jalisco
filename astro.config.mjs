import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://energia-jalisco.vercel.app',
  integrations: [react(), sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
