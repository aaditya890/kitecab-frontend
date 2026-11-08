/** Site menus. Add a page here and it appears in the header/footer. */
import type { IconName } from '../../shared/components/icon/icon.component';

export interface NavLink {
  label: string;
  path: string;
  /** Mobile menu only. */
  icon?: IconName;
  hint?: string;
}

/** Header menu. */
export const MAIN_NAV: readonly NavLink[] = [
  { label: 'One way', path: '/one-way-taxi', icon: 'arrowRight', hint: 'City to city, no return fare' },
  { label: 'Round trip', path: '/round-trip-cab', icon: 'repeat', hint: 'Car waits, brings you back' },
  { label: 'Local rental', path: '/local-taxi-rental', icon: 'clock', hint: 'Cab with driver by the hour' },
  { label: 'Airport taxi', path: '/raipur-airport-taxi', icon: 'plane', hint: 'Raipur Airport transfers' },
  { label: 'Routes', path: '/taxi-routes', icon: 'route', hint: 'Fares for every route' },
  { label: 'Contact', path: '/contact-us', icon: 'headset', hint: 'Call, WhatsApp or email us' },
];

export const COMPANY_NAV: readonly NavLink[] = [
  { label: 'About us', path: '/about-us' },
  { label: 'Contact us', path: '/contact-us' },
  { label: 'All taxi routes', path: '/taxi-routes' },
];

export const POLICY_NAV: readonly NavLink[] = [
  { label: 'Privacy policy', path: '/privacy-policies' },
  { label: 'Terms and conditions', path: '/terms-and-conditions' },
  { label: 'Cancellation and refund policy', path: '/refund-policy' },
];
