import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://energia-jalisco.vercel.app',
  integrations: [react()],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
