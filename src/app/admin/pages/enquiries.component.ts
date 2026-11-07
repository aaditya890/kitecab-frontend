import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SupabaseClient } from '@supabase/supabase-js';

import { AdminDbService } from '../core/admin-db.service';
import {
  BOOKING_TYPES,
  downloadCsv,
  stamp,
  todayIst,
  typeLabel,
} from '../core/format';
import { PagedList, searchTerm, toPage } from '../core/paged-list';
import { PagerComponent } from '../ui/pager.component';

interface Row {
  id: number;
  service_type: string | null;
  pickup: string;
  drop_or_package: string | null;
  mobile: string | null;
  created_at: string;
}

/** Every "Check price" on the website. Call people who did not book. */
@Component({
  selector: 'kc-admin-enquiries',
  imports: [FormsModule, PagerComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="kc-adm-h1">Enquiries</h1>
      <button type="button" class="kc-adm-btn" (click)="exportCsv()">
        Export CSV
      </button>
    </div>
    <div class="mt-4 flex flex-wrap gap-2">
      <input
        class="kc-adm-input w-full sm:w-72"
        type="search"
        placeholder="Search mobile or pickup"
        [(ngModel)]="q"
        (ngModelChange)="list.debounce()"
        aria-label="Search enquiries"
      />
      <select
        class="kc-adm-input"
        [(ngModel)]="type"
        (ngModelChange)="list.reset()"
        aria-label="Service"
      >
        <option value="">All services</option>
        @for (t of types; track t.value) {
          <option [value]="t.value">{{ t.label }}</option>
        }
      </select>
      <label class="flex items-center gap-2 text-sm"
        >Day
        <input
          class="kc-adm-input"
          type="date"
          [(ngModel)]="date"
          (ngModelChange)="list.reset()"
      /></label>
      <button
        type="button"
        class="kc-adm-btn"
        (click)="date = today; list.reset()"
      >
        Today
      </button>
    </div>

    <div
      class="kc-adm-card mt-4 overflow-hidden"
      [class.opacity-60]="list.loading()"
    >
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Service</th>
              <th>Pickup</th>
              <th>Drop / package</th>
              <th>Mobile</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (e of list.rows(); track e.id) {
              <tr>
                <td class="whitespace-nowrap text-kc-muted">
                  {{ stamp(e.created_at) }}
                </td>
                <td>{{ typeLabel(e.service_type) }}</td>
                <td>{{ e.pickup }}</td>
                <td>{{ e.drop_or_package || '-' }}</td>
                <td>
                  @if (e.mobile) {
                    <a
                      class="text-kc-teal hover:underline"
                      [href]="'tel:+91' + e.mobile"
                      >{{ e.mobile }}</a
                    >
                  } @else {
                    <span class="text-kc-muted">invalid</span>
                  }
                </td>
                <td>
                  @if (e.mobile) {
                    <a
                      class="kc-adm-btn"
                      [href]="'https://wa.me/91' + e.mobile"
                      target="_blank"
                      rel="noopener"
                      >WhatsApp</a
                    >
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="py-8 text-center text-kc-muted">
                  {{ list.loading() ? 'Loading…' : 'No enquiries.' }}
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
export class EnquiriesComponent {
  private readonly db = inject(AdminDbService);
  protected readonly types = BOOKING_TYPES;
  protected readonly stamp = stamp;
  protected readonly typeLabel = typeLabel;
  protected readonly today = todayIst();
  protected q = '';
  protected type = '';
  protected date = '';

  protected readonly list = new PagedList<Row>(
    async (from, to) =>
      toPage(await this.query(await this.db.db(), true).range(from, to)),
    50,
  );

  constructor() {
    void this.list.load();
  }

  private query(db: SupabaseClient, count: boolean) {
    let q = db
      .from('enquiries')
      .select(
        'id,service_type,pickup,drop_or_package,mobile,created_at',
        count ? { count: 'exact' } : undefined,
      );
    const t = searchTerm(this.q);
    if (t)
      q = /^\d+$/.test(t)
        ? q.like('mobile', `${t}%`)
        : q.ilike('pickup', `%${t}%`);
    if (this.type) q = q.eq('service_type', this.type);
    if (this.date) {
      // the day in India time (UTC+5:30)
      const start = new Date(`${this.date}T00:00:00+05:30`);
      q = q
        .gte('created_at', start.toISOString())
        .lt('created_at', new Date(start.getTime() + 86_400_000).toISOString());
    }
    return q.order('created_at', { ascending: false });
  }

  protected async exportCsv(): Promise<void> {
    const res = await this.query(await this.db.db(), false).limit(5000);
    if (res.data) downloadCsv('kitecab-enquiries.csv', res.data);
  }
}
