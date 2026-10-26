import { common } from './environment.common';

/**
 * Production settings. Only PUBLIC values belong here — this file ships to every browser.
 * Secret keys live in kitecab-backend (Vercel environment variables), never here.
 */
export const environment = {
  ...common,
  production: true,
  /** Search engines may index this build (false for staging/test builds). */
  indexable: true,
  siteUrl: 'https://kitecab.com',
  /** kitecab-backend on Vercel. TODO: set the real URL after the first Vercel deploy. */
  apiUrl: 'https://kitecab-backend.vercel.app/api',
};
