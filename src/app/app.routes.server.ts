import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * How each URL is built. The site is hosted as static files on S3, so public
 * pages are prerendered to HTML at build time (best for SEO and speed).
 * Admin pages (added later) will use RenderMode.Client — no SEO needed.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Prerender },
];
