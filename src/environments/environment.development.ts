import { environment as production } from './environment';

/** Local development (`npm start`). Talks to `vercel dev` on port 3000. */
export const environment = {
  ...production,
  production: false,
  indexable: false,
  siteUrl: 'http://localhost:4200',
  apiUrl: 'http://localhost:3000/api',
};
