// Values shared with the database enums (supabase/migrations/001_schema.sql).
// Keep these in sync when the database changes.

export type BookingType = 'oneway' | 'round-trip' | 'local-rental';
export type CarType = 'Hatchback' | 'Sedan' | 'SUV';
export type BookingStatus = 'new' | 'confirmed' | 'assigned' | 'completed' | 'cancelled';
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED';

export const CAR_TYPES: readonly CarType[] = ['Hatchback', 'Sedan', 'SUV'];

export const BOOKING_TYPE_LABELS: Record<BookingType, string> = {
  oneway: 'One way',
  'round-trip': 'Round trip',
  'local-rental': 'Local rental',
};

/** One page of a server-side paginated list. */
export interface Page<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}
