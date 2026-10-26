import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SeoService } from '../../core/services/seo.service';
import { PolicyPageComponent } from './policy-page.component';

@Component({
  selector: 'kc-privacy-policy',
  imports: [PolicyPageComponent],
  template: `
    <kc-policy-page heading="Privacy policy" updated="26 October 2026">
      <p>
        KiteCab ("we", "us") runs a taxi booking service across Chhattisgarh and Nagpur through kitecab.com, phone and
        WhatsApp. This policy explains what personal data we collect, why, and the choices you have. It follows the
        Digital Personal Data Protection Act, 2023.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Booking details:</strong> your name, mobile number, email, pickup address, pickup and drop locations, date, time and number of passengers.</li>
        <li><strong>Enquiries:</strong> the route or package and the mobile number you enter when you check a price.</li>
        <li><strong>Payment status:</strong> whether your advance was paid and its reference number. Card, UPI and bank details are handled by Razorpay; we never see or store them.</li>
        <li><strong>Website usage:</strong> pages visited, device and browser type, collected through Google Analytics and Google Ads cookies.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To quote fares, confirm and manage your booking, and assign a driver.</li>
        <li>To send booking details, payment links and trip updates on WhatsApp.</li>
        <li>To reply to your calls, messages and complaints.</li>
        <li>To improve our website and measure our advertising.</li>
        <li>To meet legal, tax and safety obligations.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We never sell or rent your personal data. We share only what is needed with:</p>
      <ul>
        <li>The driver assigned to your trip (your name, phone number and pickup details).</li>
        <li>Razorpay, to collect your advance payment.</li>
        <li>Our WhatsApp messaging provider, to deliver booking messages.</li>
        <li>Google, for website analytics and advertising measurement.</li>
        <li>Government or police authorities when the law requires it.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        We keep booking and payment records for as long as tax and accounting rules require, and enquiry data for up to
        two years. After that it is deleted or made anonymous.
      </p>

      <h2>How we protect it</h2>
      <p>
        Our website uses HTTPS, our database is access-controlled, and only authorised staff can see booking details.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li>Ask what personal data we hold about you.</li>
        <li>Ask us to correct or update it.</li>
        <li>Ask us to delete it, unless we must keep it by law.</li>
        <li>Withdraw consent for WhatsApp updates at any time by replying STOP or contacting us.</li>
      </ul>
      <p>You can turn off cookies in your browser settings; the website will still work.</p>

      <h2>Changes to this policy</h2>
      <p>If we change this policy, we will update the date at the top of this page.</p>
    </kc-policy-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {
  constructor() {
    inject(SeoService).set({
      title: 'Privacy Policy – KiteCab Taxi Service, Chhattisgarh',
      description:
        'How KiteCab collects, uses and protects your data when you book a taxi in Chhattisgarh, and your rights under the DPDP Act, 2023.',
      path: '/privacy-policies',
    });
  }
}
