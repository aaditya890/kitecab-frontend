import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AdminDbService } from './core/admin-db.service';

/** Admin pages need a logged-in admin; others go to the login page. */
export const adminGuard: CanActivateFn = async (_route, state) => {
  const db = inject(AdminDbService);
  const router = inject(Router);
  if (db.isAdmin() || (await db.check())) return true;
  return router.createUrlTree(['/admin/login'], {
    queryParams: { next: state.url },
  });
};
