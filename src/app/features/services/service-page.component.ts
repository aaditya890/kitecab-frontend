import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { breadcrumbs, Crumb, faqPage, graph, localBusiness, taxiService } from '../../core/seo/schema';
import { SeoService } from '../../core/services/seo.service';
import { inr, rentalDisplay } from '../../core/utils/fare';
import { cityPath, HUBS } from '../../data/places';
import { SEO_ROUTES } from '../../data/seo-routes';
import { RENTALS, ROUND_TRIP_RATES, SERVICES } from '../../data/services';
import { BookingWidgetComponent } from '../booking/booking-widget.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs.component';
import { CtaBandComponent } from '../../shared/components/cta-band.component';
import { FaqComponent } from '../../shared/components/faq.component';
import { RouteLinksComponent } from '../../shared/components/route-links.component';

/** /one-way-taxi, /round-trip-cab, /local-taxi-rental (chosen by route data `service`). */
@Component({
  selector: 'kc-service-page',
  imports: [RouterLink, BookingWidgetComponent, BreadcrumbsComponent, CtaBandComponent, FaqComponent, RouteLinksComponent],
  template: `
    @let s = page();
    <section class="bg-gradient-to-b from-white to-kc-surface">
      <div class="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_440px] lg:py-12">
        <div>
          <kc-breadcrumbs [items]="crumbs()" />
          <h1 class="mt-4 text-3xl font-bold text-kc-ink sm:text-4xl">{{ s.h1 }}</h1>
          @for (para of s.intro; track $index) {
            <p class="mt-4 text-lg leading-relaxed text-kc-muted">{{ para }}</p>
          }
          <ol class="mt-6 space-y-3">
            @for (step of s.steps; track $index) {
              <li class="flex items-start gap-3">
                <span class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-kc-yellow text-sm font-bold text-kc-night">{{ $index + 1 }}</span>
                <span class="pt-0.5">{{ step }}</span>
              </li>
            }
          </ol>
        </div>
        <kc-booking-widget [initialType]="s.type" />
      </div>
    </section>

    <div class="mx-auto max-w-6xl space-y-14 px-4 py-12">
      @switch (service()) {
        @case ('one-way') {
          <section aria-labelledby="price-h">
            <h2 id="price-h" class="mb-5 text-2xl font-semibold">Popular one way taxi routes</h2>
            <kc-route-links [routes]="topRoutes" />
            <p class="mt-4 text-sm"><a routerLink="/taxi-routes" class="font-medium text-kc-teal hover:underline">All routes and fares →</a></p>
          </section>
        }
        @case ('round-trip') {
          <section aria-labelledby="price-h">
            <h2 id="price-h" class="text-2xl font-semibold">Round trip rates</h2>
            <p class="mt-2 mb-5 text-kc-muted">Fare = rate per km × total km (up and down) + amount for waiting time.</p>
            <div class="overflow-x-auto rounded-2xl border border-kc-line bg-white">
              <table class="w-full min-w-[560px] text-left">
                <caption class="sr-only">Round trip cab rates by waiting time</caption>
                <thead class="bg-kc-surface text-sm text-kc-muted">
                  <tr>
                    <th scope="col" class="px-5 py-3 font-medium">Waiting time</th>
                    <th scope="col" class="px-5 py-3 font-medium">Hatchback</th>
                    <th scope="col" class="px-5 py-3 font-medium">Sedan</th>
                    <th scope="col" class="px-5 py-3 font-medium">SUV</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-kc-line">
                  @for (r of rates; track r.slot) {
                    <tr>
                      <th scope="row" class="px-5 py-4 font-semibold">{{ r.slot }}</th>
                      <td class="px-5 py-4">₹{{ r.perKm.Hatchback }}/km + {{ inr(r.base.Hatchback) }}</td>
                      <td class="px-5 py-4">₹{{ r.perKm.Sedan }}/km + {{ inr(r.base.Sedan) }}</td>
                      <td class="px-5 py-4">₹{{ r.perKm.SUV }}/km + {{ inr(r.base.SUV) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
        @case ('local-rental') {
          <section aria-labelledby="price-h">
            <h2 id="price-h" class="text-2xl font-semibold">Local rental packages</h2>
            <ul class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              @for (r of rentals; track r.id) {
                <li class="rounded-2xl border border-kc-line bg-white p-5">
                  <h3 class="text-lg font-semibold">{{ rentalDisplay(r) }}</h3>
                  <dl class="mt-3 grid grid-cols-2 gap-y-1 text-sm">
                    <dt class="text-kc-muted">Hatchback</dt><dd class="text-right font-semibold">{{ inr(r.hatchback) }}</dd>
                    <dt class="text-kc-muted">Sedan</dt><dd class="text-right font-semibold">{{ inr(r.sedan) }}</dd>
                    <dt class="text-kc-muted">SUV</dt><dd class="text-right font-semibold">{{ inr(r.suv) }}</dd>
                  </dl>
                </li>
              }
            </ul>
          </section>
        }
      }

      <section aria-labelledby="cities-h">
        <h2 id="cities-h" class="mb-4 text-2xl font-semibold">Available in these cities</h2>
        <ul class="flex flex-wrap gap-2">
          @for (h of hubs; track h.slug) {
            <li><a [routerLink]="cityPath(h.slug)" class="inline-block rounded-full border border-kc-line bg-white px-4 py-2 text-sm hover:border-kc-teal">{{ h.name }}</a></li>
          }
        </ul>
      </section>

      <kc-faq [items]="s.faqs" />
      <kc-cta-band />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicePageComponent implements OnInit {
  readonly service = input<keyof typeof SERVICES>('one-way');

  private readonly seo = inject(SeoService);
  protected readonly page = computed(() => SERVICES[this.service()]);
  protected readonly topRoutes = SEO_ROUTES.slice(0, 12);
  protected readonly rates = ROUND_TRIP_RATES;
  protected readonly rentals = RENTALS;
  protected readonly hubs = HUBS;
  protected readonly inr = inr;
  protected readonly rentalDisplay = rentalDisplay;
  protected readonly cityPath = cityPath;
  protected readonly crumbs = computed<Crumb[]>(() => [
    { name: 'Home', path: '/' },
    { name: this.page().h1, path: this.page().path },
  ]);

  ngOnInit(): void {
    const s = this.page();
    this.seo.set({
      title: s.title,
      description: s.description,
      path: s.path,
      jsonLd: graph(
        localBusiness(),
        taxiService({ name: s.h1, path: s.path, area: ['Chhattisgarh', ...HUBS.map((h) => h.name)], description: s.intro[0] }),
        breadcrumbs(this.crumbs()),
        faqPage(s.faqs),
      ),
    });
  }
}
