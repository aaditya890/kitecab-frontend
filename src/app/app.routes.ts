import { Routes } from '@angular/router';

import { PublicLayoutComponent } from './layout/public-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      // Policy URLs are the same as the live site, so existing Google rankings are kept.
      {
        path: 'privacy-policies',
        loadComponent: () =>
          import('./features/policies/privacy-policy.component').then((m) => m.PrivacyPolicyComponent),
      },
      {
        path: 'terms-and-conditions',
        loadComponent: () =>
          import('./features/policies/terms-and-conditions.component').then((m) => m.TermsAndConditionsComponent),
      },
      {
        path: 'refund-policy',
        loadComponent: () =>
          import('./features/policies/refund-policy.component').then((m) => m.RefundPolicyComponent),
      },
      // Prerendered as /404/index.html; CloudFront serves it (with status 404) for unknown URLs.
      {
        path: '404',
        loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
      {
        path: '**',
        loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
