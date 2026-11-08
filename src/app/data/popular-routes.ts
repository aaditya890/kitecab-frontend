import { SeoRoute } from '../models/catalog.model';
import popularJson from './popular-routes.json';
import statsJson from './place-stats.json';

/** The most booked routes (small list for home, footer and service pages). */
export const POPULAR_ROUTES: readonly SeoRoute[] = popularJson as SeoRoute[];

export function routePath(route: Pick<SeoRoute, 'slug'>): string {
  return `/taxi/${route.slug}`;
}

/** Popular routes starting or ending at a place, most booked first. */
export function popularFor(placeKey: string, limit = 12): SeoRoute[] {
  return POPULAR_ROUTES.filter((r) => r.from === placeKey || r.to === placeKey).slice(0, limit);
}

/** Per place: how many routes we have and the cheapest one way fare. */
const STATS = statsJson as unknown as Record<string, [routes: number, from: number]>;

export function placeStats(placeKey: string): { routes: number; from: number } | null {
  const s = STATS[placeKey];
  return s ? { routes: s[0], from: s[1] } : null;
}

/** Total number of route pages (for "N routes" text without loading the full list). */
export const ROUTE_PAGE_COUNT = Object.values(STATS).reduce((n, s) => n + s[0], 0) / 2;

/** Cheapest one way fare on any route. */
export const CHEAPEST_FARE = Math.min(...Object.values(STATS).map((s) => s[1]));
