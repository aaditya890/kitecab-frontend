import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SeoService } from '../../core/services/seo.service';
import { SiteSettingsService } from '../../core/services/site-settings.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';

/** Temporary home page. Replaced by the full booking home page in the website step. */
@Component({
  selector: 'kc-home',
  imports: [LogoComponent],
  template: `
    <section class="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <kc-logo [size]="72" [tagline]="true" />
      <h1 class="text-3xl font-semibold text-kc-ink sm:text-4xl">Taxi service in Chhattisgarh</h1>
      <p class="text-kc-muted">One way, round trip, airport and local rental cabs across Chhattisgarh and Nagpur.</p>
      <a
        class="inline-flex h-12 items-center rounded-xl bg-kc-yellow px-6 font-semibold text-kc-night hover:bg-kc-yellow-dark"
        [href]="settings.telHref()"
        >Call {{ settings.contact().phoneDisplay }}</a
      >
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly settings = inject(SiteSettingsService);

  constructor() {
    inject(SeoService).set({
      title: 'Taxi Service in Chhattisgarh – Raipur, Bilaspur Cabs | KiteCab',
      description:
        'Book a taxi in Raipur, Bilaspur, Durg, Bhilai and all of Chhattisgarh. One way, round trip, airport and local rental cabs with clear fares.',
      path: '/',
    });
  }
}
