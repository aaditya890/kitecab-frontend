import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  leads_due?: number;
  leads_new?: number;
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

const ICON = {
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  steering:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 10.5l5.6 1M14.9 11.5l5.6-1M12 15v6',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zm14 7h.01',
  car: 'M5 17h14M6 17l1.5-5.5A2 2 0 0 1 9.4 10h5.2a2 2 0 0 1 1.9 1.5L18 17M5 17v3h3v-3m8 0v3h3v-3',
  rupee: 'M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10',
};

/** Bar color: brand teal step that passes the chart palette checks on white. */
const BAR = '#0b8aa2';
const CHART_H = 160;

@Component({
  selector: 'kc-admin-dashboard',
  imports: [RouterLink, BadgeComponent],
  template: `
    <!-- welcome banner -->
    <section
      class="relative overflow-hidden rounded-3xl bg-kc-night px-6 py-6 text-white sm:px-8 sm:py-7"
      style="background-image: radial-gradient(600px circle at 100% 0%, rgb(7 88 105 / 0.75), transparent 60%), radial-gradient(400px circle at 0% 120%, rgb(252 185 36 / 0.16), transparent 60%)"
    >
      <div class="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p class="text-sm text-white/60">{{ todayLabel }}</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{{ greeting() }}, {{ firstName() }}</h1>
          <p class="mt-1.5 text-sm text-white/70">
            @if (today(); as t) {
              {{ t.bookings_today }} new booking{{ t.bookings_today === 1 ? '' : 's' }} and
              {{ t.pickups_today }} pickup{{ t.pickups_today === 1 ? '' : 's' }}
              today.
            } @else {
              Loading today’s numbers…
            }
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <a
            routerLink="/admin/bookings/new"
            class="inline-flex h-11 items-center gap-2 rounded-xl bg-kc-yellow px-4 text-sm font-semibold text-kc-night shadow-[0_8px_20px_-10px_rgba(252,185,36,0.9)] transition hover:-translate-y-px hover:bg-kc-yellow-dark"
          >
            <svg
              viewBox="0 0 24 24"
              class="size-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New booking
          </a>
          <a
            routerLink="/admin/enquiries"
            class="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
          >
            Leads
            @if (today()?.leads_due) {
              <span class="rounded-full bg-red-500 px-1.5 text-xs">{{ today()!.leads_due }}</span>
            }
          </a>
          <button
            type="button"
            class="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-3.5 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-60"
            (click)="load()"
            [disabled]="loading()"
            aria-label="Refresh"
          >
            <svg
              viewBox="0 0 24 24"
              class="size-4"
              [class.animate-spin]="loading()"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </div>
    </section>

    @if (error()) {
      <p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{{ error() }}</p>
    }

    <!-- needs attention -->
    <section class="mt-6" aria-labelledby="attn-h">
      <h2 id="attn-h" class="text-sm font-semibold tracking-wide text-kc-muted uppercase">Needs attention</h2>
      @if (attention().length) {
        <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          @for (a of attention(); track a.label) {
            <a [routerLink]="a.link" [queryParams]="a.query" class="kc-adm-card group flex items-center gap-4 p-4">
              <span class="grid size-11 shrink-0 place-items-center rounded-xl" [class]="a.tone">
                <svg
                  viewBox="0 0 24 24"
                  class="size-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path [attr.d]="a.icon" />
                </svg>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-2xl leading-none font-semibold">{{ a.n }}</span>
                <span class="mt-1 block text-sm text-kc-muted">{{ a.label }}</span>
              </span>
              <svg
                viewBox="0 0 24 24"
                class="size-4 text-kc-muted/50 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </a>
          }
        </div>
      } @else if (today()) {
        <div class="kc-adm-card mt-3 flex items-center gap-3 p-4 text-sm">
          <span class="grid size-9 place-items-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true"
            >✓</span
          >
          <span><b>All clear.</b> No calls due, every trip has a driver and no payment links are waiting.</span>
        </div>
      }
    </section>

    <!-- business -->
    <section class="mt-8" aria-labelledby="biz-h">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="biz-h" class="text-sm font-semibold tracking-wide text-kc-muted uppercase">
          Business · {{ rangeLabel() }}
        </h2>
        <div
          class="flex rounded-xl border border-kc-line bg-white p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          role="group"
          aria-label="Period"
        >
          @for (d of ranges; track d) {
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              [class]="days() === d ? 'bg-kc-ink text-white' : 'text-kc-muted hover:text-kc-ink'"
              (click)="setDays(d)"
            >
              {{ d === 365 ? '1 year' : d + ' days' }}
            </button>
          }
        </div>
      </div>

      @if (stats(); as s) {
        <div class="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
          @for (k of kpis(); track k.label) {
            <div class="kc-adm-card p-4 sm:p-5">
              <div class="flex items-center justify-between">
                <span class="text-sm text-kc-muted">{{ k.label }}</span>
                <span
                  class="grid size-8 place-items-center rounded-lg bg-kc-teal/[0.08] text-kc-teal"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    class="size-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path [attr.d]="k.icon" />
                  </svg>
                </span>
              </div>
              <p class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{{ k.value }}</p>
              @if (k.chip) {
                <span
                  class="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  [class]="k.chip.cls"
                  >{{ k.chip.text }}</span
                >
              } @else {
                <span class="mt-2 block text-xs text-kc-muted">{{ k.note }}</span>
              }
            </div>
          }
        </div>

        <div class="mt-3 grid gap-3 xl:grid-cols-[1fr_320px]">
          <!-- bookings per day -->
          <div class="kc-adm-card p-5">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h3 class="font-semibold">Bookings per day</h3>
              <p class="text-sm text-kc-muted">{{ totals().bookings }} total · best day {{ best()?.bookings ?? 0 }}</p>
            </div>
            <div class="relative mt-5" (mouseleave)="hover.set(-1)">
              <svg
                [attr.viewBox]="'0 0 ' + chart().w + ' ' + (chartH + 22)"
                class="block h-52 w-full"
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
                    [attr.opacity]="hover() === -1 || hover() === i ? 1 : 0.4"
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
              <div class="pointer-events-none absolute top-0 left-0 text-[11px] text-kc-muted">{{ chart().max }}</div>
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
          </div>

          <!-- conversion + trip mix -->
          <div class="kc-adm-card p-5">
            <h3 class="font-semibold">Price checks → bookings</h3>
            <div class="mt-4 flex items-center gap-4">
              <svg viewBox="0 0 36 36" class="size-20 shrink-0 -rotate-90" aria-hidden="true">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#eef0ee" stroke-width="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  [attr.stroke]="bar"
                  stroke-width="4"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="conversionPct() * 0.974 + ' 100'"
                />
              </svg>
              <div>
                <p class="text-3xl font-semibold tracking-tight">{{ conversion() }}</p>
                <p class="text-xs text-kc-muted">
                  {{ totals().bookings }} bookings from {{ totals().enquiries }} price checks
                </p>
              </div>
            </div>
            <h3 class="mt-6 font-semibold">Trip types</h3>
            <ul class="mt-3 space-y-3">
              @for (r of typeRows(); track r.key) {
                <li>
                  <div class="flex justify-between text-sm">
                    <span>{{ r.label }}</span
                    ><span class="text-kc-muted">{{ r.n }} · {{ r.pct }}%</span>
                  </div>
                  <div class="mt-1 h-2 rounded-full bg-kc-surface">
                    <div
                      class="h-2 rounded-full transition-[width] duration-500"
                      [style.width.%]="r.pct"
                      [style.background]="bar"
                    ></div>
                  </div>
                </li>
              }
            </ul>
            @if (statusRows().length) {
              <div class="mt-5 flex flex-wrap gap-2">
                @for (st of statusRows(); track st.key) {
                  <span class="flex items-center gap-1.5 text-sm"><kc-badge [value]="st.key" /> {{ st.n }}</span>
                }
              </div>
            }
          </div>
        </div>

        <!-- top routes -->
        <div class="kc-adm-card mt-3 overflow-hidden">
          <h3 class="border-b border-kc-line px-5 py-3.5 font-semibold">Top routes</h3>
          <div class="overflow-x-auto">
            <table class="kc-adm-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th class="text-right">Bookings</th>
                  <th class="text-right">Fare booked</th>
                </tr>
              </thead>
              <tbody>
                @for (r of s.top_routes; track r.pickup + r.drop) {
                  <tr>
                    <td class="font-medium">{{ r.pickup }} → {{ r.drop }}</td>
                    <td class="text-right">{{ r.bookings }}</td>
                    <td class="text-right">{{ rs(r.fare) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="py-8 text-center text-kc-muted">No bookings in this period yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </section>

    <!-- upcoming -->
    <section class="kc-adm-card mt-8 overflow-hidden" aria-labelledby="up-h">
      <div class="flex items-center justify-between border-b border-kc-line px-5 py-3.5">
        <h2 id="up-h" class="font-semibold">Pickups today and tomorrow</h2>
        <a routerLink="/admin/bookings" class="text-sm font-medium text-kc-teal hover:underline">All bookings →</a>
      </div>
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
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
                <td class="whitespace-nowrap">
                  <a class="font-semibold text-kc-teal hover:underline" [routerLink]="['/admin/bookings', b.id]"
                    >#{{ b.id }}</a
                  >
                  <span class="block text-sm">{{ day(b.pickup_date) }} · {{ b.pickup_time }}</span>
                </td>
                <td>
                  {{ b.pickup_location }} → {{ b.drop_location || b.rental_package || '-'
                  }}<span class="block text-xs text-kc-muted">{{ typeLabel(b.booking_type) }} · {{ b.car_type }}</span>
                </td>
                <td>
                  {{ b.customer_name
                  }}<a class="block text-xs text-kc-muted hover:underline" [href]="'tel:+91' + b.mobile">{{
                    b.mobile
                  }}</a>
                </td>
                <td>
                  @if (b.driver_name) {
                    {{ b.driver_name }}
                  } @else {
                    <a
                      class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                      [routerLink]="['/admin/bookings', b.id]"
                      >Assign driver</a
                    >
                  }
                </td>
                <td><kc-badge [value]="b.status" /></td>
                <td>
                  @if (b.advance_status) {
                    <kc-badge [value]="b.advance_status" />
                  } @else {
                    <span class="text-xs text-kc-muted">No link</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="py-10 text-center text-kc-muted">
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

  protected readonly firstName = computed(() => this.db.name().split(/[\s@]/)[0] || 'there');
  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  });

  /** Things to act on now; empty means all clear. */
  protected readonly attention = computed(() => {
    const t = this.today();
    const s = this.stats();
    if (!t) return [];
    const items = [
      {
        n: t.leads_due ?? 0,
        label: 'Leads to call now',
        link: '/admin/enquiries',
        query: {},
        tone: 'bg-amber-100 text-amber-800',
        icon: ICON.phone,
      },
      {
        n: t.pickups_no_driver,
        label: 'Today’s trips without a driver',
        link: '/admin/bookings',
        query: { date: this.todayIso, driver: 'none' },
        tone: 'bg-red-100 text-red-700',
        icon: ICON.steering,
      },
      {
        n: Math.max(0, (s?.needs_driver ?? 0) - t.pickups_no_driver),
        label: 'Upcoming trips without a driver',
        link: '/admin/bookings',
        query: { driver: 'none' },
        tone: 'bg-sky-100 text-sky-800',
        icon: ICON.calendar,
      },
      {
        n: s?.advance.pending_n ?? 0,
        label: 'Payment links not paid yet',
        link: '/admin/payments',
        query: { status: 'PENDING' },
        tone: 'bg-violet-100 text-violet-800',
        icon: ICON.wallet,
      },
    ];
    return items.filter((i) => i.n > 0);
  });

  protected readonly kpis = computed(() => {
    const t = this.today();
    const s = this.stats();
    if (!s) return [];
    const chip = (now: number, prev: number) =>
      prev
        ? {
            text: `${now >= prev ? '▲' : '▼'} ${Math.abs(Math.round(((now - prev) / prev) * 100))}% vs last month`,
            cls: now >= prev ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
          }
        : null;
    return [
      {
        label: 'Bookings today',
        value: String(t?.bookings_today ?? 0),
        icon: ICON.car,
        chip: null,
        note: `Yesterday ${t?.bookings_yesterday ?? 0}`,
      },
      {
        label: 'Bookings this month',
        value: String(s.month.bookings),
        icon: ICON.calendar,
        chip: chip(s.month.bookings, s.month.prev_bookings),
        note: 'No data last month',
      },
      {
        label: 'Fare booked this month',
        value: rs(s.month.fare),
        icon: ICON.rupee,
        chip: chip(s.month.fare, s.month.prev_fare),
        note: 'No data last month',
      },
      {
        label: 'Advance received',
        value: rs(s.advance.paid),
        icon: ICON.wallet,
        chip: null,
        note: `${s.advance.paid_n} paid · ${this.rangeLabel()}`,
      },
    ];
  });

  protected readonly conversionPct = computed(() => {
    const t = this.totals();
    return t.enquiries ? Math.min(100, Math.round((t.bookings / t.enquiries) * 100)) : 0;
  });

  protected readonly rangeLabel = computed(() => (this.days() === 365 ? 'last 1 year' : `last ${this.days()} days`));

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
    return t.enquiries ? `${Math.round((t.bookings / t.enquiries) * 100)}%` : '–';
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

  private async loadStats(): Promise<void> {
    const { data, error } = await (await this.db.db()).rpc('admin_stats', { p_days: this.days() });
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
