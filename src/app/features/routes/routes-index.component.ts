import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { breadcrumbs, graph, localBusiness } from '../../core/seo/schema';
import { SeoService } from '../../core/services/seo.service';
import { cityPath, HUBS, PLACE_BY_KEY } from '../../data/places';
import { routePath, SEO_ROUTES } from '../../data/seo-routes';
import { TOWNS } from '../../data/towns';
import { inr, lowestFare } from '../../core/utils/fare';
import { SeoRoute } from '../../models/catalog.model';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs.component';
import { CtaBandComponent } from '../../shared/components/cta-band.component';

interface Group {
  name: string;
  routes: SeoRoute[];
}

/** /taxi-routes — every route page, grouped by starting city (crawl hub for Google). */
@Component({
  selector: 'kc-routes-index',
  imports: [RouterLink, BreadcrumbsComponent, CtaBandComponent],
  template: `
    <div class="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <header>
        <kc-breadcrumbs [items]="crumbs" />
        <h1 class="mt-4 text-3xl font-bold sm:text-4xl">Taxi routes and fares in Chhattisgarh</h1>
        <p class="mt-3 max-w-3xl text-lg text-kc-muted">
          Fixed one way cab fares for {{ total }} routes across Chhattisgarh and to Nagpur — from Raipur, Bilaspur,
          Durg, Bhilai, Korba, Raigarh, Jagdalpur, Ambikapur and {{ groups.length - 8 }} more towns. Every fare is for
          the full trip, with no return charge. Tap a route for Hatchback, Sedan and SUV prices.
        </p>
      </header>

      @for (g of groups; track g.name) {
        <section [attr.aria-label]="'Taxi from ' + g.name">
          <h2 class="mb-3 text-xl font-semibold">
            Taxi from {{ g.name }} <span class="text-sm font-normal text-kc-muted">· {{ g.routes.length }} routes</span>
          </h2>
          <ul class="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            @for (r of g.routes; track r.slug) {
              <li>
                <a
                  [routerLink]="routePath(r)"
                  class="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white hover:text-kc-teal"
                >
                  <span>{{ r.fromName }} to {{ r.toName }}</span>
                  <span class="shrink-0 font-semibold text-kc-teal">{{ inr(low(r)) }}</span>
                </a>
              </li>
            }
          </ul>
        </section>
      }

      <section aria-labelledby="cities-h">
        <h2 id="cities-h" class="mb-4 text-xl font-semibold">Taxi service by city</h2>
        <ul class="flex flex-wrap gap-2">
          @for (h of hubs; track h.slug) {
            <li>
              <a
                [routerLink]="cityPath(h.slug)"
                class="inline-block rounded-full border border-kc-line bg-white px-4 py-2 text-sm hover:border-kc-teal"
                >{{ h.hub.heading }}</a
              >
            </li>
          }
          @for (t of towns; track t.slug) {
            <li>
              <a
                [routerLink]="cityPath(t.slug)"
                class="inline-block rounded-full border border-kc-line bg-white px-4 py-2 text-sm hover:border-kc-teal"
                >Taxi in {{ t.name }}</a
              >
            </li>
          }
        </ul>
      </section>

      <kc-cta-band
        heading="Your route isn’t listed?"
        text="We drive to every district of Chhattisgarh. Call or WhatsApp for a fare."
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutesIndexComponent {
  protected readonly hubs = HUBS;
  protected readonly towns = TOWNS;
  protected readonly total = SEO_ROUTES.length;
  protected readonly routePath = routePath;
  protected readonly inr = inr;
  protected readonly low = (r: SeoRoute) => lowestFare(r.fares);
  protected readonly cityPath = cityPath;
  protected readonly crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Taxi routes', path: '/taxi-routes' },
  ];
  protected readonly groups: Group[] = (() => {
    const map = new Map<string, SeoRoute[]>();
    for (const r of SEO_ROUTES) map.set(r.fromName, [...(map.get(r.fromName) ?? []), r]);
    const order = (name: string) => {
      const i = HUBS.findIndex((h) => h.name === name || PLACE_BY_KEY.get(h.key)?.name === name);
      return i < 0 ? 99 : i;
    };
    return [...map.entries()]
      .map(([name, routes]) => ({ name, routes }))
      .sort((a, b) => order(a.name) - order(b.name) || b.routes.length - a.routes.length);
  })();

  constructor() {
    inject(SeoService).set({
      title: 'Taxi Routes and Fares in Chhattisgarh | KiteCab',
      description: `Fixed one way taxi fares for ${SEO_ROUTES.length} routes in Chhattisgarh and to Nagpur — Raipur, Bilaspur, Durg, Bhilai, Korba, Raigarh, Jagdalpur and more. Hatchback, Sedan, SUV.`,
      path: '/taxi-routes',
      jsonLd: graph(localBusiness(), breadcrumbs(this.crumbs)),
    });
  }
}
