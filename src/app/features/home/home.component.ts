import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE } from '../../core/config/site.config';
import { FaqItem, faqPage, graph, localBusiness, website } from '../../core/seo/schema';
import { SeoService } from '../../core/services/seo.service';
import { inr, lowestFare, rentalDisplay } from '../../core/utils/fare';
import { cityPath, HUBS } from '../../data/places';
import { routesFor, SEO_ROUTES } from '../../data/seo-routes';
import { RENTALS } from '../../data/services';
import { BookingWidgetComponent } from '../booking/booking-widget.component';
import { CtaBandComponent } from '../../shared/components/cta-band.component';
import { FaqComponent } from '../../shared/components/faq.component';
import { RouteLinksComponent } from '../../shared/components/route-links.component';

@Component({
  selector: 'kc-home',
  imports: [RouterLink, BookingWidgetComponent, CtaBandComponent, FaqComponent, RouteLinksComponent],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly inr = inr;
  protected readonly cityPath = cityPath;
  protected readonly seats = SITE.fares.seats;
  protected readonly advance = SITE.fares.advancePercent;
  protected readonly popular = SEO_ROUTES.slice(0, 9);
  protected readonly steps = [
    {
      title: 'Enter pickup and drop',
      text: 'Choose one way, round trip or local rental and type your cities. No sign-up needed.',
    },
    {
      title: 'See the fare and pick a car',
      text: 'Fixed fares for Hatchback, Sedan and SUV appear instantly. Pick one and add your pickup time.',
    },
    {
      title: `Pay ${SITE.fares.advancePercent}% and relax`,
      text: 'Pay a small advance by UPI or card to confirm. Driver and car details come on WhatsApp before pickup.',
    },
  ];
  protected readonly trust = [
    'Fixed fare shown before booking',
    'No return fare on one way',
    `Only ${SITE.fares.advancePercent}% advance online`,
    'Call or WhatsApp 24×7',
  ];
  protected readonly firstRental = RENTALS[0];
  protected readonly rentalText = RENTALS[0] ? `${rentalDisplay(RENTALS[0])} from ${inr(RENTALS[0].hatchback)}` : '';
  protected readonly lowest = Math.min(...SEO_ROUTES.map((r) => lowestFare(r.fares)));

  /** City cards with the cheapest route from each city. */
  protected readonly cities = HUBS.map((h) => {
    const routes = routesFor(h.key, 50);
    return {
      ...h,
      from: routes.length ? Math.min(...routes.map((r) => lowestFare(r.fares))) : null,
    };
  });

  protected readonly faqs: FaqItem[] = [
    {
      q: 'Which cities does KiteCab cover?',
      a: 'We cover all of Chhattisgarh — Raipur, Bilaspur, Durg, Bhilai, Raigarh, Korba, Ambikapur, Jagdalpur, Rajnandgaon and every district town — and drive to Nagpur in Maharashtra.',
    },
    {
      q: 'How much does a taxi from Raipur to Bilaspur cost?',
      a: `A one way cab from Raipur to Bilaspur (${this.fare('raipur-to-bilaspur')}). The fare is for the full trip with no return charge.`,
    },
    {
      q: 'What is the difference between one way and round trip?',
      a: 'One way drops you at your destination and you pay only for that trip. Round trip keeps the same car with you — it waits at your destination for the time you choose and brings you back.',
    },
    {
      q: 'Do you provide Raipur Airport pickup and drop?',
      a: `Yes. We run cabs between Swami Vivekananda Airport, Raipur and Raipur city, Bilaspur, Bhilai, Durg, Korba and other cities. Raipur Airport to Bhilai costs ${this.fare('raipur-airport-to-bhilai')}.`,
    },
    {
      q: 'How do I pay for my cab?',
      a: `After you book, you get a Razorpay link to pay a ${this.advance}% advance online. The rest of the fare is paid to the driver at the end of the trip, in cash or by UPI.`,
    },
    {
      q: 'Can I hire a cab by the hour in Raipur?',
      a: `Yes. Local rental packages start at ${this.rentalText} (Hatchback), with Sedan and SUV options.`,
    },
    {
      q: 'Can I cancel my booking?',
      a: 'Yes. If you cancel before the driver is dispatched, your full advance is refunded. See our cancellation and refund policy.',
    },
    {
      q: 'Is KiteCab available at night?',
      a: 'Yes. You can call or WhatsApp us any time, and we run early-morning and late-night trips, including airport transfers.',
    },
  ];

  constructor() {
    inject(SeoService).set({
      title: 'Taxi Service in Chhattisgarh – Raipur, Bilaspur Cabs | KiteCab',
      description: `Book a taxi in Raipur, Bilaspur, Durg, Bhilai and all of Chhattisgarh. One way, round trip, airport and local rental cabs from ${inr(this.lowest)}.`,
      path: '/',
      jsonLd: graph(website(), localBusiness(), faqPage(this.faqs)),
    });
  }

  private fare(slug: string): string {
    const r = SEO_ROUTES.find((x) => x.slug === slug);
    return r
      ? `${inr(r.fares.Hatchback)} for a Hatchback, ${inr(r.fares.Sedan)} for a Sedan and ${inr(r.fares.SUV)} for an SUV`
      : 'see the booking form for the latest fare';
  }
}
