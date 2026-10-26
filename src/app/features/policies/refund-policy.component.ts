import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SeoService } from '../../core/services/seo.service';
import { PolicyPageComponent } from './policy-page.component';

@Component({
  selector: 'kc-refund-policy',
  imports: [PolicyPageComponent],
  template: `
    <kc-policy-page heading="Cancellation and refund policy" updated="26 October 2026">
      <p>
        This policy explains how cancellations and refunds work for cabs booked with KiteCab on kitecab.com, by
        phone or on WhatsApp, for one way trips, round trips, airport transfers and local rentals in Chhattisgarh and
        Nagpur.
      </p>

      <h2>How payment works</h2>
      <ul>
        <li>Your fare is shown before you book, for the trip type and car you choose.</li>
        <li>
          To confirm a booking you pay a small advance online through a secure Razorpay payment link (sent on WhatsApp
          and shown after booking). The advance is part of the fare, not an extra charge.
        </li>
        <li>The rest of the fare is paid to the driver at the end of the trip, in cash or by UPI.</li>
      </ul>

      <h2>If you cancel</h2>
      <ul>
        <li>
          <strong>Before the driver is assigned and dispatched:</strong> you can cancel free of charge. The full advance
          is refunded.
        </li>
        <li>
          <strong>After the driver has been dispatched, or if you are not at the pickup point:</strong> the advance is
          not refunded, because the car and driver were already sent for you.
        </li>
        <li>To cancel, call or WhatsApp us with your booking ID as early as possible.</li>
      </ul>

      <h2>If we cancel</h2>
      <p>
        If we can't provide a car for your booking — for example because of a breakdown, bad weather or a road closure —
        we will tell you as soon as possible and refund your full advance. Where we can, we will offer you another car
        first.
      </p>

      <h2>Refund timeline</h2>
      <ul>
        <li>We process approved refunds within 2 working days.</li>
        <li>
          The money goes back to the same account, card or UPI ID you paid from. Banks usually take 5 to 7 working days
          to show it.
        </li>
        <li>If you have not received a refund after 10 working days, contact us with your booking ID.</li>
      </ul>

      <h2>Changes to your trip</h2>
      <p>
        If you change the pickup time, route, car type or number of days, the fare may change. We will confirm the new
        fare with you before the trip. Extra kilometres or hours beyond your booked trip or package are charged at the
        rates told to you at the time of booking.
      </p>
    </kc-policy-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefundPolicyComponent {
  constructor() {
    inject(SeoService).set({
      title: 'Cancellation and Refund Policy | KiteCab Taxi',
      description:
        'KiteCab taxi cancellation and refund rules for Chhattisgarh trips: free cancellation before the driver is dispatched, refunds in 5–7 working days.',
      path: '/refund-policy',
    });
  }
}
