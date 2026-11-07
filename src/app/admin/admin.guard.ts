import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AdminDbService } from './core/admin-db.service';

/** Office pages need a logged-in admin or staff member; others go to the login page. */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const db = inject(AdminDbService);
  const router = inject(Router);
  if (db.isStaff() || (await db.check())) return true;
  return router.createUrlTree(['/admin/login'], {
    queryParams: { next: state.url },
  });
};

/** Prices, places, settings and staff: admin only. Staff go back to the dashboard. */
export const adminOnlyGuard: CanActivateFn = async () => {
  const db = inject(AdminDbService);
  if (!db.isStaff()) await db.check();
  return db.isAdmin() || inject(Router).createUrlTree(['/admin']);
};
