import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BookingRequest, BookingResponse, EnquiryRequest, EnquiryResponse } from '../../models/booking.model';

/** An API failure with a message that is safe to show the customer. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const FALLBACK_MESSAGE = 'Something went wrong. Please call or WhatsApp us to book.';

/** Calls kitecab-backend (Vercel). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  sendEnquiry(body: EnquiryRequest): Observable<EnquiryResponse> {
    return this.post<EnquiryResponse>('/enquiry', body);
  }

  createBooking(body: BookingRequest): Observable<BookingResponse> {
    return this.post<BookingResponse>('/booking', body);
  }

  private post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body).pipe(catchError((err) => throwError(() => toApiError(err))));
  }
}

/** Exported for tests. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      // status 0 = the request never got an answer: either the phone is offline or our server is unreachable
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      return new ApiError(
        offline
          ? 'No internet connection. Please check and try again.'
          : 'We could not reach our booking system just now. Send the booking on WhatsApp or call us — we will confirm it.',
        0,
      );
    }
    const message = typeof err.error?.message === 'string' ? err.error.message : FALLBACK_MESSAGE;
    return new ApiError(message, err.status);
  }
  return new ApiError(FALLBACK_MESSAGE, -1);
}
