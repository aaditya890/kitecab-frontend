import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { SITE } from '../config/site.config';

type Gtag = (...args: unknown[]) => void;

/**
 * Google Analytics / Ads events. The gtag and GTM scripts are loaded in index.html
 * (unchanged from the live site); this only sends events, and only in the browser.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Same conversion the live site fires on "Check price" (all three booking forms). */
  trackCheckPrice(): void {
    this.gtag('event', 'conversion', { send_to: SITE.analytics.checkPriceConversion });
  }

  /** Any other GA4 event, e.g. event('click_whatsapp', { location: 'header' }). */
  event(name: string, params: Record<string, unknown> = {}): void {
    this.gtag('event', name, params);
  }

  private gtag(...args: unknown[]): void {
    if (!this.isBrowser) return;
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    gtag?.(...args);
  }
}
