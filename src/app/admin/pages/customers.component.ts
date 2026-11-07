import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SupabaseClient } from '@supabase/supabase-js';
import { RouterLink } from '@angular/router';

import { AdminDbService } from '../core/admin-db.service';
import { day, downloadCsv, rs, typeLabel } from '../core/format';
import { PagedList, searchTerm, toPage } from '../core/paged-list';
import { BadgeComponent } from '../ui/badge.component';
import { PagerComponent } from '../ui/pager.component';

interface Row {
  id: number;
  full_name: string;
  mobile: string;
  email: string | null;
  bookings: number;
  total_fare: number;
  last_trip: string | null;
}

interface Trip {
  id: number;
  booking_type: string;
  pickup_location: string;
  drop_location: string | null;
  rental_package: string | null;
  pickup_date: string;
  fare: number;
  status: string;
}

@Component({
  selector: 'kc-admin-customers',
  imports: [FormsModule, RouterLink, BadgeComponent, PagerComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="kc-adm-h1">Customers</h1>
      <button type="button" class="kc-adm-btn" (click)="exportCsv()">
        Export CSV
      </button>
    </div>
    <div class="mt-4 flex flex-wrap gap-2">
      <input
        class="kc-adm-input w-full sm:w-72"
        type="search"
        placeholder="Search name or mobile"
        [(ngModel)]="q"
        (ngModelChange)="list.debounce()"
        aria-label="Search customers"
      />
      <select
        class="kc-adm-input"
        [(ngModel)]="sort"
        (ngModelChange)="list.reset()"
        aria-label="Sort"
      >
        <option value="id">Newest first</option>
        <option value="bookings">Most bookings</option>
        <option value="total_fare">Most spent</option>
        <option value="last_trip">Recent trip</option>
      </select>
    </div>
    <div
      class="kc-adm-card mt-4 overflow-hidden"
      [class.opacity-60]="list.loading()"
    >
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Bookings</th>
              <th>Total fare</th>
              <th>Last trip</th>
            </tr>
          </thead>
          <tbody>
            @for (c of list.rows(); track c.id) {
              <tr class="cursor-pointer" (click)="toggle(c.id)">
                <td class="font-medium">
                  {{ c.full_name }}<br /><span
                    class="text-xs font-normal text-kc-muted"
                    >{{ c.email }}</span
                  >
                </td>
                <td>
                  <a
                    class="text-kc-teal hover:underline"
                    [href]="'tel:+91' + c.mobile"
                    (click)="$event.stopPropagation()"
                    >{{ c.mobile }}</a
                  >
                </td>
                <td>{{ c.bookings }}</td>
                <td>{{ rs(c.total_fare) }}</td>
                <td>{{ day(c.last_trip) }}</td>
              </tr>
              @if (openId() === c.id) {
                <tr>
                  <td colspan="5" class="bg-kc-surface">
                    @for (t of trips(); track t.id) {
                      <div
                        class="flex flex-wrap items-center gap-3 py-1 text-sm"
                      >
                        <a
                          class="font-medium text-kc-teal hover:underline"
                          [routerLink]="['/admin/bookings', t.id]"
                          >#{{ t.id }}</a
                        >
                        <span>{{ day(t.pickup_date) }}</span>
                        <span
                          >{{ typeLabel(t.booking_type) }}:
                          {{ t.pickup_location }} →
                          {{ t.drop_location || t.rental_package }}</span
                        >
                        <span>{{ rs(t.fare) }}</span>
                        <kc-badge [value]="t.status" />
                      </div>
                    } @empty {
                      <p class="py-1 text-sm text-kc-muted">Loading…</p>
                    }
                  </td>
                </tr>
              }
            } @empty {
              <tr>
                <td colspan="5" class="py-8 text-center text-kc-muted">
                  {{ list.loading() ? 'Loading…' : 'No customers.' }}
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
export class CustomersComponent {
  private readonly db = inject(AdminDbService);
  protected readonly rs = rs;
  protected readonly day = day;
  protected readonly typeLabel = typeLabel;
  protected q = '';
  protected sort: 'id' | 'bookings' | 'total_fare' | 'last_trip' = 'id';
  protected readonly openId = signal<number | null>(null);
  protected readonly trips = signal<Trip[]>([]);

  protected readonly list = new PagedList<Row>(async (from, to) =>
    toPage(await this.query(await this.db.db(), true).range(from, to)),
  );

  constructor() {
    void this.list.load();
  }

  private query(db: SupabaseClient, count: boolean) {
    let q = db
      .from('admin_customers')
      .select(
        'id,full_name,mobile,email,bookings,total_fare,last_trip',
        count ? { count: 'exact' } : undefined,
      );
    const t = searchTerm(this.q);
    if (t)
      q = /^\d+$/.test(t)
        ? q.like('mobile', `${t}%`)
        : q.ilike('full_name', `%${t}%`);
    return q
      .order(this.sort, { ascending: false, nullsFirst: false })
      .order('id', { ascending: false });
  }

  protected async toggle(id: number): Promise<void> {
    if (this.openId() === id) {
      this.openId.set(null);
      return;
    }
    this.openId.set(id);
    this.trips.set([]);
    const { data } = await (
      await this.db.db()
    )
      .from('bookings')
      .select(
        'id,booking_type,pickup_location,drop_location,rental_package,pickup_date,fare,status',
      )
      .eq('customer_id', id)
      .order('pickup_date', { ascending: false })
      .limit(50);
    this.trips.set((data ?? []) as Trip[]);
  }

  protected async exportCsv(): Promise<void> {
    const res = await this.query(await this.db.db(), false).limit(10000);
    if (res.data) downloadCsv('kitecab-customers.csv', res.data);
  }
}
