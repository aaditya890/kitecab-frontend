import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SupabaseClient } from '@supabase/supabase-js';
import { RouterLink } from '@angular/router';

import { AdminDbService } from '../core/admin-db.service';
import { downloadCsv, rs, stamp } from '../core/format';
import { PagedList, searchTerm, toPage } from '../core/paged-list';
import { BadgeComponent } from '../ui/badge.component';
import { PagerComponent } from '../ui/pager.component';

interface Row {
  id: number;
  booking_id: number;
  customer_name: string;
  mobile: string;
  booking_amount: number;
  advance_amount: number;
  amount_paid: number | null;
  status: string;
  razorpay_payment_id: string | null;
  attempt: number;
  paid_at: string | null;
  created_at: string;
}

const COLS =
  'id,booking_id,customer_name,mobile,booking_amount,advance_amount,amount_paid,status,razorpay_payment_id,attempt,paid_at,created_at';

@Component({
  selector: 'kc-admin-payments',
  imports: [FormsModule, RouterLink, BadgeComponent, PagerComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="kc-adm-h1">Advance payments</h1>
      <button type="button" class="kc-adm-btn" (click)="exportCsv()">
        Export CSV
      </button>
    </div>
    <div class="mt-4 flex flex-wrap gap-2">
      <input
        class="kc-adm-input w-full sm:w-72"
        type="search"
        placeholder="Booking ID, name, mobile or pay_…"
        [(ngModel)]="q"
        (ngModelChange)="list.debounce()"
        aria-label="Search payments"
      />
      <select
        class="kc-adm-input"
        [(ngModel)]="status"
        (ngModelChange)="list.reset()"
        aria-label="Status"
      >
        <option value="">All</option>
        @for (
          s of ['PAID', 'PENDING', 'EXPIRED', 'CANCELLED', 'FAILED'];
          track s
        ) {
          <option [value]="s">{{ s }}</option>
        }
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
              <th>Created</th>
              <th>Booking</th>
              <th>Customer</th>
              <th>Fare</th>
              <th>Advance</th>
              <th>Status</th>
              <th>Paid at</th>
              <th>Razorpay ID</th>
            </tr>
          </thead>
          <tbody>
            @for (p of list.rows(); track p.id) {
              <tr>
                <td class="whitespace-nowrap text-kc-muted">
                  {{ stamp(p.created_at) }}
                </td>
                <td>
                  <a
                    class="font-medium text-kc-teal hover:underline"
                    [routerLink]="['/admin/bookings', p.booking_id]"
                    >#{{ p.booking_id }}</a
                  >
                  @if (p.attempt > 1) {
                    <span class="text-xs text-kc-muted">
                      · link {{ p.attempt }}</span
                    >
                  }
                </td>
                <td>
                  {{ p.customer_name }}<br /><span class="text-kc-muted">{{
                    p.mobile
                  }}</span>
                </td>
                <td>{{ rs(p.booking_amount) }}</td>
                <td class="font-medium">
                  {{ rs(p.amount_paid ?? p.advance_amount) }}
                </td>
                <td><kc-badge [value]="p.status" /></td>
                <td class="whitespace-nowrap">{{ stamp(p.paid_at) }}</td>
                <td class="text-xs text-kc-muted">
                  {{ p.razorpay_payment_id || '-' }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="py-8 text-center text-kc-muted">
                  {{ list.loading() ? 'Loading…' : 'No payments.' }}
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
export class PaymentsComponent implements OnInit {
  readonly statusParam = input<string>('', { alias: 'status' });
  private readonly db = inject(AdminDbService);
  protected readonly rs = rs;
  protected readonly stamp = stamp;
  protected q = '';
  protected status = '';

  protected readonly list = new PagedList<Row>(async (from, to) =>
    toPage(await this.query(await this.db.db(), true).range(from, to)),
  );

  ngOnInit(): void {
    this.status = this.statusParam() ?? '';
    void this.list.load();
  }

  private query(db: SupabaseClient, count: boolean) {
    let q = db
      .from('booking_payments')
      .select(COLS, count ? { count: 'exact' } : undefined);
    const t = searchTerm(this.q);
    if (t) {
      if (/^\d{6,7}$/.test(t) && Number(t) > 900000)
        q = q.eq('booking_id', Number(t));
      else if (/^\d+$/.test(t)) q = q.like('mobile', `${t}%`);
      else if (t.startsWith('pay_')) q = q.eq('razorpay_payment_id', t);
      else q = q.ilike('customer_name', `%${t}%`);
    }
    if (this.status) q = q.eq('status', this.status);
    return q.order('created_at', { ascending: false });
  }

  protected async exportCsv(): Promise<void> {
    const res = await this.query(await this.db.db(), false).limit(5000);
    if (res.data) downloadCsv('kitecab-payments.csv', res.data);
  }
}
