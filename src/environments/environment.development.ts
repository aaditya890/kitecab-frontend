import { common } from './environment.common';

/** Local development (`npm start`). Talks to `vercel dev` on port 3000. */
export const environment = {
  ...common,
  production: false,
  indexable: false,
  siteUrl: 'http://localhost:4200',
  apiUrl: 'http://localhost:3000/api',
};
