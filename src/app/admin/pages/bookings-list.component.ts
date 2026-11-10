import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Router, RouterLink } from '@angular/router';

import { AdminDbService } from '../core/admin-db.service';
import { BOOKING_STATUSES, BOOKING_TYPES, day, downloadCsv, rs, stamp, typeLabel } from '../core/format';
import { PagedList, searchTerm, toPage } from '../core/paged-list';
import { BadgeComponent } from '../ui/badge.component';
import { ContactActionsComponent } from '../ui/contact-actions.component';
import { PagerComponent } from '../ui/pager.component';

interface Row {
  id: number;
  booking_type: string;
  car_type: string;
  status: string;
  pickup_location: string;
  drop_location: string | null;
  rental_package: string | null;
  pickup_date: string;
  pickup_time: string;
  fare: number;
  advance_amount: number | null;
  customer_name: string;
  mobile: string;
  driver_name: string | null;
  advance_status: string | null;
  created_at: string;
}

const COLS =
  'id,booking_type,car_type,status,pickup_location,drop_location,rental_package,pickup_date,pickup_time,fare,advance_amount,customer_name,mobile,driver_name,advance_status,created_at';

@Component({
  selector: 'kc-admin-bookings',
  imports: [FormsModule, RouterLink, BadgeComponent, ContactActionsComponent, PagerComponent],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="kc-adm-h1">Bookings</h1>
        <p class="mt-0.5 text-sm text-kc-muted">
          @if (list.total()) {
            {{ list.total().toLocaleString('en-IN') }} {{ list.total() === 1 ? 'booking' : 'bookings' }}
            {{ filtered() ? 'match these filters' : 'in total' }}
          } @else {
            &nbsp;
          }
        </p>
      </div>
      <div class="flex gap-2">
        <button type="button" class="kc-adm-btn h-10" (click)="exportCsv()">
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
            <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          Export CSV
        </button>
        <a routerLink="/admin/bookings/new" class="kc-adm-btn-primary h-10">+ New booking</a>
      </div>
    </div>

    <!-- status chips -->
    <div class="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Status">
      <button
        type="button"
        role="tab"
        class="kc-adm-chip"
        [class.kc-adm-chip-on]="!status"
        [attr.aria-selected]="!status"
        (click)="setStatus('')"
      >
        All
      </button>
      @for (s of statuses; track s) {
        <button
          type="button"
          role="tab"
          class="kc-adm-chip"
          [class.kc-adm-chip-on]="status === s"
          [attr.aria-selected]="status === s"
          (click)="setStatus(s)"
        >
          <span class="size-1.5 rounded-full" [class]="dot[s]"></span>{{ s }}
        </button>
      }
    </div>

    <!-- filters -->
    <div class="kc-adm-card mt-3 flex flex-wrap items-center gap-2 p-2">
      <div class="relative min-w-56 flex-1">
        <svg
          viewBox="0 0 24 24"
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-kc-muted"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          class="h-10 w-full rounded-xl bg-kc-surface pr-3 pl-9 text-sm outline-none placeholder:text-kc-muted focus:bg-white focus:ring-2 focus:ring-kc-teal/20"
          type="search"
          placeholder="Search booking ID, name or mobile"
          [(ngModel)]="q"
          (ngModelChange)="list.debounce()"
          aria-label="Search bookings"
        />
      </div>
      <select
        class="h-10 rounded-xl border-0 bg-kc-surface px-3 text-sm outline-none focus:ring-2 focus:ring-kc-teal/20"
        [(ngModel)]="type"
        (ngModelChange)="list.reset()"
        aria-label="Trip type"
      >
        <option value="">All trips</option>
        @for (t of types; track t.value) {
          <option [value]="t.value">{{ t.label }}</option>
        }
      </select>
      <input
        class="h-10 rounded-xl border-0 bg-kc-surface px-3 text-sm outline-none focus:ring-2 focus:ring-kc-teal/20"
        [class.text-kc-muted]="!date"
        type="date"
        [(ngModel)]="date"
        (ngModelChange)="list.reset()"
        aria-label="Pickup date"
        title="Pickup date"
      />
      <label
        class="flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm transition select-none"
        [class]="noDriver ? 'bg-amber-100 text-amber-900' : 'bg-kc-surface text-kc-muted hover:text-kc-ink'"
      >
        <input
          type="checkbox"
          class="accent-amber-600"
          [ngModel]="noDriver"
          (ngModelChange)="noDriver = $event; list.reset()"
        />
        No driver yet
      </label>
      @if (filtered()) {
        <button
          type="button"
          class="h-10 rounded-xl px-3 text-sm font-medium text-kc-teal hover:bg-kc-teal/5"
          (click)="clear()"
        >
          Clear all
        </button>
      }
    </div>

    @if (list.error()) {
      <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        {{ list.error() }}
      </p>
    }

    <div class="kc-adm-card mt-4 overflow-hidden transition-opacity" [class.opacity-60]="list.loading()">
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Trip</th>
              <th>Customer</th>
              <th>Driver</th>
              <th class="!text-right">Fare</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (b of list.rows(); track b.id) {
              @let tag = pickupTag(b.pickup_date);
              <tr class="cursor-pointer" [class.opacity-60]="b.status === 'cancelled'" (click)="open(b.id)">
                <td class="whitespace-nowrap">
                  <a
                    class="font-semibold text-kc-ink tabular-nums hover:text-kc-teal"
                    [routerLink]="[b.id]"
                    (click)="$event.stopPropagation()"
                    >#{{ b.id }}</a
                  >
                  <span class="mt-0.5 block text-xs text-kc-muted">{{ booked(b.created_at) }}</span>
                </td>
                <td class="min-w-52">
                  <span class="flex items-center gap-1.5 font-medium text-kc-ink">
                    {{ b.pickup_location }}
                    <svg
                      viewBox="0 0 24 24"
                      class="size-3.5 shrink-0 text-kc-muted"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14m-5-5 5 5-5 5" />
                    </svg>
                    {{ b.drop_location || b.rental_package || '-' }}
                  </span>
                  <span class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-kc-muted">
                    <span class="rounded-md px-1.5 py-0.5 font-medium" [class]="tag.cls"
                      >{{ tag.label }} · {{ b.pickup_time }}</span
                    >
                    <span>{{ typeLabel(b.booking_type) }} · {{ b.car_type }}</span>
                  </span>
                </td>
                <td class="whitespace-nowrap">
                  <span class="block max-w-44 truncate font-medium text-kc-ink">{{ b.customer_name }}</span>
                  <span class="mt-0.5 block"><kc-contact [mobile]="b.mobile" [compact]="true" /></span>
                </td>
                <td class="whitespace-nowrap">
                  @if (b.driver_name) {
                    <span class="inline-flex items-center gap-2">
                      <span
                        class="grid size-7 place-items-center rounded-full bg-kc-teal/10 text-xs font-semibold text-kc-teal"
                        >{{ b.driver_name.charAt(0) }}</span
                      >
                      <span class="font-medium text-kc-ink">{{ b.driver_name }}</span>
                    </span>
                  } @else if (b.status !== 'cancelled' && b.status !== 'completed') {
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100"
                    >
                      <span class="size-1.5 rounded-full bg-red-500"></span>Assign driver
                    </span>
                  } @else {
                    <span class="text-kc-muted">—</span>
                  }
                </td>
                <td class="text-right whitespace-nowrap">
                  <span class="font-semibold text-kc-ink tabular-nums">{{ rs(b.fare) }}</span>
                  <span class="mt-1 block text-xs">
                    @if (b.advance_status === 'PAID') {
                      <span class="font-medium text-emerald-700">✓ {{ rs(b.advance_amount) }} paid</span>
                    } @else if (b.advance_status === 'PENDING') {
                      <span class="text-amber-700">{{ rs(b.advance_amount) }} due</span>
                    } @else if (b.advance_status) {
                      <span class="text-kc-muted">Link {{ b.advance_status.toLowerCase() }}</span>
                    } @else {
                      <span class="text-kc-muted">No advance</span>
                    }
                  </span>
                </td>
                <td><kc-badge [value]="b.status" /></td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="py-14 text-center">
                  @if (list.loading()) {
                    <span class="text-kc-muted">Loading…</span>
                  } @else {
                    <span class="block font-medium text-kc-ink">No bookings found</span>
                    <span class="mt-1 block text-sm text-kc-muted">Try another search or clear the filters.</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <kc-pager [list]="list" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingsListComponent implements OnInit {
  /** From the URL, e.g. dashboard links: ?date=2026-11-07&driver=none */
  readonly dateParam = input<string>('', { alias: 'date' });
  readonly driverParam = input<string>('', { alias: 'driver' });

  private readonly db = inject(AdminDbService);
  protected readonly statuses = BOOKING_STATUSES;
  protected readonly types = BOOKING_TYPES;
  protected readonly day = day;
  protected readonly rs = rs;
  protected readonly stamp = stamp;
  protected readonly typeLabel = typeLabel;

  private readonly router = inject(Router);
  protected readonly dot: Record<string, string> = {
    new: 'bg-amber-500',
    confirmed: 'bg-sky-500',
    assigned: 'bg-violet-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-zinc-400',
  };

  protected q = '';
  protected status = '';
  protected type = '';
  protected date = '';
  protected noDriver = false;

  protected readonly list = new PagedList<Row>(async (from, to) =>
    toPage<Row>(await this.query(await this.db.db(), COLS, true).range(from, to)),
  );

  ngOnInit(): void {
    this.date = this.dateParam() ?? '';
    this.noDriver = this.driverParam() === 'none';
    void this.list.load();
  }

  protected filtered(): boolean {
    return !!(this.q || this.status || this.type || this.date || this.noDriver);
  }

  protected setStatus(s: string): void {
    this.status = s;
    void this.list.reset();
  }

  protected open(id: number): void {
    void this.router.navigate(['/admin/bookings', id]);
  }

  /** Booked time without the year when it is this year: "8 Nov, 12:54 PM". */
  protected booked(ts: string): string {
    return stamp(ts).replace(` ${new Date().getFullYear()},`, ',');
  }

  /** Pickup day as Today / Tomorrow / date, coloured by how soon it is (India time). */
  protected pickupTag(d: string): { label: string; cls: string } {
    const now = Date.now() + 330 * 60_000;
    const today = new Date(now).toISOString().slice(0, 10);
    const tomorrow = new Date(now + 86_400_000).toISOString().slice(0, 10);
    if (d === today) return { label: 'Today', cls: 'bg-kc-teal text-white' };
    if (d === tomorrow) return { label: 'Tomorrow', cls: 'bg-kc-teal/10 text-kc-teal' };
    const label = day(d).replace(` ${new Date().getFullYear()}`, '');
    return { label, cls: d < today ? 'bg-kc-surface text-kc-muted' : 'bg-kc-surface text-kc-ink' };
  }

  protected clear(): void {
    this.q = this.status = this.type = this.date = '';
    this.noDriver = false;
    void this.list.reset();
  }

  private query(db: SupabaseClient, cols: string, count: boolean) {
    let q = db.from('admin_bookings').select(cols, count ? { count: 'exact' } : undefined);
    const term = searchTerm(this.q);
    if (term) {
      if (/^\d{6,7}$/.test(term) && Number(term) > 900000) q = q.eq('id', Number(term));
      else if (/^\d+$/.test(term)) q = q.like('mobile', `${term}%`);
      else q = q.ilike('customer_name', `%${term}%`);
    }
    if (this.status) q = q.eq('status', this.status);
    if (this.type) q = q.eq('booking_type', this.type);
    if (this.date) q = q.eq('pickup_date', this.date);
    if (this.noDriver) q = q.is('driver_id', null).neq('status', 'cancelled');
    return q.order('id', { ascending: false });
  }

  /** Up to 5,000 rows of the current filter. */
  protected async exportCsv(): Promise<void> {
    const res = await this.query(await this.db.db(), COLS, false).limit(5000);
    if (res.data)
      downloadCsv(`kitecab-bookings-${this.date || 'all'}.csv`, res.data as unknown as Record<string, unknown>[]);
  }
}
