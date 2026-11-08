// Pulls the CURRENT fares from the database (public, read-only views — no secret key) and
// rewrites the website's fare files, so route/city pages match the admin panel after the
// next `npm run build`.
//
//   npm run build:data:db            (then npm run build and deploy)
//
// Only active places/routes are included (switched-off ones disappear from the site).
// Route order keeps the existing popularity order; new routes go to the end.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DATA = join(ROOT, 'src', 'app', 'data');
const env = readFileSync(join(ROOT, 'src', 'environments', 'environment.common.ts'), 'utf8');
const URL_ = env.match(/supabaseUrl: '([^']+)'/)[1];
const KEY = env.match(/supabaseKey:\s*'([^']+)'/)[1];
const POPULAR = 60;
const TOWN_MIN_ROUTES = 3;

async function rest(path) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${URL_}/rest/v1/${path}`, {
      headers: { apikey: KEY, Range: `${from}-${from + 999}`, 'Range-Unit': 'items' },
    });
    if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

const displayName = (k) => k.replace(/\s*\([A-Z]{2}\)$/, '');
const slugify = (t) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const inArea = (k) => !/\([A-Z]{2}\)$/.test(k) || k === 'Nagpur (MH)';
const write = (file, value, pretty = false) =>
  writeFileSync(join(DATA, file), JSON.stringify(value, null, pretty ? 1 : undefined) + '\n', 'utf8');

const [fares, rentals, rates] = await Promise.all([
  rest('route_fares?select=pickup,drop,distance_km,hatchback_price,sedan_price,suv_price&order=id'),
  rest('rental_packages?select=id,hours,km,hatchback_price,sedan_price,suv_price&is_active=eq.true&order=hours'),
  rest('round_trip_rates?select=*&is_active=eq.true&order=sort_order'),
]);

// ---- route pages: keep the previous popularity order -----------------------
const previous = JSON.parse(readFileSync(join(DATA, 'seo-routes.json'), 'utf8')).map((r) => `${r[0]}|${r[1]}`);
const rank = new Map(previous.map((k, i) => [k, i]));
const rows = fares
  .filter((f) => inArea(f.pickup) && inArea(f.drop))
  .map((f) => [f.pickup, f.drop, f.distance_km, f.hatchback_price, f.sedan_price, f.suv_price])
  .sort(
    (a, b) =>
      (rank.get(`${a[0]}|${a[1]}`) ?? 1e9) - (rank.get(`${b[0]}|${b[1]}`) ?? 1e9) ||
      a[0].localeCompare(b[0]) ||
      a[1].localeCompare(b[1]),
  );

const slugs = new Set();
for (const r of rows) {
  const s = `${slugify(displayName(r[0]))}-to-${slugify(displayName(r[1]))}`;
  if (slugs.has(s)) throw new Error(`duplicate route slug ${s}`);
  slugs.add(s);
}
writeFileSync(join(DATA, 'seo-routes.json'), JSON.stringify(rows) + '\n', 'utf8');

write(
  'popular-routes.json',
  rows.slice(0, POPULAR).map(([a, b, km, h, s, suv]) => ({
    slug: `${slugify(displayName(a))}-to-${slugify(displayName(b))}`,
    from: a,
    to: b,
    fromName: displayName(a),
    toName: displayName(b),
    km,
    fares: { Hatchback: h, Sedan: s, SUV: suv },
  })),
  true,
);

// ---- per place stats + towns ------------------------------------------------
const stats = {};
for (const [a, b, , h, s, suv] of rows) {
  const low = Math.min(h, s, suv);
  for (const k of [a, b]) stats[k] = [(stats[k]?.[0] ?? 0) + 1, Math.min(stats[k]?.[1] ?? low, low)];
}
write('place-stats.json', Object.fromEntries(Object.entries(stats).sort(([a], [b]) => a.localeCompare(b))));
write(
  'towns.json',
  Object.entries(stats)
    .filter(([k, [n]]) => n >= TOWN_MIN_ROUTES && !/airport/i.test(k))
    .sort(([a, [na]], [b, [nb]]) => nb - na || a.localeCompare(b))
    .map(([k]) => k),
  true,
);

// ---- rentals, round trip, and the booking form's offline copy ----------------
const rentalRows = rentals.map((p) => ({
  id: p.id,
  hours: p.hours,
  km: p.km,
  hatchback: p.hatchback_price,
  sedan: p.sedan_price,
  suv: p.suv_price,
}));
const roundTrip = rates.map((r) => ({
  slot: r.waiting_slot,
  perKm: { Hatchback: r.hatchback_per_km, Sedan: r.sedan_per_km, SUV: r.suv_per_km },
  base: { Hatchback: r.hatchback_base, Sedan: r.sedan_base, SUV: r.suv_base },
}));
write('rentals.json', rentalRows, true);
write('round-trip.json', roundTrip, true);

const names = [...new Set(fares.flatMap((f) => [f.pickup, f.drop]))].sort();
const index = new Map(names.map((n, i) => [n, i]));
writeFileSync(
  join(ROOT, 'public', 'data', 'catalog.json'),
  JSON.stringify({
    generated: new Date().toISOString().slice(0, 10),
    locations: names,
    routes: fares.map((f) => [
      index.get(f.pickup),
      index.get(f.drop),
      f.distance_km,
      f.hatchback_price,
      f.sedan_price,
      f.suv_price,
    ]),
    rentals: rentalRows,
    roundTrip,
  }),
  'utf8',
);

console.log(
  `fares from ${URL_}: ${rows.length} route pages, ${Object.keys(stats).length} places, ` +
    `${rentalRows.length} rental packages, ${roundTrip.length} round trip slots, catalog ${fares.length} routes`,
);
