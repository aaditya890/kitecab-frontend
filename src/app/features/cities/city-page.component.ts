import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE } from '../../core/config/site.config';
import { breadcrumbs, Crumb, FaqItem, faqPage, graph, localBusiness, taxiService } from '../../core/seo/schema';
import { SeoService } from '../../core/services/seo.service';
import { highestFare, inr, lowestFare, rentalDisplay } from '../../core/utils/fare';
import { cityPath, HUB_BY_SLUG, HUBS } from '../../data/places';
import rentalsJson from '../../data/rentals.json';
import { routesFor, routesFrom } from '../../data/seo-routes';
import { TOWN_BY_SLUG, TOWNS } from '../../data/towns';
import { RentalPackage, SeoRoute } from '../../models/catalog.model';
import { BookingWidgetComponent } from '../booking/booking-widget.component';
import { NotFoundComponent } from '../not-found/not-found.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs.component';
import { CtaBandComponent } from '../../shared/components/cta-band.component';
import { FaqComponent } from '../../shared/components/faq.component';
import { RouteLinksComponent } from '../../shared/components/route-links.component';

const RENTALS = rentalsJson as RentalPackage[];

/** What the page shows, for a hand-written hub or a data-built town. */
interface CityView {
  key: string;
  name: string;
  slug: string;
  heading: string;
  intro: string[];
  landmarks: string[];
  blurb: string | null;
  /** Hand-written hub (has local rental, landmarks). */
  hub: boolean;
}

const list = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : (items[0] ?? '');

/** Intro paragraphs for a town page, built only from our own fares. */
function townIntro(name: string, blurb: string | null, from: SeoRoute[]): string[] {
  const cheapest = from.length ? Math.min(...from.map((r) => lowestFare(r.fares))) : null;
  const top = from.slice(0, 3).map((r) => `${r.toName} (${inr(lowestFare(r.fares))}, ${r.km} km)`);
  const out: string[] = [];
  if (blurb) out.push(blurb);
  out.push(
    `Book a one way or round trip cab from ${name} with KiteCab. We have fixed fares from ${name} to ${from.length} places` +
      (cheapest ? `, starting at ${inr(cheapest)}` : '') +
      ` — Hatchback, Sedan and SUV, and you pay only for the one way drop.`,
  );
  if (top.length) {
    out.push(
      `Popular trips from ${name} are to ${list(top)}. The driver picks you up from your home, office, bus stand or railway station in ${name}.`,
    );
  }
  return out;
}

/** /taxi-service/:city and /raipur-airport-taxi */
@Component({
  selector: 'kc-city-page',
  imports: [
    RouterLink,
    BookingWidgetComponent,
    BreadcrumbsComponent,
    CtaBandComponent,
    FaqComponent,
    RouteLinksComponent,
    NotFoundComponent,
  ],
  template: `
    @if (place(); as p) {
      <section class="bg-gradient-to-b from-white to-kc-surface">
        <div class="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_440px] lg:py-12">
          <div>
            <kc-breadcrumbs [items]="crumbs()" />
            <h1 class="mt-4 text-3xl font-bold text-kc-ink sm:text-4xl">{{ p.heading }}</h1>
            @for (para of p.intro; track $index) {
              <p class="mt-4 text-lg leading-relaxed text-kc-muted">{{ para }}</p>
            }
          </div>
          <kc-booking-widget initialType="oneway" [initialPickup]="p.key" />
        </div>
      </section>

      <div class="mx-auto max-w-6xl space-y-14 px-4 py-12">
        @if (routes().length) {
          <section aria-labelledby="routes-h">
            <h2 id="routes-h" class="text-2xl font-semibold">
              {{ p.hub ? 'Popular ' + p.name + ' taxi routes' : 'Taxi fares from ' + p.name }}
            </h2>
            <p class="mt-2 mb-5 text-kc-muted">One way fares, no return charge. Tap a route for all car prices.</p>
            <kc-route-links [routes]="routes()" />
          </section>
        }

        <section aria-labelledby="services-h">
          <h2 id="services-h" class="text-2xl font-semibold">Cab services {{ where() }}</h2>
          <ul class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <li class="rounded-2xl border border-kc-line bg-white p-5">
              <h3 class="font-semibold"><a routerLink="/one-way-taxi" class="hover:text-kc-teal">One way taxi</a></h3>
              <p class="mt-2 text-sm text-kc-muted">Drop to any city — pay only one way.</p>
            </li>
            <li class="rounded-2xl border border-kc-line bg-white p-5">
              <h3 class="font-semibold">
                <a routerLink="/round-trip-cab" class="hover:text-kc-teal">Round trip cab</a>
              </h3>
              <p class="mt-2 text-sm text-kc-muted">Same car waits and brings you back.</p>
            </li>
            <li class="rounded-2xl border border-kc-line bg-white p-5">
              <h3 class="font-semibold">
                <a routerLink="/local-taxi-rental" class="hover:text-kc-teal">Local rental</a>
              </h3>
              <p class="mt-2 text-sm text-kc-muted">Cab by the hour for city work and shopping.</p>
            </li>
            <li class="rounded-2xl border border-kc-line bg-white p-5">
              <h3 class="font-semibold">
                <a routerLink="/raipur-airport-taxi" class="hover:text-kc-teal">Airport transfer</a>
              </h3>
              <p class="mt-2 text-sm text-kc-muted">Raipur Airport pickup and drop.</p>
            </li>
          </ul>
        </section>

        @if (p.hub && !isAirport()) {
          <section aria-labelledby="rental-h">
            <h2 id="rental-h" class="text-2xl font-semibold">Local rental packages in {{ p.name }}</h2>
            <div class="mt-5 overflow-x-auto rounded-2xl border border-kc-line bg-white">
              <table class="w-full min-w-[480px] text-left">
                <caption class="sr-only">
                  Local cab rental prices in
                  {{
                    p.name
                  }}
                </caption>
                <thead class="bg-kc-surface text-sm text-kc-muted">
                  <tr>
                    <th scope="col" class="px-5 py-3 font-medium">Package</th>
                    <th scope="col" class="px-5 py-3 font-medium">Hatchback</th>
                    <th scope="col" class="px-5 py-3 font-medium">Sedan</th>
                    <th scope="col" class="px-5 py-3 font-medium">SUV</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-kc-line">
                  @for (r of rentals; track r.id) {
                    <tr>
                      <th scope="row" class="px-5 py-4 font-semibold">{{ rentalDisplay(r) }}</th>
                      <td class="px-5 py-4">{{ inr(r.hatchback) }}</td>
                      <td class="px-5 py-4">{{ inr(r.sedan) }}</td>
                      <td class="px-5 py-4">{{ inr(r.suv) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        @if (p.landmarks.length) {
          <section aria-labelledby="places-h" class="kc-prose max-w-3xl">
            <h2 id="places-h">Pickup and drop points {{ where() }}</h2>
            <p>{{ p.blurb }} We pick up and drop at any address, including:</p>
            <ul>
              @for (l of p.landmarks; track l) {
                <li>{{ l }}</li>
              }
            </ul>
          </section>
        }

        <section aria-labelledby="other-h">
          <h2 id="other-h" class="mb-4 text-2xl font-semibold">Other cities we serve</h2>
          <ul class="flex flex-wrap gap-2">
            @for (h of otherHubs(); track h.slug) {
              <li>
                <a
                  [routerLink]="path(h.slug)"
                  class="inline-block rounded-full border border-kc-line bg-white px-4 py-2 text-sm hover:border-kc-teal"
                  >{{ h.hub.heading }}</a
                >
              </li>
            }
            @if (!p.hub) {
              @for (t of nearbyTowns(); track t.slug) {
                <li>
                  <a
                    [routerLink]="path(t.slug)"
                    class="inline-block rounded-full border border-kc-line bg-white px-4 py-2 text-sm hover:border-kc-teal"
                    >Taxi in {{ t.name }}</a
                  >
                </li>
              }
            }
          </ul>
        </section>

        <kc-faq [items]="faqs()" [heading]="p.heading + ' — questions'" />
        <kc-cta-band [heading]="'Book a cab ' + where()" />
      </div>
    } @else {
      <kc-not-found />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CityPageComponent implements OnInit {
  /** Route parameter (or fixed route data for /raipur-airport-taxi). */
  readonly city = input('');

  private readonly seo = inject(SeoService);
  protected readonly rentals = RENTALS;
  protected readonly inr = inr;
  protected readonly rentalDisplay = rentalDisplay;
  protected readonly path = cityPath;

  protected readonly place = computed<CityView | null>(() => {
    const hub = HUB_BY_SLUG.get(this.city());
    if (hub) {
      return {
        key: hub.key,
        name: hub.name,
        slug: hub.slug,
        heading: hub.hub.heading,
        intro: hub.hub.intro,
        landmarks: hub.hub.landmarks,
        blurb: hub.blurb,
        hub: true,
      };
    }
    const town = TOWN_BY_SLUG.get(this.city());
    if (!town) return null;
    return {
      key: town.key,
      name: town.name,
      slug: town.slug,
      heading: `Taxi service in ${town.name}`,
      intro: townIntro(town.name, town.blurb, routesFrom(town.key)),
      landmarks: [],
      blurb: town.blurb,
      hub: false,
    };
  });
  protected readonly isAirport = computed(() => this.city() === 'raipur-airport');
  /** 'in Bilaspur' / 'at Raipur Airport' — reads naturally in headings and FAQs. */
  protected readonly where = computed(() =>
    this.isAirport() ? 'at Raipur Airport' : `in ${this.place()?.name ?? ''}`,
  );
  /** Hubs: the 12 most booked routes in and out. Towns: every route from the town. */
  protected readonly routes = computed(() => {
    const p = this.place();
    if (!p) return [];
    return p.hub ? routesFor(p.key, 12) : routesFrom(p.key).slice(0, 30);
  });
  /** Other towns, for internal links on town pages. */
  protected readonly nearbyTowns = computed(() => TOWNS.filter((t) => t.slug !== this.city()).slice(0, 24));
  protected readonly otherHubs = computed(() => HUBS.filter((h) => h.slug !== this.city()));
  protected readonly crumbs = computed<Crumb[]>(() => {
    const p = this.place()!;
    return [
      { name: 'Home', path: '/' },
      { name: p.heading, path: cityPath(p.slug) },
    ];
  });

  protected readonly faqs = computed<FaqItem[]>(() => {
    const p = this.place()!;
    const routes = this.routes();
    const cheapest = routes.length ? Math.min(...routes.map((r) => lowestFare(r.fares))) : null;
    const top = routes.slice(0, 4).map((r) => `${r.fromName} to ${r.toName} (${inr(lowestFare(r.fares))})`);
    const rental = RENTALS[0];
    const items: FaqItem[] = [];
    if (top.length) {
      items.push({
        q: `What are the most popular taxi routes from ${p.name}?`,
        a: `Our most booked trips are ${top.join(', ')}. All fares are one way, with no return charge.`,
      });
    }
    if (cheapest) {
      items.push({
        q: `How much does a taxi ${this.where()} cost?`,
        a: this.isAirport()
          ? `Airport taxi fares start at ${inr(cheapest)}, depending on the city and car. See the routes above for every fare.`
          : `Outstation one way fares from ${p.name} start at ${inr(cheapest)}.` +
            (p.hub ? ` Local rental cabs start at ${inr(rental.hatchback)} for ${rentalDisplay(rental)}.` : ''),
      });
    }
    if (this.isAirport()) {
      items.push({
        q: 'What if my flight is delayed?',
        a: 'Share your flight number when you book. We plan the pickup around your actual arrival time.',
      });
    } else if (p.hub) {
      items.push(
        {
          q: `Can I hire a cab in ${p.name} by the hour?`,
          a: `Yes. Local rental packages start at ${rentalDisplay(rental)} for ${inr(rental.hatchback)} (Hatchback). Choose Local rental in the booking form.`,
        },
        {
          q: `Do you provide airport pickup and drop from ${p.name}?`,
          a: `Yes. We run cabs between ${p.name} and Swami Vivekananda Airport, Raipur, and plan pickup times around your flight.`,
        },
      );
    } else {
      items.push(
        {
          q: `Do you go to Raipur and Raipur Airport from ${p.name}?`,
          a: `Yes. Book a one way cab from ${p.name} to Raipur city, Raipur Junction or Swami Vivekananda Airport at a fixed fare — see the routes above.`,
        },
        {
          q: `Can I book a round trip from ${p.name}?`,
          a: `Yes. Choose Round trip in the booking form, pick how long the car should wait and the total km — the fare is shown before you book.`,
        },
      );
    }
    items.push(
      {
        q: `Which cars are available ${this.where()}?`,
        a: `Hatchback (4 passengers), Sedan (4 passengers, more luggage space) and SUV (up to 6 passengers). All are AC cars with experienced drivers.`,
      },
      {
        q: `How do I book a taxi ${this.where()}?`,
        a: `Use the booking form on this page: enter pickup, drop and your mobile number to see fares, then confirm with a ${SITE.fares.advancePercent}% advance. You can also call or WhatsApp us.`,
      },
    );
    return items;
  });

  ngOnInit(): void {
    const p = this.place();
    if (!p) return;
    const routes = this.routes();
    const all = routes.flatMap((r) => [lowestFare(r.fares), highestFare(r.fares)]);
    const low = all.length ? Math.min(...all) : RENTALS[0].hatchback;
    const isAirport = p.slug === 'raipur-airport';
    this.seo.set({
      title: isAirport
        ? `Raipur Airport Taxi – Cab from ${inr(low)} | KiteCab`
        : ([
            `Taxi Service in ${p.name} – Cab Booking from ${inr(low)} | KiteCab`,
            `Taxi Service in ${p.name} – Cabs from ${inr(low)} | KiteCab`,
            `${p.name} Taxi Service – Cabs from ${inr(low)}`,
          ].find((t) => t.length <= 62) ?? `${p.name} Taxi – from ${inr(low)}`),
      description: isAirport
        ? `Book a Raipur Airport taxi at a fixed fare. Pickup and drop between Swami Vivekananda Airport and Raipur, Bilaspur, Bhilai, Durg and Korba.`
        : p.hub
          ? `Book a taxi in ${p.name} for one way, round trip, airport and local rental. Cabs from ${inr(low)}, Hatchback, Sedan and SUV. Call or WhatsApp KiteCab.`
          : `${p.name} taxi service: one way cabs to ${routes.length} places from ${inr(low)}. Hatchback, Sedan and SUV, fixed fares, no return charge. Call or WhatsApp KiteCab.`,
      path: cityPath(p.slug),
      jsonLd: graph(
        localBusiness(),
        taxiService({
          name: p.heading,
          path: cityPath(p.slug),
          area: [p.name],
          lowPrice: low,
          highPrice: all.length ? Math.max(...all) : undefined,
        }),
        breadcrumbs(this.crumbs()),
        faqPage(this.faqs()),
      ),
    });
  }
}
