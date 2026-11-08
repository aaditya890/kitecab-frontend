import { RenderMode, ServerRoute } from '@angular/ssr';

import { HUBS } from './data/places';
import { SEO_ROUTES } from './data/seo-routes';
import { TOWNS } from './data/towns';

/**
 * How each URL is built. The site is hosted as static files on S3, so public
 * pages are prerendered to HTML at build time (best for SEO and speed).
 * Admin pages use RenderMode.Client — no SEO needed; CloudFront serves
 * index.csr.html for /admin/* (see README).
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  {
    path: 'taxi/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => SEO_ROUTES.map((r) => ({ slug: r.slug })),
  },
  {
    path: 'taxi-service/:city',
    renderMode: RenderMode.Prerender,
    // Raipur Airport has its own URL (/raipur-airport-taxi).
    // Hand-written city pages, then data-built town pages.
    getPrerenderParams: async () => [
      ...HUBS.filter((h) => h.slug !== 'raipur-airport').map((h) => ({ city: h.slug })),
      ...TOWNS.map((t) => ({ city: t.slug })),
    ],
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
