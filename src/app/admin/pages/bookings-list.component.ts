import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SupabaseClient } from '@supabase/supabase-js';
import { RouterLink } from '@angular/router';

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
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="kc-adm-h1">Bookings</h1>
      <button type="button" class="kc-adm-btn" (click)="exportCsv()">Export CSV (this filter)</button>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <input
        class="kc-adm-input w-full sm:w-72"
        type="search"
        placeholder="Search ID, name or mobile"
        [(ngModel)]="q"
        (ngModelChange)="list.debounce()"
        aria-label="Search bookings"
      />
      <select class="kc-adm-input" [(ngModel)]="status" (ngModelChange)="list.reset()" aria-label="Status">
        <option value="">All statuses</option>
        @for (s of statuses; track s) {
          <option [value]="s">{{ s }}</option>
        }
      </select>
      <select class="kc-adm-input" [(ngModel)]="type" (ngModelChange)="list.reset()" aria-label="Trip type">
        <option value="">All trips</option>
        @for (t of types; track t.value) {
          <option [value]="t.value">{{ t.label }}</option>
        }
      </select>
      <label class="flex items-center gap-2 text-sm"
        >Pickup date
        <input class="kc-adm-input" type="date" [(ngModel)]="date" (ngModelChange)="list.reset()" />
      </label>
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" [ngModel]="noDriver" (ngModelChange)="noDriver = $event; list.reset()" />
        No driver yet
      </label>
      @if (q || status || type || date || noDriver) {
        <button type="button" class="kc-adm-btn" (click)="clear()">Clear</button>
      }
    </div>

    @if (list.error()) {
      <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
        {{ list.error() }}
      </p>
    }

    <div class="kc-adm-card mt-4 overflow-hidden" [class.opacity-60]="list.loading()">
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Booked</th>
              <th>Pickup</th>
              <th>Trip</th>
              <th>Customer</th>
              <th>Fare</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Advance</th>
            </tr>
          </thead>
          <tbody>
            @for (b of list.rows(); track b.id) {
              <tr>
                <td>
                  <a class="font-medium text-kc-teal hover:underline" [routerLink]="[b.id]">#{{ b.id }}</a>
                </td>
                <td class="whitespace-nowrap text-kc-muted">
                  {{ stamp(b.created_at) }}
                </td>
                <td class="whitespace-nowrap">
                  {{ day(b.pickup_date) }}<br /><span class="text-kc-muted">{{ b.pickup_time }}</span>
                </td>
                <td class="min-w-48">
                  {{ b.pickup_location }} → {{ b.drop_location || b.rental_package || '-' }}<br /><span
                    class="text-kc-muted"
                    >{{ typeLabel(b.booking_type) }} · {{ b.car_type }}</span
                  >
                </td>
                <td>
                  <span class="block font-medium">{{ b.customer_name }}</span>
                  <kc-contact [mobile]="b.mobile" />
                </td>
                <td class="whitespace-nowrap">{{ rs(b.fare) }}</td>
                <td>
                  @if (b.driver_name) {
                    {{ b.driver_name }}
                  } @else if (b.status !== 'cancelled' && b.status !== 'completed') {
                    <span class="text-sm font-medium text-red-700">Not assigned</span>
                  } @else {
                    <span class="text-kc-muted">—</span>
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
                <td colspan="9" class="py-8 text-center text-kc-muted">
                  {{ list.loading() ? 'Loading…' : 'No bookings match.' }}
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
