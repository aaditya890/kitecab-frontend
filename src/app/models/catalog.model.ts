import { CarType } from './common.model';

export type CarPrices = Record<CarType, number>;

/** public/data/catalog.json (built by scripts/build-catalog.py; later served from Supabase). */
export interface CatalogFile {
  generated: string;
  locations: string[];
  /** [fromIndex, toIndex, km, hatchback, sedan, suv] */
  routes: [number, number, number, number, number, number][];
  rentals: RentalPackage[];
  roundTrip: RoundTripRate[];
}

export interface RentalPackage {
  id: number;
  hours: number;
  km: number;
  hatchback: number;
  sedan: number;
  suv: number;
}

export interface RoundTripRate {
  slot: string;
  perKm: CarPrices;
  base: CarPrices;
}

export interface RouteFare {
  km: number;
  fares: CarPrices;
}

/** One SEO route page (src/app/data/seo-routes.json). */
export interface SeoRoute {
  slug: string;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  km: number;
  fares: CarPrices;
}
