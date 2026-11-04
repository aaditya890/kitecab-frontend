import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { breadcrumbs, graph, localBusiness } from '../../core/seo/schema';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs.component';
import { CtaBandComponent } from '../../shared/components/cta-band.component';

@Component({
  selector: 'kc-about',
  imports: [RouterLink, BreadcrumbsComponent, CtaBandComponent],
  template: `
    <div class="mx-auto max-w-3xl px-4 py-10">
      <kc-breadcrumbs [items]="crumbs" />
      <h1 class="mt-4 text-3xl font-bold sm:text-4xl">About KiteCab</h1>
      <div class="kc-prose mt-6">
        <p>
          KiteCab is a taxi service from Raipur, built for travel across Chhattisgarh. We started with a simple idea:
          booking an outstation cab should be as easy as checking the fare, choosing a car and getting in — with the price
          shown up front and a real person on the phone if you need help.
        </p>
        <h2>What we do</h2>
        <ul>
          <li><a routerLink="/one-way-taxi">One way taxis</a> between cities — you pay only for your drop.</li>
          <li><a routerLink="/round-trip-cab">Round trip cabs</a> that wait for you and bring you back.</li>
          <li><a routerLink="/raipur-airport-taxi">Raipur Airport transfers</a> to and from every major city.</li>
          <li><a routerLink="/local-taxi-rental">Local rentals</a> by the hour in Raipur and other cities.</li>
        </ul>
        <h2>Where we drive</h2>
        <p>
          Every district of Chhattisgarh — from Raipur, Durg and Bhilai to Bilaspur, Korba and Raigarh in the north-east,
          Ambikapur and Surguja in the north, and Kanker, Kondagaon and Jagdalpur in Bastar — plus Nagpur in Maharashtra.
          See all our <a routerLink="/taxi-routes">taxi routes and fares</a>.
        </p>
        <h2>How we work</h2>
        <ul>
          <li>Fares for Hatchback, Sedan and SUV are shown before you book.</li>
          <li>A small advance confirms your cab; you pay the rest to the driver.</li>
          <li>Drivers are experienced on Chhattisgarh highways and city roads.</li>
          <li>Booking details and updates come on WhatsApp, and you can call us any time.</li>
        </ul>
      </div>
      <div class="mt-10"><kc-cta-band heading="Plan your next trip" /></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  protected readonly crumbs = [
    { name: 'Home', path: '/' },
    { name: 'About us', path: '/about-us' },
  ];

  constructor() {
    inject(SeoService).set({
      title: 'About KiteCab – Raipur Taxi Service for Chhattisgarh',
      description: 'KiteCab is a Raipur-based taxi service for one way, round trip, airport and local rental cabs across Chhattisgarh and to Nagpur.',
      path: '/about-us',
      jsonLd: graph(localBusiness(), breadcrumbs(this.crumbs)),
    });
  }
}
