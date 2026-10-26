# KiteCab frontend

Website (prerendered for SEO) and admin panel for [kitecab.com](https://kitecab.com).
Angular 21 · zoneless · Tailwind CSS 4 · Angular Material (date picker, dialogs, autocomplete only).

## Run

```bash
npm install
npm start          # http://localhost:4200
npm test           # unit tests (Vitest)
npm run build      # static site in dist/kitecab-frontend/browser
```

Node 22.12 or newer.

## Folders

```
src/
  environments/        public settings (API URL, Supabase public key). No secrets here.
  styles.css           Tailwind + KiteCab brand colors (bg-kc-yellow, text-kc-teal …)
  material-theme.scss  Angular Material theme
  app/
    core/config/       site.config.ts — phone, address, social links, tracking IDs (one place)
    core/services/     API, Supabase, SEO, analytics
    core/guards/       admin login check
    core/interceptors/ HTTP error handling
    models/            TypeScript types shared with the database
    shared/            reusable components and pipes
    layout/            header, footer, admin sidebar
    features/          one folder per page area (home, booking, routes, cities, policies, admin …)
public/                files copied as-is (favicon, robots.txt, assets/)
```

## How pages are built

- `outputMode: static` — every public page is prerendered to HTML at build time, so Google
  sees the full content. The output is plain files for S3 + CloudFront; no server needed.
- `src/app/app.routes.server.ts` decides prerender (public pages) vs client-only (admin).
- `dist/kitecab-frontend/browser/index.csr.html` is the fallback for pages that are not
  prerendered (CloudFront serves it for unknown paths).

## Rules

- Google tags in `src/index.html` are copied unchanged from the live site — do not edit.
- New components: `ng g c features/<area>/<name>` (OnPush + SCSS by default).
- Business details (phone, address, IDs) only in `core/config/site.config.ts`.
