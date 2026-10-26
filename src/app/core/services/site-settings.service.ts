import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { ContactInfo, SettingRow } from '../../models/site-settings.model';
import { SITE } from '../config/site.config';
import { formatIndianPhone, toInternationalDigits, whatsappLink } from '../utils/phone';

/**
 * Contact details for the whole website.
 *
 * Starts with the defaults in site.config.ts, then reads Admin → Settings from the
 * database (public rows only). The build bakes the latest values into the HTML and
 * each visit refreshes them, so a number changed by the admin shows without a deploy.
 * If the database can't be reached, the defaults stay — the site never breaks.
 */
@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly http = inject(HttpClient);

  private readonly state = signal<ContactInfo>(structuredClone(SITE.contact) as ContactInfo);

  readonly contact = this.state.asReadonly();
  readonly telHref = computed(() => `tel:${this.state().phone}`);
  readonly mailHref = computed(() => `mailto:${this.state().email}`);
  readonly whatsappHref = computed(() => whatsappLink(this.state().whatsapp, SITE.whatsappGreeting));
  readonly addressText = computed(() => {
    const a = this.state().address;
    return [a.line, a.city, a.region, a.postalCode].filter(Boolean).join(', ');
  });

  constructor() {
    this.refresh();
  }

  /** WhatsApp link with a custom prefilled message. */
  whatsappWith(text: string): string {
    return whatsappLink(this.state().whatsapp, text);
  }

  refresh(): void {
    const url = `${environment.supabaseUrl}/rest/v1/settings?select=key,value&is_public=eq.true`;
    const headers = new HttpHeaders({ apikey: environment.supabaseKey });
    // transferCache off: a visitor always gets the latest admin values, not the build-time copy.
    this.http.get<SettingRow[]>(url, { headers, transferCache: false }).subscribe({
      next: (rows) => this.state.update((current) => applySettings(current, rows)),
      error: () => undefined, // keep defaults
    });
  }
}

/** Merge public settings rows over the current contact details. Exported for tests. */
export function applySettings(current: ContactInfo, rows: SettingRow[]): ContactInfo {
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const next: ContactInfo = { ...current, address: { ...current.address } };

  const phone = byKey.get('support_phone');
  if (typeof phone === 'string' && toInternationalDigits(phone).length >= 12) {
    next.phone = `+${toInternationalDigits(phone)}`;
    next.phoneDisplay = formatIndianPhone(phone);
  }
  const whatsapp = byKey.get('support_whatsapp');
  if (typeof whatsapp === 'string' && toInternationalDigits(whatsapp).length >= 12) {
    next.whatsapp = toInternationalDigits(whatsapp);
  }
  const email = byKey.get('support_email');
  if (typeof email === 'string' && email.includes('@')) next.email = email.trim();

  const business = byKey.get('business');
  if (business && typeof business === 'object') {
    const b = business as Record<string, unknown>;
    if (typeof b['address'] === 'string' && b['address'].trim()) next.address.line = b['address'].trim();
    if (typeof b['city'] === 'string' && b['city'].trim()) next.address.city = b['city'].trim();
    if (typeof b['postalCode'] === 'string') next.address.postalCode = b['postalCode'].trim();
  }
  return next;
}
