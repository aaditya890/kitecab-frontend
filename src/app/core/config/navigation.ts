/** Site menus. Add a page here and it appears in the header/footer. */
export interface NavLink {
  label: string;
  path: string;
}

/** Header menu. */
export const MAIN_NAV: readonly NavLink[] = [
  { label: 'One way', path: '/one-way-taxi' },
  { label: 'Round trip', path: '/round-trip-cab' },
  { label: 'Local rental', path: '/local-taxi-rental' },
  { label: 'Airport taxi', path: '/raipur-airport-taxi' },
  { label: 'Routes', path: '/taxi-routes' },
  { label: 'Contact', path: '/contact-us' },
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
