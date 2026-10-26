/** Site menus. Add a page here and it appears in the header/footer. */
export interface NavLink {
  label: string;
  path: string;
}

/** Header menu. More entries (airport taxi, routes, cities) arrive with those pages. */
export const MAIN_NAV: readonly NavLink[] = [{ label: 'Home', path: '/' }];

export const POLICY_NAV: readonly NavLink[] = [
  { label: 'Privacy policy', path: '/privacy-policies' },
  { label: 'Terms and conditions', path: '/terms-and-conditions' },
  { label: 'Cancellation and refund policy', path: '/refund-policy' },
];
