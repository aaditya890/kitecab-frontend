import { inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Routes } from '@angular/router';

import { adminGuard } from './admin.guard';

/** Keeps admin pages out of Google and gives the tab a clear name. */
const noindex = () => {
  inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  inject(Title).setTitle('KiteCab Admin');
  return true;
};

/** /admin/* — rendered in the browser only (RenderMode.Client), never prerendered. */
export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [noindex],
    loadComponent: () =>
      import('./login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: '',
    canActivate: [noindex, adminGuard],
    canActivateChild: [adminGuard],
    loadComponent: () =>
      import('./admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./pages/bookings-list.component').then(
            (m) => m.BookingsListComponent,
          ),
      },
      {
        path: 'bookings/:id',
        loadComponent: () =>
          import('./pages/booking-detail.component').then(
            (m) => m.BookingDetailComponent,
          ),
      },
      {
        path: 'enquiries',
        loadComponent: () =>
          import('./pages/enquiries.component').then(
            (m) => m.EnquiriesComponent,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./pages/payments.component').then((m) => m.PaymentsComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./pages/customers.component').then(
            (m) => m.CustomersComponent,
          ),
      },
      {
        path: 'drivers',
        loadComponent: () =>
          import('./pages/drivers.component').then((m) => m.DriversComponent),
      },
      {
        path: 'routes',
        loadComponent: () =>
          import('./pages/routes.component').then((m) => m.RoutesComponent),
      },
      {
        path: 'locations',
        loadComponent: () =>
          import('./pages/locations.component').then(
            (m) => m.LocationsComponent,
          ),
      },
      {
        path: 'rates',
        loadComponent: () =>
          import('./pages/rates.component').then((m) => m.RatesComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings.component').then((m) => m.SettingsComponent),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
