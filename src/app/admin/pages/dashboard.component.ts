import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminDbService } from '../core/admin-db.service';
import { day, rs, todayIst, typeLabel } from '../core/format';
import { BadgeComponent } from '../ui/badge.component';

interface Today {
  bookings_today: number;
  bookings_yesterday: number;
  pickups_today: number;
  pickups_no_driver: number;
  advance_week: number;
  enquiries_today: number;
}

interface Stats {
  daily: { day: string; bookings: number; enquiries: number }[];
  month: {
    bookings: number;
    fare: number;
    prev_bookings: number;
    prev_fare: number;
  };
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  top_routes: {
    pickup: string;
    drop: string;
    bookings: number;
    fare: number;
  }[];
  advance: { paid: number; paid_n: number; pending_n: number };
  needs_driver: number;
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

/** Bar color: brand teal step that passes the chart palette checks on white. */
const BAR = '#0b8aa2';
const CHART_H = 160;

@Component({
  selector: 'kc-admin-dashboard',
  imports: [RouterLink, BadgeComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="kc-adm-h1">Dashboard</h1>
        <p class="text-sm text-kc-muted">{{ todayLabel }}</p>
      </div>
      <div class="flex items-center gap-2">
        <div
          class="flex rounded-lg border border-kc-line bg-white p-0.5"
          role="group"
          aria-label="Period"
        >
          @for (d of ranges; track d) {
            <button
              type="button"
              class="rounded-md px-3 py-1 text-sm font-medium"
              [class]="
                days() === d ? 'bg-kc-teal text-white' : 'hover:bg-kc-surface'
              "
              (click)="setDays(d)"
            >
              {{ d === 365 ? '1 year' : d + ' days' }}
            </button>
          }
        </div>
        <button
          type="button"
          class="kc-adm-btn"
          (click)="load()"
          [disabled]="loading()"
        >
          {{ loading() ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </div>

    @if (error()) {
      <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        {{ error() }}
      </p>
    }

    <!-- today -->
    @if (today(); as t) {
      <div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <a
          routerLink="/admin/bookings"
          class="kc-adm-card block p-4 hover:border-kc-teal"
        >
          <p class="text-xs font-medium text-kc-muted">New bookings today</p>
          <p class="mt-1 text-3xl font-semibold">{{ t.bookings_today }}</p>
          <p class="mt-1 text-xs text-kc-muted">
            Yesterday {{ t.bookings_yesterday }}
          </p>
        </a>
        <a
          routerLink="/admin/bookings"
          [queryParams]="{ date: todayIso }"
          class="kc-adm-card block p-4 hover:border-kc-teal"
        >
          <p class="text-xs font-medium text-kc-muted">Pickups today</p>
          <p class="mt-1 text-3xl font-semibold">{{ t.pickups_today }}</p>
          <p class="mt-1 text-xs text-kc-muted">Not cancelled</p>
        </a>
        <a
          routerLink="/admin/bookings"
          [queryParams]="{ date: todayIso, driver: 'none' }"
          class="kc-adm-card block p-4 hover:border-kc-teal"
          [class.!border-red-300]="t.pickups_no_driver > 0"
          [class.!bg-red-50]="t.pickups_no_driver > 0"
        >
          <p class="text-xs font-medium text-kc-muted">Today without driver</p>
          <p
            class="mt-1 text-3xl font-semibold"
            [class.text-red-700]="t.pickups_no_driver > 0"
          >
            {{ t.pickups_no_driver }}
          </p>
          <p
            class="mt-1 text-xs"
            [class.text-red-700]="t.pickups_no_driver > 0"
            [class.text-kc-muted]="!t.pickups_no_driver"
          >
            {{ t.pickups_no_driver ? '⚠ Assign now' : '✓ All assigned' }}
          </p>
        </a>
        <a
          routerLink="/admin/bookings"
          [queryParams]="{ driver: 'none' }"
          class="kc-adm-card block p-4 hover:border-kc-teal"
          [class.!border-amber-300]="(stats()?.needs_driver ?? 0) > 0"
        >
          <p class="text-xs font-medium text-kc-muted">
            Next 7 days without driver
          </p>
          <p class="mt-1 text-3xl font-semibold">
            {{ stats()?.needs_driver ?? '–' }}
          </p>
          <p class="mt-1 text-xs text-kc-muted">Upcoming trips</p>
        </a>
        <a
          routerLink="/admin/enquiries"
          class="kc-adm-card col-span-2 block p-4 hover:border-kc-teal md:col-span-1"
        >
          <p class="text-xs font-medium text-kc-muted">Price checks today</p>
          <p class="mt-1 text-3xl font-semibold">{{ t.enquiries_today }}</p>
          <p class="mt-1 text-xs text-kc-muted">
            Call the ones who didn't book
          </p>
        </a>
      </div>
    }

    @if (stats(); as s) {
      <!-- business -->
      <div class="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div class="kc-adm-card p-4">
          <p class="text-xs font-medium text-kc-muted">Bookings this month</p>
          <p class="mt-1 text-2xl font-semibold">{{ s.month.bookings }}</p>
          <p
            class="mt-1 text-xs"
            [class]="trendClass(s.month.bookings, s.month.prev_bookings)"
          >
            {{ trend(s.month.bookings, s.month.prev_bookings) }}
          </p>
        </div>
        <div class="kc-adm-card p-4">
          <p class="text-xs font-medium text-kc-muted">
            Fare booked this month
          </p>
          <p class="mt-1 text-2xl font-semibold">{{ rs(s.month.fare) }}</p>
          <p
            class="mt-1 text-xs"
            [class]="trendClass(s.month.fare, s.month.prev_fare)"
          >
            {{ trend(s.month.fare, s.month.prev_fare) }}
          </p>
        </div>
        <a
          routerLink="/admin/payments"
          [queryParams]="{ status: 'PAID' }"
          class="kc-adm-card block p-4 hover:border-kc-teal"
        >
          <p class="text-xs font-medium text-kc-muted">
            Advance received · {{ rangeLabel() }}
          </p>
          <p class="mt-1 text-2xl font-semibold">{{ rs(s.advance.paid) }}</p>
          <p class="mt-1 text-xs text-kc-muted">
            {{ s.advance.paid_n }} paid · {{ s.advance.pending_n }} links unpaid
          </p>
        </a>
        <div class="kc-adm-card p-4">
          <p class="text-xs font-medium text-kc-muted">
            Price checks → bookings · {{ rangeLabel() }}
          </p>
          <p class="mt-1 text-2xl font-semibold">{{ conversion() }}</p>
          <p class="mt-1 text-xs text-kc-muted">
            {{ totals().bookings }} bookings from {{ totals().enquiries }} price
            checks
          </p>
        </div>
      </div>

      <!-- bookings per day -->
      <section class="kc-adm-card mt-5 p-4">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="font-semibold">Bookings per day · {{ rangeLabel() }}</h2>
          <p class="text-sm text-kc-muted">
            Total {{ totals().bookings }} · best day {{ best()?.bookings ?? 0 }}
          </p>
        </div>
        <div class="relative mt-4" (mouseleave)="hover.set(-1)">
          <svg
            [attr.viewBox]="'0 0 ' + chart().w + ' ' + (chartH + 22)"
            class="block h-48 w-full"
            preserveAspectRatio="none"
            role="img"
            [attr.aria-label]="'Bookings per day, ' + rangeLabel()"
          >
            @for (g of chart().grid; track g.y) {
              <line
                x1="0"
                [attr.x2]="chart().w"
                [attr.y1]="g.y"
                [attr.y2]="g.y"
                stroke="#e4e7e5"
                stroke-width="1"
                vector-effect="non-scaling-stroke"
              />
            }
            @for (b of chart().bars; track b.day; let i = $index) {
              <path
                [attr.d]="b.path"
                [attr.fill]="bar"
                [attr.opacity]="hover() === -1 || hover() === i ? 1 : 0.45"
              />
              <rect
                [attr.x]="b.x - b.gap / 2"
                y="0"
                [attr.width]="b.w + b.gap"
                [attr.height]="chartH"
                fill="transparent"
                (mouseenter)="hover.set(i)"
                (click)="hover.set(i)"
              />
            }
          </svg>
          <div
            class="pointer-events-none absolute top-0 left-0 text-[11px] text-kc-muted"
          >
            {{ chart().max }}
          </div>
          <div class="mt-1 flex justify-between text-[11px] text-kc-muted">
            <span>{{ day(s.daily[0]?.day) }}</span
            ><span>{{ day(s.daily.at(-1)?.day) }}</span>
          </div>
          @if (hovered(); as h) {
            <div
              class="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-kc-ink px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg"
              [style.left.%]="h.left"
            >
              <b>{{ day(h.day) }}</b
              ><br />{{ h.bookings }} bookings · {{ h.enquiries }} price checks
            </div>
          }
        </div>
        <details class="mt-3 text-sm">
          <summary class="cursor-pointer text-kc-muted">Show as table</summary>
          <div class="mt-2 max-h-64 overflow-auto">
            <table class="kc-adm-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Bookings</th>
                  <th>Price checks</th>
                </tr>
              </thead>
              <tbody>
                @for (d of s.daily.slice().reverse(); track d.day) {
                  <tr>
                    <td>{{ day(d.day) }}</td>
                    <td>{{ d.bookings }}</td>
                    <td>{{ d.enquiries }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <div class="mt-5 grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <!-- trip types + status -->
        <section class="kc-adm-card p-4">
          <h2 class="font-semibold">Trip types · {{ rangeLabel() }}</h2>
          <ul class="mt-4 space-y-3">
            @for (r of typeRows(); track r.key) {
              <li>
                <div class="flex justify-between text-sm">
                  <span>{{ r.label }}</span
                  ><span class="text-kc-muted">{{ r.n }} · {{ r.pct }}%</span>
                </div>
                <div class="mt-1 h-2 rounded-full bg-kc-surface">
                  <div
                    class="h-2 rounded-full"
                    [style.width.%]="r.pct"
                    [style.background]="bar"
                  ></div>
                </div>
              </li>
            }
          </ul>
          <h3 class="mt-6 text-sm font-semibold">Status</h3>
          <div class="mt-2 flex flex-wrap gap-2">
            @for (st of statusRows(); track st.key) {
              <a
                routerLink="/admin/bookings"
                class="flex items-center gap-1.5 text-sm"
                ><kc-badge [value]="st.key" /> {{ st.n }}</a
              >
            }
          </div>
        </section>

        <!-- top routes -->
        <section class="kc-adm-card overflow-hidden">
          <h2 class="border-b border-kc-line px-4 py-3 font-semibold">
            Top routes · {{ rangeLabel() }}
          </h2>
          <div class="overflow-x-auto">
            <table class="kc-adm-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th class="text-right">Bookings</th>
                  <th class="text-right">Fare</th>
                </tr>
              </thead>
              <tbody>
                @for (r of s.top_routes; track r.pickup + r.drop) {
                  <tr>
                    <td>{{ r.pickup }} → {{ r.drop }}</td>
                    <td class="text-right">{{ r.bookings }}</td>
                    <td class="text-right">{{ rs(r.fare) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="py-6 text-center text-kc-muted">
                      No bookings in this period.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>
    }

    <!-- upcoming -->
    <section class="kc-adm-card mt-5 overflow-hidden">
      <h2 class="border-b border-kc-line px-4 py-3 font-semibold">
        Pickups today and tomorrow
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
                  } @else {
                    <a
                      class="font-medium text-red-700 hover:underline"
                      [routerLink]="['/admin/bookings', b.id]"
                      >Assign driver</a
                    >
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
  protected readonly ranges = [30, 90, 365];
  protected readonly bar = BAR;
  protected readonly chartH = CHART_H;
  protected readonly rs = rs;
  protected readonly day = day;
  protected readonly typeLabel = typeLabel;
  protected readonly todayIso = todayIst();
  protected readonly todayLabel = day(todayIst());

  protected readonly days = signal(30);
  protected readonly today = signal<Today | null>(null);
  protected readonly stats = signal<Stats | null>(null);
  protected readonly upcoming = signal<Pickup[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly hover = signal(-1);

  protected readonly rangeLabel = computed(() =>
    this.days() === 365 ? 'last 1 year' : `last ${this.days()} days`,
  );

  protected readonly totals = computed(() =>
    (this.stats()?.daily ?? []).reduce(
      (t, d) => ({
        bookings: t.bookings + d.bookings,
        enquiries: t.enquiries + d.enquiries,
      }),
      { bookings: 0, enquiries: 0 },
    ),
  );
  protected readonly best = computed(() =>
    (this.stats()?.daily ?? []).reduce<Stats['daily'][number] | null>(
      (b, d) => (!b || d.bookings > b.bookings ? d : b),
      null,
    ),
  );
  protected readonly conversion = computed(() => {
    const t = this.totals();
    return t.enquiries
      ? `${Math.round((t.bookings / t.enquiries) * 100)}%`
      : '–';
  });

  /** Bars with rounded tops anchored to the baseline, 2px gaps; y scale on a nice max. */
  protected readonly chart = computed(() => {
    const daily = this.stats()?.daily ?? [];
    const slot = 10;
    const w = Math.max(daily.length * slot, slot);
    const peak = Math.max(1, ...daily.map((d) => d.bookings));
    const step = peak <= 5 ? 1 : peak <= 20 ? 5 : peak <= 50 ? 10 : 25;
    const max = Math.ceil(peak / step) * step;
    const gap = daily.length > 120 ? 0.6 : 2;
    const bars = daily.map((d, i) => {
      const h = (d.bookings / max) * CHART_H;
      const x = i * slot + gap / 2;
      const bw = slot - gap;
      const r = Math.min(4, bw / 2, h);
      const y = CHART_H - h;
      const path =
        h <= 0
          ? ''
          : `M${x},${CHART_H} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${CHART_H} Z`;
      return { day: d.day, x, w: bw, gap, path };
    });
    const grid = [0, 0.5, 1].map((f) => ({ y: CHART_H - f * CHART_H }));
    return { w, max, bars, grid };
  });

  protected readonly hovered = computed(() => {
    const i = this.hover();
    const d = this.stats()?.daily[i];
    if (!d) return null;
    const n = this.stats()!.daily.length;
    return { ...d, left: Math.min(92, Math.max(8, ((i + 0.5) / n) * 100)) };
  });

  protected readonly typeRows = computed(() => {
    const t = this.stats()?.by_type ?? {};
    const sum = Object.values(t).reduce((a, b) => a + b, 0) || 1;
    return ['oneway', 'round-trip', 'local-rental'].map((key) => ({
      key,
      label: typeLabel(key),
      n: t[key] ?? 0,
      pct: Math.round(((t[key] ?? 0) / sum) * 100),
    }));
  });

  protected readonly statusRows = computed(() => {
    const s = this.stats()?.by_status ?? {};
    return ['new', 'confirmed', 'assigned', 'completed', 'cancelled']
      .filter((k) => s[k])
      .map((key) => ({ key, n: s[key] }));
  });

  constructor() {
    void this.load();
  }

  protected setDays(d: number): void {
    this.days.set(d);
    void this.loadStats();
  }

  protected trend(now: number, prev: number): string {
    if (!prev)
      return now ? 'No data last month to compare' : 'Same days last month: 0';
    const pct = Math.round(((now - prev) / prev) * 100);
    return `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs same days last month`;
  }

  protected trendClass(now: number, prev: number): string {
    if (!prev) return 'text-kc-muted';
    return now >= prev ? 'text-emerald-700' : 'text-red-700';
  }

  private async loadStats(): Promise<void> {
    const { data, error } = await (
      await this.db.db()
    ).rpc('admin_stats', { p_days: this.days() });
    if (error) this.error.set(error.message);
    else this.stats.set(data as Stats);
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const db = await this.db.db();
    const [today, up] = await Promise.all([
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
      this.loadStats(),
    ]);
    this.loading.set(false);
    if (today.error || up.error) {
      this.error.set((today.error ?? up.error)!.message);
      return;
    }
    this.today.set(today.data as Today);
    this.upcoming.set((up.data ?? []) as Pickup[]);
  }
}
