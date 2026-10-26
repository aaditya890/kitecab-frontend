import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../../core/services/seo.service';
import { PolicyPageComponent } from './policy-page.component';

@Component({
  selector: 'kc-terms-and-conditions',
  imports: [PolicyPageComponent, RouterLink],
  template: `
    <kc-policy-page heading="Terms and conditions" updated="26 October 2026">
      <p>
        These terms apply when you book a cab with KiteCab Taxi Service through kitecab.com, by phone or on WhatsApp.
        By booking, you agree to them.
      </p>

      <h2>Our service</h2>
      <p>
        KiteCab provides one way trips, round trips, airport transfers and local rental cabs across Chhattisgarh —
        including Raipur, Bilaspur, Durg, Bhilai, Raigarh, Korba, Ambikapur and Jagdalpur — and to Nagpur. Trips are
        driven by verified drivers in Hatchback, Sedan and SUV cars.
      </p>

      <h2>Booking and confirmation</h2>
      <ul>
        <li>All bookings depend on car and driver availability.</li>
        <li>A booking is confirmed once the advance payment is received. We may still contact you to confirm details.</li>
        <li>Please give correct pickup and drop details, mobile number and pickup time. Wrong details can delay or cancel the trip.</li>
      </ul>

      <h2>Fares and payment</h2>
      <ul>
        <li>The fare shown when you book depends on the route or package, trip type and car type you choose.</li>
        <li>You pay an advance online to confirm the booking and the balance to the driver at the end of the trip.</li>
        <li>
          Changes you make to the route, time, stops, kilometres or hours can change the fare. Any change is confirmed
          with you before the trip.
        </li>
      </ul>

      <h2>Cancellations and refunds</h2>
      <p>
        Cancellations and refunds follow our
        <a routerLink="/refund-policy">cancellation and refund policy</a>.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Be ready at the pickup point at the booked time.</li>
        <li>Do not carry more passengers or luggage than the car can safely take.</li>
        <li>Treat the driver and the car with respect. Smoking, alcohol and illegal items are not allowed in the car.</li>
        <li>Any damage to the car caused by passengers may be charged.</li>
      </ul>

      <h2>Not allowed</h2>
      <ul>
        <li>Using KiteCab for any illegal purpose.</li>
        <li>Giving false details or making fake bookings.</li>
        <li>Harassing or threatening drivers or staff.</li>
        <li>Trying to access other customers' or drivers' data.</li>
      </ul>

      <h2>Delays and liability</h2>
      <p>
        We try to be on time on every trip, but we are not responsible for delays caused by traffic, weather, road
        closures, breakdowns or other events outside our control. Our liability for any booking is limited to the fare
        paid for that booking.
      </p>

      <h2>Brand and content</h2>
      <p>The KiteCab name, logo and website content belong to us and may not be copied without written permission.</p>

      <h2>Changes and law</h2>
      <p>
        We may update these terms; the date at the top shows the latest version. These terms are governed by Indian law,
        and courts in Raipur, Chhattisgarh have jurisdiction.
      </p>
    </kc-policy-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsAndConditionsComponent {
  constructor() {
    inject(SeoService).set({
      title: 'Terms and Conditions – KiteCab Taxi Booking',
      description:
        'Terms for booking a KiteCab taxi in Raipur, Bilaspur and across Chhattisgarh: bookings, fares, advance payment and cancellations.',
      path: '/terms-and-conditions',
    });
  }
}
