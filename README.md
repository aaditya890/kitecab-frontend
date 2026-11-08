# KiteCab frontend

Website (prerendered for SEO) and office admin panel for [kitecab.com](https://kitecab.com).
Angular 21 · zoneless · signals · Tailwind CSS 4 · Vitest. No UI library.

## Run

```bash
npm install
npm start          # http://localhost:4200  (website + /admin)
npm test           # unit tests
npm run build      # static site + sitemap.xml → dist/kitecab-frontend/browser
```

Node 22.12 or newer. Code style: Prettier (`.prettierrc.json`, 120 columns).

## Settings in one place

| What | Where |
|---|---|
| Phone, WhatsApp, email, address, social links, Google tag IDs | `src/app/core/config/site.config.ts` |
| API URL, Supabase URL + **public** key | `src/environments/` (no secrets here) |
| Brand colors, fonts, shared form/admin styles | `src/styles.css` |
| City pages, route pages, service pages | `src/app/data/` |

Phone, email, advance % and admin WhatsApp numbers can also be changed live in **Admin → Settings**.

## Website pages (all prerendered)

| URL | What |
|---|---|
| `/` | Home: booking form in the first screen |
| `/taxi/<from>-to-<to>` | Every Chhattisgarh/Nagpur route in the price list (780): fares, distance, per-km, round trip estimate, FAQs |
| `/taxi-service/<city>`, `/raipur-airport-taxi` | 10 hand-written city pages (`data/places.ts`) + 77 data-built town pages (`data/towns.json`) |
| `/one-way-taxi`, `/round-trip-cab`, `/local-taxi-rental` | Service pages (`data/services.ts`) |
| `/taxi-routes`, `/about-us`, `/contact-us`, policies, `/404` | Other pages |

The booking form reads live fares from the backend (`GET /api/catalog`, cached 60 s), so price
changes and on/off switches in the admin show within a minute. If the API is down it uses
`public/data/catalog.json`.

`npm run build:data -- kitecab_rows.csv` rebuilds the fare files from a database export:
`public/data/catalog.json`, `src/app/data/seo-routes.json` (all route pages, compact),
`popular-routes.json` (top 60 for home/footer), `place-stats.json`, `towns.json`, rentals and
round-trip rates. Then `npm run build` prerenders ~880 pages and writes `sitemap.xml`
(priorities: home 1.0, city pages 0.9, popular routes 0.8, towns 0.7, other routes 0.6).

Google tags in `src/index.html` are the live site's IDs and events, unchanged. Their script files
load on the first tap/scroll or after 3.5 s; anything tracked before that waits in `dataLayer`.

## Admin panel (`/admin`, browser-only, noindex)

Login with a Supabase Auth user whose `profiles.role` is `admin` or `staff`
(Admin → Staff & performance gives access by email).

| Page | For |
|---|---|
| Dashboard | Today, this month vs last, advance received, conversion, bookings chart, top routes |
| Enquiries / leads | Call now list, call/WhatsApp/copy, follow-up outcome + next call, history, create booking |
| Bookings, New booking | Search/filters, office bookings with price-list fare, driver, payment link, cancel, complete, timeline, invoice PDF |
| Customers, Payments, Activity log | Lists with search and CSV export; who did what |
| Staff & performance *(admin)* | Calls, bookings, late follow-ups per person; give or remove access |
| Drivers & cars, Routes & fares, Locations, Rental & round trip, Settings *(admin)* | Business data |

Lists load one page at a time from the database. supabase-js and jsPDF load only inside `/admin`.

## Folders

```
src/
  environments/   public settings
  styles.css      Tailwind theme, fonts (self-hosted Poppins), shared component classes
  app/
    core/         config, SEO + schema, services (API, catalog, settings, analytics), utils
    data/         places, SEO routes, services (+ generated JSON)
    features/     website pages (home, booking form, routes, cities, services, pages, policies)
    layout/       header, footer, phone call/WhatsApp bar
    shared/       logo, icons, breadcrumbs, FAQ, fare table, route links, CTA
    admin/        office panel: core (db, invoice, formatting), ui, pages
public/           favicon/icons, fonts, robots.txt, data/catalog.json
scripts/          build-catalog.py, build-sitemap.mjs
```

## Deploy (S3 + CloudFront)

1. `npm run build`, upload `dist/kitecab-frontend/browser/` to the S3 bucket.
2. CloudFront:
   - **Compress objects automatically: ON** (without it pages are 3–4× slower).
   - Cache: `*.js`, `*.css`, `/fonts/*` 1 year (file names change on every build); HTML `no-cache`.
   - Directory URLs → `index.html` (CloudFront Function adding `index.html` to paths ending in `/` or without a dot).
   - `/admin*` → `/index.csr.html` (the admin is not prerendered).
   - Error 403/404 → `/404/index.html` with status 404.
3. Invalidate `/*` after each upload.
