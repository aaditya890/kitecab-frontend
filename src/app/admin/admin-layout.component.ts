import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { LogoComponent } from '../shared/components/logo/logo.component';
import { AdminDbService } from './core/admin-db.service';
import { ToastService } from './core/toast.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  admin?: boolean;
  section?: string;
}

/** 24×24 stroke icons (path data). */
const ICONS: Record<string, string> = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  car: 'M5 16h14M6 16l1.5-5.5A2 2 0 0 1 9.4 9h5.2a2 2 0 0 1 1.9 1.5L18 16M5 16v3h3v-3m8 0v3h3v-3',
  plus: 'M12 5v14M5 12h14',
  users:
    'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm13 9v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zm14 7h.01',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  chart: 'M4 20V10m6 10V4m6 16v-7m6 7H2',
  steering:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 10.5l5.6 1M14.9 11.5l5.6-1M12 15v6',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7',
  pin: 'M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v4l3 2',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
};

const NAV: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: 'home',
    exact: true,
    section: 'Daily work',
  },
  { label: 'Enquiries / leads', path: '/admin/enquiries', icon: 'phone' },
  { label: 'Bookings', path: '/admin/bookings', icon: 'car', exact: true },
  {
    label: 'New booking',
    path: '/admin/bookings/new',
    icon: 'plus',
    exact: true,
  },
  { label: 'Customers', path: '/admin/customers', icon: 'users' },
  { label: 'Payments', path: '/admin/payments', icon: 'wallet' },
  { label: 'Activity log', path: '/admin/activity', icon: 'list' },
  {
    label: 'Staff & performance',
    path: '/admin/staff',
    icon: 'chart',
    admin: true,
    section: 'Manage',
  },
  {
    label: 'Drivers & cars',
    path: '/admin/drivers',
    icon: 'steering',
    admin: true,
  },
  {
    label: 'Routes & fares',
    path: '/admin/routes',
    icon: 'route',
    admin: true,
  },
  { label: 'Locations', path: '/admin/locations', icon: 'pin', admin: true },
  {
    label: 'Rental & round trip',
    path: '/admin/rates',
    icon: 'clock',
    admin: true,
  },
  { label: 'Settings', path: '/admin/settings', icon: 'gear', admin: true },
];

@Component({
  selector: 'kc-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <div class="min-h-dvh bg-[#f4f5f2] text-kc-ink lg:flex">
      <!-- phone top bar -->
      <header
        class="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden"
      >
        <kc-logo [size]="34" />
        <button
          type="button"
          class="kc-adm-btn"
          (click)="open.set(true)"
          [attr.aria-expanded]="open()"
          aria-controls="kc-admin-nav"
        >
          <svg
            viewBox="0 0 24 24"
            class="size-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          Menu
        </button>
      </header>

      <!-- backdrop (phones) -->
      <div
        class="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden"
        [class.opacity-0]="!open()"
        [class.pointer-events-none]="!open()"
        (click)="open.set(false)"
        aria-hidden="true"
      ></div>

      <!-- sidebar -->
      <aside
        id="kc-admin-nav"
        class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-kc-night text-white/70 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:sticky lg:top-0 lg:h-dvh lg:shrink-0 lg:translate-x-0"
        [class.-translate-x-full]="!open()"
      >
        <div class="flex items-center justify-between px-5 pt-5 pb-3">
          <kc-logo tone="onDark" [size]="36" />
          <span
            class="rounded-full bg-kc-yellow/15 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-kc-yellow uppercase"
            >Office</span
          >
        </div>
        <nav class="flex-1 overflow-y-auto px-3 pb-4" aria-label="Admin">
          @for (n of nav(); track n.path) {
            @if (n.section) {
              <p
                class="mt-4 px-3 pb-1.5 text-[10px] font-semibold tracking-[0.14em] text-white/35 uppercase first:mt-1"
              >
                {{ n.section }}
              </p>
            }
            <a
              [routerLink]="n.path"
              routerLinkActive="kc-nav-active"
              [routerLinkActiveOptions]="{ exact: !!n.exact }"
              class="group relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 hover:bg-white/5 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                class="size-[18px] shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path [attr.d]="icons[n.icon]" />
              </svg>
              {{ n.label }}
            </a>
          }
        </nav>
        <div class="m-3 rounded-2xl bg-white/5 p-3">
          <div class="flex items-center gap-3">
            <span
              class="grid size-9 shrink-0 place-items-center rounded-full bg-kc-yellow text-sm font-bold text-kc-night"
              >{{ initials() }}</span
            >
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-white">
                {{ db.name() }}
              </p>
              <p class="truncate text-xs text-white/50 capitalize">
                {{ db.role() }}
              </p>
            </div>
            <button
              type="button"
              class="ml-auto grid size-8 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
              (click)="logout()"
              title="Log out"
              aria-label="Log out"
            >
              <svg
                viewBox="0 0 24 24"
                class="size-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path [attr.d]="icons['logout']" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main class="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div class="mx-auto max-w-[1400px]"><router-outlet /></div>
      </main>
    </div>

    <div class="fixed right-4 bottom-4 z-[60] flex flex-col gap-2" aria-live="polite">
      @for (t of toast.items(); track t.id) {
        <div
          class="kc-toast flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)]"
          [class]="t.kind === 'ok' ? 'bg-kc-ink' : 'bg-red-700'"
        >
          <span
            class="grid size-5 place-items-center rounded-full text-xs"
            [class]="t.kind === 'ok' ? 'bg-emerald-500' : 'bg-white/20'"
            aria-hidden="true"
            >{{ t.kind === 'ok' ? '✓' : '!' }}</span
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
  protected readonly icons = ICONS;
  protected readonly open = signal(false);
  protected readonly nav = computed(() => NAV.filter((n) => !n.admin || this.db.isAdmin()));
  protected readonly initials = computed(
    () =>
      this.db
        .name()
        .split(/[\s@.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join('') || 'K',
  );

  constructor() {
    // close the phone menu after choosing a page
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.open.set(false);
    });
  }

  protected async logout(): Promise<void> {
    await this.db.logout();
    await this.router.navigateByUrl('/admin/login');
  }
}
