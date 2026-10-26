import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api.service';

describe('toApiError', () => {
  it('shows the server message (e.g. invalid mobile)', () => {
    const err = toApiError(new HttpErrorResponse({ status: 400, error: { ok: false, message: 'mobile: enter a valid 10-digit mobile number' } }));
    expect(err.status).toBe(400);
    expect(err.message).toContain('valid 10-digit mobile');
  });
  it('explains offline errors', () => {
    expect(toApiError(new HttpErrorResponse({ status: 0 })).message).toContain('No internet');
  });
  it('falls back to a call/WhatsApp message', () => {
    expect(toApiError(new Error('x')).message).toContain('call or WhatsApp');
  });
});
