import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SITE } from '../../core/config/site.config';
import { breadcrumbs, graph, localBusiness } from '../../core/seo/schema';
import { AnalyticsService } from '../../core/services/analytics.service';
import { SeoService } from '../../core/services/seo.service';
import { SiteSettingsService } from '../../core/services/site-settings.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'kc-contact',
  imports: [BreadcrumbsComponent, IconComponent],
  template: `
    <div class="mx-auto max-w-4xl px-4 py-10">
      <kc-breadcrumbs [items]="crumbs" />
      <h1 class="mt-4 text-3xl font-bold sm:text-4xl">Contact KiteCab</h1>
      <p class="mt-3 text-lg text-kc-muted">Call or WhatsApp to book a cab, change a booking or ask about a fare.</p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <a [href]="settings.telHref()" (click)="analytics.event('click_call', { location: 'contact' })"
          class="flex items-center gap-4 rounded-2xl border border-kc-line bg-white p-5 hover:border-kc-teal">
          <span class="inline-flex size-12 items-center justify-center rounded-xl bg-kc-teal text-white"><kc-icon name="phone" /></span>
          <span><span class="block text-sm text-kc-muted">Call</span><span class="text-lg font-semibold">{{ settings.contact().phoneDisplay }}</span></span>
        </a>
        <a [href]="settings.whatsappHref()" target="_blank" rel="noopener" (click)="analytics.event('click_whatsapp', { location: 'contact' })"
          class="flex items-center gap-4 rounded-2xl border border-kc-line bg-white p-5 hover:border-kc-teal">
          <span class="inline-flex size-12 items-center justify-center rounded-xl bg-[#15773a] text-white"><kc-icon name="whatsapp" /></span>
          <span><span class="block text-sm text-kc-muted">WhatsApp</span><span class="text-lg font-semibold">Chat with us</span></span>
        </a>
        <a [href]="settings.mailHref()" class="flex items-center gap-4 rounded-2xl border border-kc-line bg-white p-5 hover:border-kc-teal">
          <span class="inline-flex size-12 items-center justify-center rounded-xl bg-kc-yellow text-kc-night"><kc-icon name="mail" /></span>
          <span class="min-w-0"><span class="block text-sm text-kc-muted">Email</span><span class="block truncate text-lg font-semibold">{{ settings.contact().email }}</span></span>
        </a>
        <a [href]="mapUrl" target="_blank" rel="noopener" class="flex items-center gap-4 rounded-2xl border border-kc-line bg-white p-5 hover:border-kc-teal">
          <span class="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-kc-surface text-kc-teal"><kc-icon name="mapPin" /></span>
          <span><span class="block text-sm text-kc-muted">Office</span><span class="font-semibold">{{ settings.addressText() }}</span></span>
        </a>
      </div>

      <section class="kc-prose mt-10">
        <h2>Booking help</h2>
        <ul>
          <li>Have your booking ID ready when you call about an existing booking.</li>
          <li>For cancellations and refunds, see our <a href="/refund-policy">cancellation and refund policy</a>.</li>
          <li>For airport pickups, share your flight number so we can track the arrival.</li>
        </ul>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  protected readonly settings = inject(SiteSettingsService);
  protected readonly analytics = inject(AnalyticsService);
  protected readonly mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SITE.name} ${SITE.contact.address.line}, ${SITE.contact.address.city}`)}`;
  protected readonly crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Contact', path: '/contact-us' },
  ];

  constructor() {
    inject(SeoService).set({
      title: 'Contact KiteCab – Book a Taxi in Raipur and Chhattisgarh',
      description: 'Call or WhatsApp KiteCab to book a taxi in Raipur, Bilaspur and across Chhattisgarh. Office at Kamal Vihar, Raipur.',
      path: '/contact-us',
      jsonLd: graph(localBusiness(), breadcrumbs(this.crumbs)),
    });
  }
}
