"""
Builds the website's fare data from a backup of the live database.

    python scripts/build-catalog.py <path-to-kitecab_rows.csv>

Writes:
  public/data/catalog.json        every active location, route, rental package and round-trip
                                  rate (loaded by the booking form in the browser)
  src/app/data/seo-routes.json    EVERY Chhattisgarh/Nagpur route in the price list, most booked
                                  first, compact: [from, to, km, hatchback, sedan, suv]. Each gets
                                  its own prerendered page /taxi/<from>-to-<to>.
  src/app/data/popular-routes.json the top routes as full objects (home, footer, service pages)
  src/app/data/place-stats.json   per place: [number of routes, cheapest one way fare]
  src/app/data/towns.json         places with at least TOWN_MIN_ROUTES routes that have no
                                  hand-written city page: get a data-built /taxi-service/<town>
  src/app/data/rentals.json       local rental packages (shown as text on city/service pages)
  src/app/data/round-trip.json    round-trip rates (shown on the round trip page)

Uses the same cleaning rules as kitecab-backend/supabase/migrations/003_migrate_legacy_data.sql
(trimmed names, 'Arrah(BR)' -> 'Arrah (BR)', latest duplicate wins, test rows dropped), so the
website shows exactly the prices in the database. When the website reads fares from Supabase
directly, this script is only needed for the SEO route list.
"""
import collections
import csv
import json
import re
import sys
from datetime import date
from pathlib import Path

POPULAR_ROUTE_COUNT = 60
TOWN_MIN_ROUTES = 3
ROOT = Path(__file__).resolve().parent.parent

# Round-trip fare = per_km * approx_km + base (same as round_trip_rates in the database).
ROUND_TRIP_RATES = [
    # slot,        hatch/km, sedan/km, suv/km, hatch base, sedan base, suv base
    ('1-3 hours', 10, 11, 16, 1200, 1200, 1400),
    ('3-6 hours', 10, 11, 16, 1200, 1200, 1400),
    ('6-9 hours', 10, 11, 16, 1300, 1300, 1500),
    ('1 day', 10, 11, 16, 1400, 1500, 1600),
    ('2 day', 10, 11, 16, 2800, 3000, 3200),
    ('3 day', 10, 11, 16, 4200, 4500, 4800),
]


def place(text):
    text = (text or '').strip()
    text = re.sub(r'\s*\(', ' (', text)
    text = re.sub(r'\s+', ' ', text)
    return text or None


def display_name(name):
    """'Nagpur (MH)' -> 'Nagpur'."""
    return re.sub(r'\s*\([A-Z]{2}\)$', '', name)


def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def to_int(value):
    try:
        return int(round(float(str(value).strip())))
    except (TypeError, ValueError):
        return None


def in_seo_area(name):
    """Chhattisgarh places have no state suffix; Nagpur is our one border city."""
    return not re.search(r'\([A-Z]{2}\)$', name) or name == 'Nagpur (MH)'


def main(csv_path):
    csv.field_size_limit(10**9)
    data = {r['key']: json.loads(r['value']) for r in csv.DictReader(open(csv_path, encoding='utf-8'))}

    # ---- routes (latest entry wins, like the migration) -------------------
    routes = {}
    for row in data.get('locationPrices', []):
        a, b = place(row.get('pickup')), place(row.get('dropoff'))
        if not a or not b or a == b or a.lower().startswith('testing') or b.lower().startswith('testing'):
            continue
        km, h, s, suv = (to_int(row.get(k)) for k in ('distance', 'price', 'sedanPrice', 'suvPrice'))
        if not all(v and v > 0 for v in (km, h, s, suv)) or row.get('active') is False:
            continue
        routes[(a, b)] = (km, h, s, suv)

    names = sorted({n for pair in routes for n in pair})
    index = {n: i for i, n in enumerate(names)}

    # ---- rental packages (ids follow the database: ordered by hours) -------
    rentals = []
    for row in sorted(data.get('rentalPackages', []), key=lambda r: to_int(re.sub(r'\D', '', r['time']))):
        hours = to_int(re.sub(r'\D', '', row['time']))
        rentals.append({
            'id': len(rentals) + 1, 'hours': hours, 'km': to_int(row['distance']),
            'hatchback': to_int(row['hatchbackPrice']), 'sedan': to_int(row['sedanPrice']), 'suv': to_int(row['suvPrice']),
        })

    catalog = {
        'generated': date.today().isoformat(),
        'locations': names,
        # [fromIndex, toIndex, km, hatchback, sedan, suv]
        'routes': [[index[a], index[b], *v] for (a, b), v in sorted(routes.items())],
        'rentals': rentals,
        'roundTrip': [
            {'slot': r[0], 'perKm': {'Hatchback': r[1], 'Sedan': r[2], 'SUV': r[3]},
             'base': {'Hatchback': r[4], 'Sedan': r[5], 'SUV': r[6]}}
            for r in ROUND_TRIP_RATES
        ],
    }
    out = ROOT / 'src' / 'app' / 'data' / 'rentals.json'
    out.write_text(json.dumps(rentals, indent=1) + '\n', encoding='utf-8')
    out = ROOT / 'src' / 'app' / 'data' / 'round-trip.json'
    out.write_text(json.dumps(catalog['roundTrip'], indent=1) + '\n', encoding='utf-8')

    out = ROOT / 'public' / 'data' / 'catalog.json'
    out.write_text(json.dumps(catalog, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
    print(f'{out.relative_to(ROOT)}: {len(names)} locations, {len(routes)} routes, {len(rentals)} rental packages')

    # ---- SEO routes: most enquired + booked (bookings count 3x) -----------
    demand = collections.Counter()
    for row in data.get('enquiry', []):
        demand[(place(row.get('pickupLocation')), place(row.get('dropLocationOrPackages')))] += 1
    for row in data.get('customersRecord', []):
        b = row.get('bookingDetail') or {}
        demand[(place(b.get('pickupLocation')), place(b.get('dropLocation')))] += 3

    eligible = [k for k in routes if in_seo_area(k[0]) and in_seo_area(k[1])]
    ranked = sorted(eligible, key=lambda k: (-demand[k], k))

    slugs = collections.Counter(f'{slugify(display_name(a))}-to-{slugify(display_name(b))}' for a, b in ranked)
    clashes = [s for s, n in slugs.items() if n > 1]
    if clashes:
        sys.exit(f'Duplicate route slugs: {clashes}')

    out = ROOT / 'src' / 'app' / 'data' / 'seo-routes.json'
    out.write_text(json.dumps([[a, b, *routes[(a, b)]] for a, b in ranked], separators=(',', ':'), ensure_ascii=False) + chr(10), encoding='utf-8')
    print(f'{out.relative_to(ROOT)}: {len(ranked)} route pages')

    popular = []
    for a, b in ranked[:POPULAR_ROUTE_COUNT]:
        km, h, s_, suv = routes[(a, b)]
        from_name, to_name = display_name(a), display_name(b)
        popular.append({
            'slug': f'{slugify(from_name)}-to-{slugify(to_name)}',
            'from': a, 'to': b, 'fromName': from_name, 'toName': to_name,
            'km': km, 'fares': {'Hatchback': h, 'Sedan': s_, 'SUV': suv},
        })
    out = ROOT / 'src' / 'app' / 'data' / 'popular-routes.json'
    out.write_text(json.dumps(popular, indent=1, ensure_ascii=False) + chr(10), encoding='utf-8')
    print(f'{out.relative_to(ROOT)}: {len(popular)} routes')

    # ---- towns: places with enough routes for a data-built city page --------
    count = collections.Counter()
    for a, b in eligible:
        count[a] += 1
        count[b] += 1
    towns = sorted(
        (k for k, n in count.items() if n >= TOWN_MIN_ROUTES and 'airport' not in k.lower()),
        key=lambda k: (-count[k], k),
    )
    out = ROOT / 'src' / 'app' / 'data' / 'towns.json'
    out.write_text(json.dumps(towns, indent=1, ensure_ascii=False) + chr(10), encoding='utf-8')
    print(f'{out.relative_to(ROOT)}: {len(towns)} towns')

    # ---- per place: number of routes and the cheapest one way fare ---------
    stats = {}
    for a, b in eligible:
        low = min(routes[(a, b)][1:])
        for k in (a, b):
            n, m = stats.get(k, (0, low))
            stats[k] = (n + 1, min(m, low))
    out = ROOT / 'src' / 'app' / 'data' / 'place-stats.json'
    out.write_text(json.dumps({k: list(v) for k, v in sorted(stats.items())}, separators=(',', ':'), ensure_ascii=False) + chr(10), encoding='utf-8')
    print(f'{out.relative_to(ROOT)}: {len(stats)} places')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
