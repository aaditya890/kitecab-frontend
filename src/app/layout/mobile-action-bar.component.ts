import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AnalyticsService } from '../core/services/analytics.service';
import { SiteSettingsService } from '../core/services/site-settings.service';
import { IconComponent } from '../shared/components/icon/icon.component';

/** Call / WhatsApp bar fixed to the bottom of phones — most ad traffic is mobile. */
@Component({
  selector: 'kc-mobile-action-bar',
  imports: [IconComponent],
  template: `
    <div class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-kc-line bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      <a
        [href]="settings.telHref()"
        (click)="analytics.event('click_call', { location: 'mobile_bar' })"
        class="flex h-12 items-center justify-center gap-2 rounded-xl bg-kc-teal font-semibold text-white"
      >
        <kc-icon name="phone" [size]="18" /> Call now
      </a>
      <a
        [href]="settings.whatsappHref()"
        target="_blank"
        rel="noopener"
        (click)="analytics.event('click_whatsapp', { location: 'mobile_bar' })"
        class="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1c8a43] font-semibold text-white"
      >
        <kc-icon name="whatsapp" [size]="20" /> WhatsApp
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileActionBarComponent {
  protected readonly settings = inject(SiteSettingsService);
  protected readonly analytics = inject(AnalyticsService);
}
