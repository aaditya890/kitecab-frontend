import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { COMPANY_NAV, POLICY_NAV } from '../core/config/navigation';
import { cityPath, HUBS } from '../data/places';
import { routePath, SEO_ROUTES } from '../data/seo-routes';
import { SITE } from '../core/config/site.config';
import { SiteSettingsService } from '../core/services/site-settings.service';
import { IconComponent } from '../shared/components/icon/icon.component';
import { LogoComponent } from '../shared/components/logo/logo.component';

@Component({
  selector: 'kc-site-footer',
  imports: [RouterLink, LogoComponent, IconComponent],
  template: `
    <footer class="bg-kc-night text-white/80">
      <div
        class="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:gap-10 sm:py-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]"
      >
        <section aria-labelledby="footer-about" class="col-span-2 sm:col-span-1">
          <h2 id="footer-about" class="sr-only">About KiteCab</h2>
          <kc-logo tone="onDark" [size]="48" [tagline]="true" />
          <p class="mt-4 max-w-md text-sm leading-relaxed sm:mt-5">
            KiteCab is a Raipur-based taxi service for all of Chhattisgarh. Book one way drops, round trips, airport
            transfers and local rentals across {{ cityList }} — with clear fares shown before you book and drivers who
            know local roads.
          </p>
          <div class="mt-5 flex gap-2">
            <a
              [href]="site.social.facebook"
              target="_blank"
              rel="noopener"
              aria-label="KiteCab on Facebook"
              class="inline-flex size-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
              ><kc-icon name="facebook"
            /></a>
            <a
              [href]="site.social.instagram"
              target="_blank"
              rel="noopener"
              aria-label="KiteCab on Instagram"
              class="inline-flex size-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
              ><kc-icon name="instagram"
            /></a>
            <a
              [href]="site.social.x"
              target="_blank"
              rel="noopener"
              aria-label="KiteCab on X"
              class="inline-flex size-11 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
              ><kc-icon name="x" [size]="18"
            /></a>
          </div>
        </section>

        <section aria-labelledby="footer-contact" class="col-span-2 sm:col-span-1">
          <h2 id="footer-contact" class="text-sm font-semibold tracking-wide text-white uppercase">Contact</h2>
          <address class="mt-4 flex flex-col gap-3 text-sm not-italic">
            <a [href]="settings.telHref()" class="flex items-center gap-3 hover:text-kc-yellow">
              <kc-icon name="phone" [size]="18" class="text-kc-yellow" />
              {{ settings.contact().phoneDisplay }}
            </a>
            <a
              [href]="settings.whatsappHref()"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-3 hover:text-kc-yellow"
            >
              <kc-icon name="whatsapp" [size]="18" class="text-kc-yellow" />
              WhatsApp us
            </a>
            <a
              [href]="settings.mailHref()"
              class="flex items-center gap-3 [overflow-wrap:anywhere] hover:text-kc-yellow"
            >
              <kc-icon name="mail" [size]="18" class="text-kc-yellow" />
              {{ settings.contact().email }}
            </a>
            <span class="flex items-start gap-3">
              <kc-icon name="mapPin" [size]="18" class="mt-0.5 text-kc-yellow" />
              {{ settings.addressText() }}
            </span>
          </address>
        </section>

        <nav aria-labelledby="footer-routes">
          <h2 id="footer-routes" class="text-sm font-semibold tracking-wide text-white uppercase">Popular routes</h2>
          <ul class="mt-3 flex flex-col text-sm sm:mt-4 sm:gap-1">
            @for (r of routes; track r.slug) {
              <li>
                <a [routerLink]="routePath(r)" class="inline-block py-1 hover:text-kc-yellow sm:py-1.5"
                  >{{ r.fromName }} to {{ r.toName }}</a
                >
              </li>
            }
          </ul>
        </nav>

        <nav aria-labelledby="footer-cities">
          <h2 id="footer-cities" class="text-sm font-semibold tracking-wide text-white uppercase">Cities</h2>
          <ul class="mt-3 flex flex-col text-sm sm:mt-4 sm:gap-1">
            @for (h of hubs; track h.slug) {
              <li>
                <a [routerLink]="cityPath(h.slug)" class="inline-block py-1 hover:text-kc-yellow sm:py-1.5">{{
                  h.slug === 'raipur-airport' ? 'Raipur Airport' : h.name
                }}</a>
              </li>
            }
          </ul>
          <h2 class="mt-6 text-sm font-semibold tracking-wide text-white uppercase">Company</h2>
          <ul class="mt-3 flex flex-col text-sm sm:gap-1">
            @for (link of links; track link.path) {
              <li>
                <a [routerLink]="link.path" class="inline-block py-1 hover:text-kc-yellow sm:py-1.5">{{
                  link.label
                }}</a>
              </li>
            }
          </ul>
        </nav>
      </div>

      <div class="border-t border-white/10">
        <p class="mx-auto max-w-6xl px-4 pt-5 pb-24 text-xs text-white/60 md:pb-5">
          © {{ year }} {{ site.legalName }}, {{ settings.contact().address.city }}, Chhattisgarh. All rights reserved.
        </p>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooterComponent {
  protected readonly settings = inject(SiteSettingsService);
  protected readonly site = SITE;
  protected readonly links = [...COMPANY_NAV, ...POLICY_NAV];
  protected readonly routes = SEO_ROUTES.slice(0, 8);
  protected readonly hubs = HUBS;
  protected readonly routePath = routePath;
  protected readonly cityPath = cityPath;
  protected readonly year = new Date().getFullYear();
  protected readonly cityList = SITE.keyCities.slice(0, -1).join(', ') + ' and ' + SITE.keyCities.at(-1);
}
