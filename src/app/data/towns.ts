import { PLACE_BY_KEY } from './places';
import townsJson from './towns.json';

/**
 * Towns with at least 3 routes in the price list but no hand-written city page.
 * Each gets a data-built page at /taxi-service/<slug> (fares, routes, FAQs).
 */
export interface Town {
  key: string;
  name: string;
  slug: string;
  /** Hand-written sentence from places.ts, when we have one. */
  blurb: string | null;
}

const displayName = (key: string) => key.replace(/\s*\([A-Z]{2}\)$/, '');
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const TOWNS: readonly Town[] = (townsJson as string[])
  .filter((key) => !PLACE_BY_KEY.get(key)?.hub)
  .map((key) => {
    const p = PLACE_BY_KEY.get(key);
    const name = p?.name ?? displayName(key);
    return { key, name, slug: p?.slug ?? slugify(name), blurb: p?.blurb ?? null };
  });

export const TOWN_BY_SLUG = new Map(TOWNS.map((t) => [t.slug, t]));
export const TOWN_BY_KEY = new Map(TOWNS.map((t) => [t.key, t]));
