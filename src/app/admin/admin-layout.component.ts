import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { LogoComponent } from '../shared/components/logo/logo.component';
import { AdminDbService } from './core/admin-db.service';
import { ToastService } from './core/toast.service';

interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
  admin?: boolean;
  section?: string;
}

const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/admin', exact: true, section: 'Daily work' },
  { label: 'Enquiries / leads', path: '/admin/enquiries' },
  { label: 'Bookings', path: '/admin/bookings', exact: true },
  { label: '+ New booking', path: '/admin/bookings/new', exact: true },
  { label: 'Customers', path: '/admin/customers' },
  { label: 'Payments', path: '/admin/payments' },
  { label: 'Activity log', path: '/admin/activity' },
  {
    label: 'Staff & performance',
    path: '/admin/staff',
    admin: true,
    section: 'Manage',
  },
  { label: 'Drivers & cars', path: '/admin/drivers', admin: true },
  { label: 'Routes & fares', path: '/admin/routes', admin: true },
  { label: 'Locations', path: '/admin/locations', admin: true },
  { label: 'Rental & round trip', path: '/admin/rates', admin: true },
  { label: 'Settings', path: '/admin/settings', admin: true },
];

@Component({
  selector: 'kc-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <div class="min-h-dvh bg-kc-surface text-kc-ink lg:flex">
      <header
        class="flex items-center justify-between border-b border-kc-line bg-white px-4 py-3 lg:hidden"
      >
        <kc-logo />
        <button
          type="button"
          class="kc-adm-btn"
          (click)="open.set(!open())"
          [attr.aria-expanded]="open()"
        >
          Menu
        </button>
      </header>

      <aside
        class="border-r border-kc-line bg-white lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-60 lg:shrink-0"
        [class.hidden]="!open()"
      >
        <div class="hidden px-5 py-5 lg:block"><kc-logo /></div>
        <nav class="flex flex-col gap-0.5 px-3 py-2" aria-label="Admin">
          @for (n of nav(); track n.path) {
            @if (n.section) {
              <p
                class="mt-3 px-3 pb-1 text-[11px] font-semibold tracking-wide text-kc-muted uppercase first:mt-0"
              >
                {{ n.section }}
              </p>
            }
            <a
              [routerLink]="n.path"
              routerLinkActive="bg-kc-teal text-white hover:bg-kc-teal"
              [routerLinkActiveOptions]="{ exact: !!n.exact }"
              class="rounded-lg px-3 py-2 text-sm font-medium hover:bg-kc-surface"
              (click)="open.set(false)"
              >{{ n.label }}</a
            >
          }
        </nav>
        <div class="border-t border-kc-line px-5 py-4 text-xs text-kc-muted">
          <p class="truncate font-medium text-kc-ink">{{ db.name() }}</p>
          <p class="truncate">
            @if (db.name() !== db.email()) {
              {{ db.email() }} ·
            }
            <span class="capitalize">{{ db.role() }}</span>
          </p>
          <button
            type="button"
            class="mt-2 font-medium text-kc-teal hover:underline"
            (click)="logout()"
          >
            Log out
          </button>
        </div>
      </aside>

      <main class="min-w-0 flex-1 px-4 py-6 lg:px-8"><router-outlet /></main>
    </div>

    <div
      class="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
    >
      @for (t of toast.items(); track t.id) {
        <div
          class="rounded-lg px-4 py-2 text-sm text-white shadow-lg"
          [class]="t.kind === 'ok' ? 'bg-emerald-700' : 'bg-red-700'"
        >
          {{ t.text }}
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  protected readonly db = inject(AdminDbService);
  protected readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly nav = computed(() =>
    NAV.filter((n) => !n.admin || this.db.isAdmin()),
  );
  protected readonly open = signal(false);

  protected async logout(): Promise<void> {
    await this.db.logout();
    await this.router.navigateByUrl('/admin/login');
  }
}
