import { inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Routes } from '@angular/router';

import { adminGuard, adminOnlyGuard } from './admin.guard';

/** Keeps admin pages out of Google and gives the tab a clear name. */
const noindex = () => {
  inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  inject(Title).setTitle('KiteCab Office');
  return true;
};

const page = (load: () => Promise<unknown>) => ({
  loadComponent: load as never,
});

/** /admin/* — rendered in the browser only (RenderMode.Client), never prerendered. */
export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [noindex],
    ...page(() => import('./login.component').then((m) => m.AdminLoginComponent)),
  },
  {
    path: '',
    canActivate: [noindex, adminGuard],
    canActivateChild: [adminGuard],
    ...page(() => import('./admin-layout.component').then((m) => m.AdminLayoutComponent)),
    children: [
      // admin + staff
      {
        path: '',
        ...page(() => import('./pages/dashboard.component').then((m) => m.DashboardComponent)),
      },
      {
        path: 'enquiries',
        ...page(() => import('./pages/enquiries.component').then((m) => m.EnquiriesComponent)),
      },
      {
        path: 'bookings',
        ...page(() => import('./pages/bookings-list.component').then((m) => m.BookingsListComponent)),
      },
      {
        path: 'bookings/new',
        ...page(() => import('./pages/booking-new.component').then((m) => m.BookingNewComponent)),
      },
      {
        path: 'activity',
        ...page(() => import('./pages/activity.component').then((m) => m.ActivityComponent)),
      },
      {
        path: 'bookings/:id',
        ...page(() => import('./pages/booking-detail.component').then((m) => m.BookingDetailComponent)),
      },
      {
        path: 'customers',
        ...page(() => import('./pages/customers.component').then((m) => m.CustomersComponent)),
      },
      {
        path: 'payments',
        ...page(() => import('./pages/payments.component').then((m) => m.PaymentsComponent)),
      },
      // admin only
      {
        path: '',
        canActivateChild: [adminOnlyGuard],
        children: [
          {
            path: 'staff',
            ...page(() => import('./pages/staff.component').then((m) => m.StaffComponent)),
          },
          {
            path: 'drivers',
            ...page(() => import('./pages/drivers.component').then((m) => m.DriversComponent)),
          },
          {
            path: 'routes',
            ...page(() => import('./pages/routes.component').then((m) => m.RoutesComponent)),
          },
          {
            path: 'locations',
            ...page(() => import('./pages/locations.component').then((m) => m.LocationsComponent)),
          },
          {
            path: 'rates',
            ...page(() => import('./pages/rates.component').then((m) => m.RatesComponent)),
          },
          {
            path: 'settings',
            ...page(() => import('./pages/settings.component').then((m) => m.SettingsComponent)),
          },
        ],
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
