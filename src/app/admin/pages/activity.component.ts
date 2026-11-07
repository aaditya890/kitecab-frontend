import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { SupabaseClient } from '@supabase/supabase-js';

import { AdminDbService } from '../core/admin-db.service';
import { stamp } from '../core/format';
import { PagedList, searchTerm, toPage } from '../core/paged-list';
import { PagerComponent } from '../ui/pager.component';

interface Row {
  id: number;
  actor_id: string | null;
  actor_name: string;
  entity: string;
  entity_id: string;
  action: string;
  detail: string | null;
  created_at: string;
}

/** Everything that happened in the office, newest first. */
@Component({
  selector: 'kc-admin-activity',
  imports: [FormsModule, RouterLink, PagerComponent],
  template: `
    <h1 class="kc-adm-h1">Activity log</h1>
    <p class="text-sm text-kc-muted">
      Recorded automatically: bookings, status changes, drivers, fares, calls
      and notes.
    </p>

    <div class="mt-4 flex flex-wrap gap-2">
      <select
        class="kc-adm-input"
        [(ngModel)]="person"
        (ngModelChange)="list.reset()"
        aria-label="Person"
      >
        <option value="">Everyone</option>
        @for (s of staff(); track s.id) {
          <option [value]="s.id">{{ s.name }}</option>
        }
      </select>
      <select
        class="kc-adm-input"
        [(ngModel)]="entity"
        (ngModelChange)="list.reset()"
        aria-label="Type"
      >
        <option value="">All</option>
        <option value="booking">Bookings</option>
        <option value="enquiry">Leads</option>
        <option value="staff">Staff</option>
      </select>
      <input
        class="kc-adm-input w-full sm:w-56"
        type="search"
        placeholder="Booking or lead number"
        [(ngModel)]="q"
        (ngModelChange)="list.debounce()"
        aria-label="Search"
      />
    </div>

    <div
      class="kc-adm-card mt-4 overflow-hidden"
      [class.opacity-60]="list.loading()"
    >
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>What</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            @for (a of list.rows(); track a.id) {
              <tr>
                <td class="whitespace-nowrap text-kc-muted">
                  {{ stamp(a.created_at) }}
                </td>
                <td class="font-medium">{{ a.actor_name }}</td>
                <td class="whitespace-nowrap">
                  @if (a.entity === 'booking') {
                    <a
                      class="text-kc-teal hover:underline"
                      [routerLink]="['/admin/bookings', a.entity_id]"
                      >Booking #{{ a.entity_id }}</a
                    >
                  } @else if (a.entity === 'enquiry') {
                    Lead #{{ a.entity_id }}
                  } @else {
                    {{ a.entity }}
                  }
                  <span class="text-kc-muted"> · {{ a.action }}</span>
                </td>
                <td>{{ a.detail }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="py-8 text-center text-kc-muted">
                  {{ list.loading() ? 'Loading…' : 'Nothing yet.' }}
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
export class ActivityComponent {
  private readonly db = inject(AdminDbService);
  protected readonly stamp = stamp;
  protected readonly staff = signal<{ id: string; name: string }[]>([]);
  protected person = '';
  protected entity = '';
  protected q = '';

  protected readonly list = new PagedList<Row>(
    async (from, to) =>
      toPage<Row>(await this.query(await this.db.db()).range(from, to)),
    50,
  );

  constructor() {
    void this.list.load();
    void this.db.db().then(async (db) => {
      const { data } = await db
        .from('admin_staff')
        .select('id,full_name,email');
      this.staff.set(
        (data ?? []).map((s) => ({
          id: s.id as string,
          name: (s.full_name || s.email) as string,
        })),
      );
    });
  }

  private query(db: SupabaseClient) {
    let q = db
      .from('admin_activity')
      .select(
        'id,actor_id,actor_name,entity,entity_id,action,detail,created_at',
        { count: 'exact' },
      );
    if (this.person) q = q.eq('actor_id', this.person);
    if (this.entity) q = q.eq('entity', this.entity);
    const t = searchTerm(this.q);
    if (t) q = q.eq('entity_id', t);
    return q.order('created_at', { ascending: false });
  }
}
