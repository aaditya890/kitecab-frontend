import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { AnalyticsService } from '../../core/services/analytics.service';
import { SiteSettingsService } from '../../core/services/site-settings.service';
import { IconComponent } from './icon/icon.component';

/** "Talk to us" band with call and WhatsApp buttons. */
@Component({
  selector: 'kc-cta-band',
  imports: [IconComponent],
  template: `
    <section class="rounded-2xl bg-kc-teal px-6 py-8 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-10">
      <div>
        <h2 class="text-2xl font-semibold">{{ heading() }}</h2>
        <p class="mt-1 text-white/80">{{ text() }}</p>
      </div>
      <div class="mt-5 flex flex-wrap gap-3 sm:mt-0 sm:shrink-0">
        <a [href]="settings.telHref()" (click)="analytics.event('click_call', { location: 'cta_band' })"
          class="inline-flex h-12 items-center gap-2 rounded-xl bg-kc-yellow px-5 font-bold text-kc-night hover:bg-kc-yellow-dark">
          <kc-icon name="phone" [size]="18" /> {{ settings.contact().phoneDisplay }}
        </a>
        <a [href]="settings.whatsappHref()" target="_blank" rel="noopener" (click)="analytics.event('click_whatsapp', { location: 'cta_band' })"
          class="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 font-semibold text-kc-ink hover:bg-kc-surface">
          <kc-icon name="whatsapp" class="text-[#1c8a43]" /> WhatsApp
        </a>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaBandComponent {
  readonly heading = input('Need a cab right now?');
  readonly text = input('Call or WhatsApp us — we reply in minutes, day and night.');
  protected readonly settings = inject(SiteSettingsService);
  protected readonly analytics = inject(AnalyticsService);
}
