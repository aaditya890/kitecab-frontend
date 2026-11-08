import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE } from '../../core/config/site.config';
import { breadcrumbs, Crumb, faqPage, graph, localBusiness, taxiService } from '../../core/seo/schema';
import { SeoService } from '../../core/services/seo.service';
import { highestFare, inr, lowestFare, travelTime } from '../../core/utils/fare';
import { cityPath, PLACE_BY_KEY } from '../../data/places';
import { routeContent } from '../../data/route-content';
import { TOWN_BY_KEY } from '../../data/towns';
import { relatedRoutes, routePath, SEO_ROUTE_BY_SLUG } from '../../data/seo-routes';
import { BookingWidgetComponent } from '../booking/booking-widget.component';
import { NotFoundComponent } from '../not-found/not-found.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs.component';
import { CtaBandComponent } from '../../shared/components/cta-band.component';
import { FaqComponent } from '../../shared/components/faq.component';
import { FareTableComponent } from '../../shared/components/fare-table.component';
import { RouteLinksComponent } from '../../shared/components/route-links.component';

/** /taxi/:slug — one page per popular route, e.g. /taxi/raipur-to-bilaspur. */
@Component({
  selector: 'kc-route-page',
  imports: [
    RouterLink,
    BookingWidgetComponent,
    BreadcrumbsComponent,
    CtaBandComponent,
    FaqComponent,
    FareTableComponent,
    RouteLinksComponent,
    NotFoundComponent,
  ],
  template: `
    @if (route(); as r) {
      @let c = content()!;
      <section class="bg-gradient-to-b from-white to-kc-surface">
        <div class="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_440px] lg:py-12">
          <div>
            <kc-breadcrumbs [items]="crumbs()" />
            <h1 class="mt-4 text-3xl font-bold text-kc-ink sm:text-4xl">{{ c.h1 }}</h1>
            <p class="mt-4 text-lg leading-relaxed text-kc-muted">{{ c.intro }}</p>
            <dl class="mt-6 grid grid-cols-3 gap-3">
              <div class="rounded-xl bg-white p-4 text-center ring-1 ring-kc-line">
                <dt class="text-xs text-kc-muted uppercase">Distance</dt>
                <dd class="mt-1 text-lg font-bold">{{ r.km }} km</dd>
              </div>
              <div class="rounded-xl bg-white p-4 text-center ring-1 ring-kc-line">
                <dt class="text-xs text-kc-muted uppercase">Time</dt>
                <dd class="mt-1 text-lg font-bold">~{{ time() }}</dd>
              </div>
              <div class="rounded-xl bg-white p-4 text-center ring-1 ring-kc-line">
                <dt class="text-xs text-kc-muted uppercase">From</dt>
                <dd class="mt-1 text-lg font-bold text-kc-teal">{{ low() }}</dd>
              </div>
            </dl>
          </div>
          <kc-booking-widget initialType="oneway" [initialPickup]="r.from" [initialDrop]="r.to" />
        </div>
      </section>

      <div class="mx-auto max-w-6xl space-y-14 px-4 py-12">
        <section aria-labelledby="fares-h">
          <h2 id="fares-h" class="text-2xl font-semibold">{{ r.fromName }} to {{ r.toName }} cab fare</h2>
          <p class="mt-2 mb-5 text-kc-muted">One way fare for the full {{ r.km }} km trip, by car type.</p>
          <kc-fare-table [fares]="r.fares" [caption]="r.fromName + ' to ' + r.toName + ' taxi fare'" />
        </section>

        <section aria-labelledby="about-h" class="kc-prose max-w-3xl">
          <h2 id="about-h">About the {{ r.fromName }} to {{ r.toName }} trip</h2>
          @for (p of c.about; track $index) {
            <p>{{ p }}</p>
          }
          <ul>
            <li>Clean AC cars — Hatchback, Sedan or SUV</li>
            <li>Experienced local drivers who know the {{ r.fromName }}–{{ r.toName }} road</li>
            <li>Fare confirmed before you book, {{ advance }}% advance online, rest to the driver</li>
            <li>Free cancellation before the driver is dispatched</li>
          </ul>
          @if (cityLinks().length) {
            <p>
              More trips:
              @for (c of cityLinks(); track c.slug; let last = $last) {
                <a [routerLink]="cityPath(c.slug)">taxi service in {{ c.name }}</a
                >{{ last ? '.' : ' · ' }}
              }
            </p>
          }
        </section>

        <section aria-labelledby="related-h">
          <h2 id="related-h" class="mb-5 text-2xl font-semibold">Related routes</h2>
          <kc-route-links [routes]="related()" />
          <p class="mt-4 text-sm">
            <a routerLink="/taxi-routes" class="font-medium text-kc-teal hover:underline">See all taxi routes →</a>
          </p>
        </section>

        <kc-faq [items]="c.faqs" [heading]="r.fromName + ' to ' + r.toName + ' taxi — questions'" />

        <kc-cta-band [heading]="'Book ' + r.fromName + ' to ' + r.toName + ' taxi'" />
      </div>
    } @else {
      <kc-not-found />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutePageComponent {
  /** Route parameter, bound by withComponentInputBinding. */
  readonly slug = input('');

  private readonly seo = inject(SeoService);
  protected readonly advance = SITE.fares.advancePercent;
  protected readonly cityPath = cityPath;

  protected readonly route = computed(() => SEO_ROUTE_BY_SLUG.get(this.slug()) ?? null);
  protected readonly content = computed(() => (this.route() ? routeContent(this.route()!) : null));
  protected readonly time = computed(() => travelTime(this.route()?.km ?? 0));
  protected readonly low = computed(() => inr(lowestFare(this.route()!.fares)));
  protected readonly related = computed(() => relatedRoutes(this.route()!));
  /** City pages for the pickup and drop (hand-written hub or data-built town page). */
  protected readonly cityLinks = computed(() => {
    const r = this.route()!;
    return [r.from, r.to]
      .map((key) => {
        const p = PLACE_BY_KEY.get(key);
        if (p?.hub) return { name: p.name, slug: p.slug };
        const t = TOWN_BY_KEY.get(key);
        return t ? { name: t.name, slug: t.slug } : null;
      })
      .filter((c): c is { name: string; slug: string } => !!c);
  });

  protected readonly crumbs = computed<Crumb[]>(() => {
    const r = this.route()!;
    return [
      { name: 'Home', path: '/' },
      { name: 'Taxi routes', path: '/taxi-routes' },
      { name: `${r.fromName} to ${r.toName}`, path: routePath(r) },
    ];
  });

  ngOnInit(): void {
    const r = this.route();
    const c = this.content();
    if (!r || !c) return; // NotFoundComponent sets its own (noindex) tags
    this.seo.set({
      title: c.title,
      description: c.description,
      path: routePath(r),
      jsonLd: graph(
        localBusiness(),
        taxiService({
          name: `${r.fromName} to ${r.toName} taxi`,
          path: routePath(r),
          area: [r.fromName, r.toName],
          lowPrice: lowestFare(r.fares),
          highPrice: highestFare(r.fares),
          description: c.intro,
        }),
        breadcrumbs(this.crumbs()),
        faqPage(c.faqs),
      ),
    });
  }
}
