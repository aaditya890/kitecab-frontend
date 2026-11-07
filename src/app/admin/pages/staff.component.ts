import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminDbService } from '../core/admin-db.service';
import { ago } from '../core/format';
import { ToastService } from '../core/toast.service';

interface Perf {
  id: string;
  name: string;
  role: string;
  follow_ups: number;
  converted: number;
  not_reached: number;
  bookings_created: number;
  drivers_assigned: number;
  open_leads: number;
  overdue: number;
  last_active: string | null;
}

interface StaffRow {
  id: string;
  role: string;
  full_name: string | null;
  email: string;
  last_sign_in_at: string | null;
}

/** Who works in the office, and how much each person did. */
@Component({
  selector: 'kc-admin-staff',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="kc-adm-h1">Staff and performance</h1>
        <p class="text-sm text-kc-muted">
          Calls, conversions and bookings per person. Late = follow-up time has
          passed.
        </p>
      </div>
      <div
        class="flex rounded-lg border border-kc-line bg-white p-0.5"
        role="group"
        aria-label="Period"
      >
        @for (d of [1, 7, 30]; track d) {
          <button
            type="button"
            class="rounded-md px-3 py-1 text-sm font-medium"
            [class]="
              days() === d ? 'bg-kc-teal text-white' : 'hover:bg-kc-surface'
            "
            (click)="setDays(d)"
          >
            {{ d === 1 ? 'Today' : d + ' days' }}
          </button>
        }
      </div>
    </div>

    <div class="kc-adm-card mt-5 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>Person</th>
              <th class="text-right">Calls</th>
              <th class="text-right">Not reached</th>
              <th class="text-right">Leads booked</th>
              <th class="text-right">Bookings made</th>
              <th class="text-right">Drivers assigned</th>
              <th class="text-right">Open leads</th>
              <th class="text-right">Late</th>
              <th>Last active</th>
            </tr>
          </thead>
          <tbody>
            @for (p of perf(); track p.id) {
              <tr>
                <td>
                  <span class="font-medium">{{ p.name }}</span
                  ><br /><span class="text-xs text-kc-muted capitalize">{{
                    p.role
                  }}</span>
                </td>
                <td class="text-right font-semibold">{{ p.follow_ups }}</td>
                <td class="text-right">{{ p.not_reached }}</td>
                <td class="text-right text-emerald-700">{{ p.converted }}</td>
                <td class="text-right">{{ p.bookings_created }}</td>
                <td class="text-right">{{ p.drivers_assigned }}</td>
                <td class="text-right">{{ p.open_leads }}</td>
                <td
                  class="text-right"
                  [class.font-semibold]="p.overdue"
                  [class.text-red-700]="p.overdue"
                >
                  {{ p.overdue }}
                </td>
                <td class="text-sm text-kc-muted whitespace-nowrap">
                  {{ p.last_active ? ago(p.last_active) : 'never' }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="py-8 text-center text-kc-muted">
                  {{ loading() ? 'Loading…' : 'No staff yet.' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="border-t border-kc-line px-4 py-2 text-xs text-kc-muted">
        See every action in the
        <a routerLink="/admin/activity" class="text-kc-teal hover:underline"
          >activity log</a
        >.
      </p>
    </div>

    <div class="mt-5 grid gap-5 xl:grid-cols-2">
      <section class="kc-adm-card p-5">
        <h2 class="font-semibold">Add or change a person</h2>
        <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm text-kc-muted">
          <li>
            In Supabase → Authentication → Users → <b>Add user</b>: their email
            and a password (tick Auto Confirm).
          </li>
          <li>Enter the same email here and choose the access.</li>
        </ol>
        <form class="mt-4 grid gap-3 sm:grid-cols-2" (ngSubmit)="save()">
          <label class="text-sm"
            ><span class="kc-adm-label">Email *</span
            ><input
              class="kc-adm-input w-full"
              type="email"
              name="e"
              [(ngModel)]="email"
          /></label>
          <label class="text-sm"
            ><span class="kc-adm-label">Name</span
            ><input
              class="kc-adm-input w-full"
              name="n"
              [(ngModel)]="name"
              placeholder="Shown in follow-ups"
          /></label>
          <label class="text-sm"
            ><span class="kc-adm-label">Access</span>
            <select class="kc-adm-input w-full" name="r" [(ngModel)]="role">
              <option value="staff">Staff — leads, bookings, customers</option>
              <option value="admin">
                Admin — everything incl. prices and settings
              </option>
              <option value="customer">Remove office access</option>
            </select>
          </label>
          <div class="flex items-end">
            <button
              class="kc-adm-btn-primary"
              type="submit"
              [disabled]="busy()"
            >
              Save
            </button>
          </div>
        </form>
      </section>

      <section class="kc-adm-card overflow-hidden">
        <h2 class="border-b border-kc-line px-4 py-3 font-semibold">
          Office logins
        </h2>
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Access</th>
              <th>Last login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (s of staff(); track s.id) {
              <tr>
                <td>
                  <span class="font-medium">{{ s.full_name || '—' }}</span
                  ><br /><span class="text-xs text-kc-muted">{{
                    s.email
                  }}</span>
                </td>
                <td class="capitalize">{{ s.role }}</td>
                <td class="text-sm text-kc-muted">
                  {{ s.last_sign_in_at ? ago(s.last_sign_in_at) : 'never' }}
                </td>
                <td>
                  <button type="button" class="kc-adm-btn" (click)="pick(s)">
                    Edit
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffComponent {
  private readonly db = inject(AdminDbService);
  private readonly toast = inject(ToastService);
  protected readonly ago = ago;

  protected readonly days = signal(7);
  protected readonly perf = signal<Perf[]>([]);
  protected readonly staff = signal<StaffRow[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected email = '';
  protected name = '';
  protected role = 'staff';

  constructor() {
    void this.load();
  }

  protected setDays(d: number): void {
    this.days.set(d);
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    const db = await this.db.db();
    const [p, s] = await Promise.all([
      db.rpc('staff_performance', { p_days: this.days() }),
      db
        .from('admin_staff')
        .select('id,role,full_name,email,last_sign_in_at')
        .order('role')
        .order('full_name'),
    ]);
    this.loading.set(false);
    if (p.error) this.toast.error(p.error);
    this.perf.set((p.data ?? []) as Perf[]);
    this.staff.set((s.data ?? []) as StaffRow[]);
  }

  protected pick(s: StaffRow): void {
    this.email = s.email;
    this.name = s.full_name ?? '';
    this.role = s.role;
  }

  protected async save(): Promise<void> {
    if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) {
      this.toast.error('Enter the email they log in with.');
      return;
    }
    this.busy.set(true);
    const done = await this.toast.run(
      async () => {
        const { error } = await (
          await this.db.db()
        ).rpc('admin_set_staff', {
          p_email: this.email.trim(),
          p_role: this.role,
          p_name: this.name.trim() || null,
        });
        if (error) throw new Error(error.message);
      },
      this.role === 'customer' ? 'Office access removed' : 'Saved',
    );
    this.busy.set(false);
    if (done) {
      this.email = this.name = '';
      this.role = 'staff';
      await this.load();
    }
  }
}
