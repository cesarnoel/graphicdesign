/**
 * cnsqdesigns — robots.txt endpoint
 * =====================================================================
 * ARCHITECTURAL DECISION
 * ---------------------------------------------------------------------
 * robots.txt is generated from typed data instead of living as a static
 * public/robots.txt file. Astro emits it at build time from this endpoint,
 * so the sitemap URL is derived from SITE.url in src/data/site.ts — the
 * same value that produces the canonical tags. A production domain change
 * therefore updates the homepage, the canonicals, the sitemap AND this
 * file, with no chance of the four disagreeing.
 *
 * The site is fully static, so there is nothing to disallow: no /admin,
 * no search results, no user-generated paths. Utility routes (/404,
 * /thank-you) are excluded via `noindex` in their own <head> plus the
 * sitemap filter in astro.config.mjs.
 */

import type { APIRoute } from 'astro';

import { SITE } from '@/data/site';

export const GET: APIRoute = () => {
  const body = [
    '# cnsqdesigns — everything here is public and indexable.',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('sitemap-index.xml', SITE.url).href}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Regenerated on every build, so it is cheap to revalidate.
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};