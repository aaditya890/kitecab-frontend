// Writes dist/.../browser/sitemap.xml from the list of prerendered pages.
// Runs automatically after `npm run build`, so every new route or city page is included.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://kitecab.com';
const dist = join(import.meta.dirname, '..', 'dist', 'kitecab-frontend');
const { routes } = JSON.parse(readFileSync(join(dist, 'prerendered-routes.json'), 'utf8'));

const EXCLUDE = new Set(['/404']);

// Hand-written city pages and the most booked routes rank first; data-built town and
// long-tail route pages follow.
const data = (f) => JSON.parse(readFileSync(join(import.meta.dirname, '..', 'src', 'app', 'data', f), 'utf8'));
const popular = new Set(data('popular-routes.json').map((r) => `/taxi/${r.slug}`));
const hubCities = new Set(
  [
    ...readFileSync(join(import.meta.dirname, '..', 'src', 'app', 'data', 'places.ts'), 'utf8').matchAll(
      /slug: '([a-z-]+)',\s+blurb:[^}]*?hub: \{/g,
    ),
  ].map((m) => `/taxi-service/${m[1]}`),
);

const priority = (path) => {
  if (path === '/') return '1.0';
  if (path === '/raipur-airport-taxi' || hubCities.has(path)) return '0.9';
  if (popular.has(path) || ['/one-way-taxi', '/round-trip-cab', '/local-taxi-rental', '/taxi-routes'].includes(path))
    return '0.8';
  if (path.startsWith('/taxi-service/')) return '0.7';
  if (path.startsWith('/taxi/')) return '0.6';
  return '0.4';
};

const today = new Date().toISOString().slice(0, 10);
const urls = Object.keys(routes)
  .filter((p) => !EXCLUDE.has(p))
  .sort((a, b) => Number(priority(b)) - Number(priority(a)) || a.localeCompare(b))
  .map(
    (p) =>
      `  <url><loc>${SITE}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod><priority>${priority(p)}</priority></url>`,
  );

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
writeFileSync(join(dist, 'browser', 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} URLs`);
