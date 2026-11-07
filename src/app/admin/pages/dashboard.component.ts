import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminDbService } from '../core/admin-db.service';
import { day, rs, todayIst, typeLabel } from '../core/format';
import { BadgeComponent } from '../ui/badge.component';

interface Stats {
  bookings_today: number;
  bookings_yesterday: number;
  pickups_today: number;
  pickups_no_driver: number;
  advance_week: number;
  enquiries_today: number;
}

interface Pickup {
  id: number;
  booking_type: string;
  car_type: string;
  pickup_location: string;
  drop_location: string | null;
  rental_package: string | null;
  pickup_date: string;
  pickup_time: string;
  customer_name: string;
  mobile: string;
  driver_name: string | null;
  status: string;
  advance_status: string | null;
}

@Component({
  selector: 'kc-admin-dashboard',
  imports: [RouterLink, BadgeComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="kc-adm-h1">Dashboard</h1>
      <button type="button" class="kc-adm-btn" (click)="load()">Refresh</button>
    </div>

    @if (error()) {
      <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        {{ error() }}
      </p>
    }

    @if (stats(); as s) {
      <div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        @for (c of cards(s); track c.label) {
          <a
            [routerLink]="c.link"
            [queryParams]="c.query"
            class="kc-adm-card block p-4 hover:border-kc-teal"
            [class.border-red-300]="c.alert"
          >
            <p class="text-xs font-medium text-kc-muted">{{ c.label }}</p>
            <p
              class="mt-1 text-2xl font-semibold"
              [class.text-red-700]="c.alert"
            >
              {{ c.value }}
            </p>
            @if (c.note) {
              <p class="mt-1 text-xs text-kc-muted">{{ c.note }}</p>
            }
          </a>
        }
      </div>
    }

    <section class="kc-adm-card mt-6 overflow-hidden">
      <h2 class="border-b border-kc-line px-4 py-3 font-semibold">
        Upcoming pickups (today and tomorrow)
      </h2>
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pickup</th>
              <th>Trip</th>
              <th>Customer</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Advance</th>
            </tr>
          </thead>
          <tbody>
            @for (b of upcoming(); track b.id) {
              <tr>
                <td>
                  <a
                    class="font-medium text-kc-teal hover:underline"
                    [routerLink]="['/admin/bookings', b.id]"
                    >#{{ b.id }}</a
                  >
                </td>
                <td class="whitespace-nowrap">
                  {{ day(b.pickup_date) }}<br /><span class="text-kc-muted">{{
                    b.pickup_time
                  }}</span>
                </td>
                <td>
                  {{ b.pickup_location }} →
                  {{ b.drop_location || b.rental_package || '-' }}<br /><span
                    class="text-kc-muted"
                    >{{ typeLabel(b.booking_type) }} · {{ b.car_type }}</span
                  >
                </td>
                <td>
                  {{ b.customer_name }}<br /><a
                    class="text-kc-muted hover:underline"
                    [href]="'tel:+91' + b.mobile"
                    >{{ b.mobile }}</a
                  >
                </td>
                <td>
                  @if (b.driver_name) {
                    {{ b.driver_name }}
                  } @else if (b.status !== 'cancelled') {
                    <span class="font-medium text-red-700">Not assigned</span>
                  }
                </td>
                <td><kc-badge [value]="b.status" /></td>
                <td><kc-badge [value]="b.advance_status" /></td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="py-6 text-center text-kc-muted">
                  {{ loading() ? 'Loading…' : 'No pickups today or tomorrow.' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly db = inject(AdminDbService);
  protected readonly stats = signal<Stats | null>(null);
  protected readonly upcoming = signal<Pickup[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly day = day;
  protected readonly typeLabel = typeLabel;

  constructor() {
    void this.load();
  }

  protected cards(s: Stats) {
    const today = todayIst();
    return [
      {
        label: 'Bookings today',
        value: s.bookings_today,
        note: `Yesterday: ${s.bookings_yesterday}`,
        link: '/admin/bookings',
        query: {},
      },
      {
        label: 'Pickups today',
        value: s.pickups_today,
        note: '',
        link: '/admin/bookings',
        query: { date: today },
      },
      {
        label: 'Today without driver',
        value: s.pickups_no_driver,
        note: '',
        alert: s.pickups_no_driver > 0,
        link: '/admin/bookings',
        query: { date: today, driver: 'none' },
      },
      {
        label: 'Advance paid (7 days)',
        value: rs(s.advance_week),
        note: '',
        link: '/admin/payments',
        query: { status: 'PAID' },
      },
      {
        label: 'Enquiries today',
        value: s.enquiries_today,
        note: '',
        link: '/admin/enquiries',
        query: {},
      },
    ];
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const db = await this.db.db();
    const [stats, up] = await Promise.all([
      db.rpc('admin_dashboard'),
      db
        .from('admin_bookings')
        .select(
          'id,booking_type,car_type,pickup_location,drop_location,rental_package,pickup_date,pickup_time,customer_name,mobile,driver_name,status,advance_status',
        )
        .gte('pickup_date', todayIst())
        .lte('pickup_date', todayIst(1))
        .neq('status', 'cancelled')
        .order('pickup_date')
        .order('pickup_time')
        .limit(50),
    ]);
    this.loading.set(false);
    if (stats.error || up.error) {
      this.error.set((stats.error ?? up.error)!.message);
      return;
    }
    this.stats.set(stats.data as Stats);
    this.upcoming.set((up.data ?? []) as Pickup[]);
  }
}
