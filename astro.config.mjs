// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';

import { SITE } from './src/data/site';

/**
 * cnsqdesigns — Astro configuration
 * =====================================================================
 * ARCHITECTURAL DECISIONS
 * ---------------------------------------------------------------------
 * 1. `output: 'static'` — every section is prerendered to HTML at build
 *    time. The portfolio is content, not an application, so static
 *    output gives us the best possible Lighthouse floor: no server
 *    render cost, no cold starts, and Netlify can serve the whole site
 *    from its edge CDN.
 *
 * 2. `integrations: [react()]` — React is used *only* for the image
 *    lightbox island. Everything else is Astro components that compile
 *    to zero JavaScript. See src/components/Lightbox.tsx.
 *
 * 3. Fonts are self-hosted at build time via Astro's Fonts API
 *    (`fontProviders.google()` downloads the woff2 files into
 *    dist/_astro/fonts and emits @font-face rules). This removes the
 *    render-blocking third-party request to fonts.googleapis.com and
 *    the privacy/consent baggage that comes with it. `fallbacks` uses
 *    metric-matched system fonts so swapping in the webfont does not
 *    shift layout (protects CLS).
 *
 * 4. `vite.css.preprocessorOptions.scss.loadPaths` — lets any component
 *    write `@use 'abstracts/mixins' as mix;` regardless of its depth in
 *    the tree. Deliberately NOT using `additionalData` injection: that
 *    pattern re-injects into the modules themselves and causes Sass
 *    "module already loaded" errors. Explicit @use is safer and makes
 *    each component's dependencies visible.
 *
 * 5. `prefetch` is intentionally left disabled — it ships client JS and
 *    we only have one primary route.
 */
export default defineConfig({
  // Single source of truth: src/data/site.ts (also read by Seo.astro,
  // robots.txt and the sitemap).
  site: SITE.url,

  output: 'static',

  // Netlify serves both /about and /about/ cleanly; 'ignore' avoids
  // generating a redirect for every route.
  trailingSlash: 'ignore',

  compressHTML: true,

  integrations: [
    react(),
    sitemap({
      // The 404 page must never be indexed.
      filter: (page) => !page.includes('/404'),
    }),
  ],

  build: {
    // Astro inlines small stylesheets; keeping the default 'auto' avoids
    // a render-blocking request for the handful of critical rules.
    inlineStylesheets: 'auto',
  },

  fonts: [
    {
      // Display face: a high-contrast Didone. It carries the editorial,
      // print-heritage character of the brand and is never used for body
      // copy (it is display-only, so it stays legible at large sizes).
      //
      // BYTE-COST NOTE: the Fonts API downloads exactly the variants
      // declared here and nothing else, so declaring a style the design
      // does not use is a real cost. An italic file for this family is
      // ~26 KB, and because the <Font /> component preloads every file of
      // the font it describes, that weight would land in the critical
      // path for nothing. Emphasis is carried by the cyan accent,
      // weight and rhythm instead — so `styles: ['normal']`.
      name: 'Bodoni Moda',
      cssVariable: '--csq-font-display',
      provider: fontProviders.google(),
      weights: [400, 500, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['serif'],
      display: 'swap',
    },
    {
      // Body/UI face: a grotesque with more personality than the usual
      // system stack, and much better metrics at small sizes.
      name: 'Archivo',
      cssVariable: '--csq-font-body',
      provider: fontProviders.google(),
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
      display: 'swap',
    },
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [fileURLToPath(new URL('./src/styles', import.meta.url))],
        },
      },
    },
    resolve: {
      alias: {
        // Mirrors the "@/*" -> "src/*" path mapping in tsconfig.json.
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
