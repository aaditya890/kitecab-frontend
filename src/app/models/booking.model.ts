import { BookingType, CarType } from './common.model';

// Request/response shapes of kitecab-backend (lib/validate.ts). Keep in sync.

/** POST /api/enquiry — "Check price". */
export interface EnquiryRequest {
  serviceType: BookingType;
  pickup: string;
  dropOrPackage: string;
  mobile: string;
}

export interface EnquiryResponse {
  ok: true;
  enquiryId: number;
}

export interface BookingCustomer {
  fullName: string;
  mobile: string;
  email: string;
  passengers: number;
  pickupAddress: string;
  /** YYYY-MM-DD */
  pickupDate: string;
  pickupTime: string;
}

/** POST /api/booking. The server works out the fare; the browser never sends a price. */
export interface BookingRequest {
  bookingType: BookingType;
  carType: CarType;
  pickup: string;
  /** one way and round trip */
  drop?: string;
  /** local rental */
  rentalPackageId?: number;
  /** round trip */
  waitingTime?: string;
  approxDistanceKm?: number;
  customer: BookingCustomer;
}

export interface BookingResponse {
  ok: true;
  bookingId: number;
  fare: number;
  advanceAmount: number;
  /** null when the payment link could not be created; staff will follow up. */
  paymentLink: string | null;
}
