import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './layout/public-layout.component';

const notFound = () =>
  import('./features/not-found/not-found.component').then(
    (m) => m.NotFoundComponent,
  );
const service = () =>
  import('./features/services/service-page.component').then(
    (m) => m.ServicePageComponent,
  );
const city = () =>
  import('./features/cities/city-page.component').then(
    (m) => m.CityPageComponent,
  );

export const routes: Routes = [
  // Admin panel: own layout, browser-only, its code loads only when /admin is opened.
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },

      // SEO pages
      {
        path: 'taxi-routes',
        loadComponent: () =>
          import('./features/routes/routes-index.component').then(
            (m) => m.RoutesIndexComponent,
          ),
      },
      {
        path: 'taxi/:slug',
        loadComponent: () =>
          import('./features/routes/route-page.component').then(
            (m) => m.RoutePageComponent,
          ),
      },
      { path: 'taxi-service/:city', loadComponent: city },
      {
        path: 'raipur-airport-taxi',
        loadComponent: city,
        data: { city: 'raipur-airport' },
      },
      {
        path: 'one-way-taxi',
        loadComponent: service,
        data: { service: 'one-way' },
      },
      {
        path: 'round-trip-cab',
        loadComponent: service,
        data: { service: 'round-trip' },
      },
      {
        path: 'local-taxi-rental',
        loadComponent: service,
        data: { service: 'local-rental' },
      },

      {
        path: 'about-us',
        loadComponent: () =>
          import('./features/pages/about.component').then(
            (m) => m.AboutComponent,
          ),
      },
      {
        path: 'contact-us',
        loadComponent: () =>
          import('./features/pages/contact.component').then(
            (m) => m.ContactComponent,
          ),
      },

      // Policy URLs are the same as the live site, so existing Google rankings are kept.
      {
        path: 'privacy-policies',
        loadComponent: () =>
          import('./features/policies/privacy-policy.component').then(
            (m) => m.PrivacyPolicyComponent,
          ),
      },
      {
        path: 'terms-and-conditions',
        loadComponent: () =>
          import('./features/policies/terms-and-conditions.component').then(
            (m) => m.TermsAndConditionsComponent,
          ),
      },
      {
        path: 'refund-policy',
        loadComponent: () =>
          import('./features/policies/refund-policy.component').then(
            (m) => m.RefundPolicyComponent,
          ),
      },

      // Prerendered as /404/index.html; CloudFront serves it (with status 404) for unknown URLs.
      { path: '404', loadComponent: notFound },
      { path: '**', loadComponent: notFound },
    ],
  },
];
