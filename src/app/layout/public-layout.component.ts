import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MobileActionBarComponent } from './mobile-action-bar.component';
import { SiteFooterComponent } from './site-footer.component';
import { SiteHeaderComponent } from './site-header.component';

/** Frame for every public page: header, page content, footer, mobile call bar. */
@Component({
  selector: 'kc-public-layout',
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent, MobileActionBarComponent],
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >Skip to content</a
    >
    <kc-site-header />
    <main id="main" class="min-h-[60svh] pb-20 md:pb-0">
      <router-outlet />
    </main>
    <kc-site-footer />
    <kc-mobile-action-bar />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicLayoutComponent {}
