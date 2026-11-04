import { CarType } from '../../models/common.model';
import { CarPrices, RentalPackage, RoundTripRate } from '../../models/catalog.model';

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** 2100 -> '₹2,100' */
export function inr(amount: number): string {
  return `₹${INR.format(amount)}`;
}

/**
 * Approximate driving time for Chhattisgarh highways (~48 km/h average including
 * town stretches), rounded to 15 minutes. Always shown as "about".
 */
export function travelTime(km: number): string {
  const minutes = Math.max(30, Math.round(((km / 48) * 60) / 15) * 15);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function lowestFare(fares: CarPrices): number {
  return Math.min(fares.Hatchback, fares.Sedan, fares.SUV);
}

export function highestFare(fares: CarPrices): number {
  return Math.max(fares.Hatchback, fares.Sedan, fares.SUV);
}

/** Round trip = rate per km x approx km + base for the waiting time (same formula as the backend). */
export function roundTripFares(rate: RoundTripRate, km: number): CarPrices {
  const fare = (car: CarType) => rate.perKm[car] * km + rate.base[car];
  return { Hatchback: fare('Hatchback'), Sedan: fare('Sedan'), SUV: fare('SUV') };
}

export function rentalFares(pkg: RentalPackage): CarPrices {
  return { Hatchback: pkg.hatchback, Sedan: pkg.sedan, SUV: pkg.suv };
}

/** '8hour 80km' — the wording the WhatsApp templates and old records use. */
export function rentalLabel(pkg: Pick<RentalPackage, 'hours' | 'km'>): string {
  return `${pkg.hours}hour ${pkg.km}km`;
}

/** '8 hours · 80 km' for display. */
export function rentalDisplay(pkg: Pick<RentalPackage, 'hours' | 'km'>): string {
  return `${pkg.hours} hours · ${pkg.km} km`;
}
