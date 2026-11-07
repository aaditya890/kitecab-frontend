import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminDbService } from '../core/admin-db.service';
import { CAR_TYPES, day } from '../core/format';
import { ok } from '../core/paged-list';
import { ToastService } from '../core/toast.service';
import { BadgeComponent } from '../ui/badge.component';

interface Driver {
  id?: number;
  full_name: string;
  mobile: string;
  alt_mobile: string | null;
  license_no: string | null;
  license_expiry: string | null;
  status: 'pending' | 'approved' | 'suspended';
  notes: string | null;
}

interface Vehicle {
  id?: number;
  driver_id: number | null;
  registration_no: string;
  car_type: string;
  model: string | null;
  seats: number | null;
  insurance_expiry: string | null;
  permit_expiry: string | null;
  puc_expiry: string | null;
  is_active: boolean;
}

const blankDriver = (): Driver => ({
  full_name: '',
  mobile: '',
  alt_mobile: null,
  license_no: null,
  license_expiry: null,
  status: 'approved',
  notes: null,
});
const blankVehicle = (): Vehicle => ({
  driver_id: null,
  registration_no: '',
  car_type: 'Sedan',
  model: null,
  seats: 4,
  insurance_expiry: null,
  permit_expiry: null,
  puc_expiry: null,
  is_active: true,
});

@Component({
  selector: 'kc-admin-drivers',
  imports: [FormsModule, BadgeComponent],
  template: `
    <h1 class="kc-adm-h1">Drivers and cars</h1>
    <p class="mt-1 text-sm text-kc-muted">
      Only <b>approved</b> drivers and <b>active</b> cars can be assigned to
      bookings. Red dates have expired or expire within 30 days.
    </p>

    <div class="mt-5 grid gap-5 xl:grid-cols-2">
      <section class="kc-adm-card overflow-hidden">
        <div
          class="flex items-center justify-between border-b border-kc-line px-4 py-3"
        >
          <h2 class="font-semibold">Drivers ({{ drivers().length }})</h2>
          <button
            type="button"
            class="kc-adm-btn-primary"
            (click)="d = blankDriver()"
          >
            + Add driver
          </button>
        </div>
        @if (d) {
          <form
            class="grid gap-3 border-b border-kc-line bg-kc-surface p-4 sm:grid-cols-2"
            (ngSubmit)="saveDriver()"
          >
            <label class="text-sm"
              >Name<input
                class="kc-adm-input mt-1 w-full"
                name="n"
                required
                [(ngModel)]="d.full_name"
            /></label>
            <label class="text-sm"
              >Mobile (10 digits)<input
                class="kc-adm-input mt-1 w-full"
                name="m"
                required
                inputmode="numeric"
                [(ngModel)]="d.mobile"
            /></label>
            <label class="text-sm"
              >Other mobile<input
                class="kc-adm-input mt-1 w-full"
                name="am"
                [(ngModel)]="d.alt_mobile"
            /></label>
            <label class="text-sm"
              >Status
              <select
                class="kc-adm-input mt-1 w-full"
                name="s"
                [(ngModel)]="d.status"
              >
                <option value="approved">approved</option>
                <option value="pending">pending</option>
                <option value="suspended">suspended</option>
              </select>
            </label>
            <label class="text-sm"
              >Licence no.<input
                class="kc-adm-input mt-1 w-full"
                name="l"
                [(ngModel)]="d.license_no"
            /></label>
            <label class="text-sm"
              >Licence expiry<input
                class="kc-adm-input mt-1 w-full"
                type="date"
                name="le"
                [(ngModel)]="d.license_expiry"
            /></label>
            <label class="text-sm sm:col-span-2"
              >Notes<input
                class="kc-adm-input mt-1 w-full"
                name="no"
                [(ngModel)]="d.notes"
            /></label>
            <div class="flex gap-2 sm:col-span-2">
              <button class="kc-adm-btn-primary" type="submit">
                {{ d.id ? 'Save driver' : 'Add driver' }}
              </button>
              <button class="kc-adm-btn" type="button" (click)="d = null">
                Cancel
              </button>
            </div>
          </form>
        }
        <div class="overflow-x-auto">
          <table class="kc-adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Licence</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (x of drivers(); track x.id) {
                <tr>
                  <td class="font-medium">
                    {{ x.full_name }}
                    @if (x.notes) {
                      <br /><span class="text-xs font-normal text-kc-muted">{{
                        x.notes
                      }}</span>
                    }
                  </td>
                  <td>
                    <a
                      class="text-kc-teal hover:underline"
                      [href]="'tel:+91' + x.mobile"
                      >{{ x.mobile }}</a
                    >
                  </td>
                  <td>
                    {{ x.license_no || '-' }}<br /><span
                      class="text-xs"
                      [class.text-red-700]="soon(x.license_expiry)"
                      >{{ day(x.license_expiry) }}</span
                    >
                  </td>
                  <td><kc-badge [value]="x.status" /></td>
                  <td>
                    <button
                      type="button"
                      class="kc-adm-btn"
                      (click)="d = { ...x }"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-6 text-center text-kc-muted">
                    No drivers yet.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="kc-adm-card overflow-hidden">
        <div
          class="flex items-center justify-between border-b border-kc-line px-4 py-3"
        >
          <h2 class="font-semibold">Cars ({{ vehicles().length }})</h2>
          <button
            type="button"
            class="kc-adm-btn-primary"
            (click)="v = blankVehicle()"
          >
            + Add car
          </button>
        </div>
        @if (v) {
          <form
            class="grid gap-3 border-b border-kc-line bg-kc-surface p-4 sm:grid-cols-2"
            (ngSubmit)="saveVehicle()"
          >
            <label class="text-sm"
              >Car number<input
                class="kc-adm-input mt-1 w-full uppercase"
                name="r"
                required
                placeholder="CG04AB1234"
                [(ngModel)]="v.registration_no"
            /></label>
            <label class="text-sm"
              >Type
              <select
                class="kc-adm-input mt-1 w-full"
                name="t"
                [(ngModel)]="v.car_type"
              >
                @for (c of cars; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </label>
            <label class="text-sm"
              >Model<input
                class="kc-adm-input mt-1 w-full"
                name="mo"
                placeholder="Dzire, Ertiga…"
                [(ngModel)]="v.model"
            /></label>
            <label class="text-sm"
              >Seats<input
                class="kc-adm-input mt-1 w-full"
                type="number"
                name="se"
                [(ngModel)]="v.seats"
            /></label>
            <label class="text-sm sm:col-span-2"
              >Usual driver
              <select
                class="kc-adm-input mt-1 w-full"
                name="dr"
                [(ngModel)]="v.driver_id"
              >
                <option [ngValue]="null">— none —</option>
                @for (x of drivers(); track x.id) {
                  <option [ngValue]="x.id">{{ x.full_name }}</option>
                }
              </select>
            </label>
            <label class="text-sm"
              >Insurance expiry<input
                class="kc-adm-input mt-1 w-full"
                type="date"
                name="ie"
                [(ngModel)]="v.insurance_expiry"
            /></label>
            <label class="text-sm"
              >Permit expiry<input
                class="kc-adm-input mt-1 w-full"
                type="date"
                name="pe"
                [(ngModel)]="v.permit_expiry"
            /></label>
            <label class="text-sm"
              >PUC expiry<input
                class="kc-adm-input mt-1 w-full"
                type="date"
                name="pu"
                [(ngModel)]="v.puc_expiry"
            /></label>
            <label class="flex items-center gap-2 text-sm"
              ><input type="checkbox" name="a" [(ngModel)]="v.is_active" />
              Active</label
            >
            <div class="flex gap-2 sm:col-span-2">
              <button class="kc-adm-btn-primary" type="submit">
                {{ v.id ? 'Save car' : 'Add car' }}
              </button>
              <button class="kc-adm-btn" type="button" (click)="v = null">
                Cancel
              </button>
            </div>
          </form>
        }
        <div class="overflow-x-auto">
          <table class="kc-adm-table">
            <thead>
              <tr>
                <th>Car</th>
                <th>Driver</th>
                <th>Insurance / permit / PUC</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (x of vehicles(); track x.id) {
                <tr [class.opacity-50]="!x.is_active">
                  <td class="font-medium">
                    {{ x.registration_no }}<br /><span
                      class="text-xs font-normal text-kc-muted"
                      >{{ x.car_type }} · {{ x.model || '-' }}</span
                    >
                  </td>
                  <td>{{ driverName(x.driver_id) }}</td>
                  <td class="text-xs">
                    <span [class.text-red-700]="soon(x.insurance_expiry)">{{
                      day(x.insurance_expiry)
                    }}</span>
                    /
                    <span [class.text-red-700]="soon(x.permit_expiry)">{{
                      day(x.permit_expiry)
                    }}</span>
                    /
                    <span [class.text-red-700]="soon(x.puc_expiry)">{{
                      day(x.puc_expiry)
                    }}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      class="kc-adm-btn"
                      (click)="v = { ...x }"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="py-6 text-center text-kc-muted">
                    No cars yet.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversComponent {
  private readonly db = inject(AdminDbService);
  private readonly toast = inject(ToastService);
  protected readonly cars = CAR_TYPES;
  protected readonly day = day;
  protected readonly blankDriver = blankDriver;
  protected readonly blankVehicle = blankVehicle;

  protected readonly drivers = signal<Driver[]>([]);
  protected readonly vehicles = signal<Vehicle[]>([]);
  protected d: Driver | null = null;
  protected v: Vehicle | null = null;

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const db = await this.db.db();
    const [d, v] = await Promise.all([
      db
        .from('drivers')
        .select(
          'id,full_name,mobile,alt_mobile,license_no,license_expiry,status,notes',
        )
        .order('full_name'),
      db
        .from('vehicles')
        .select(
          'id,driver_id,registration_no,car_type,model,seats,insurance_expiry,permit_expiry,puc_expiry,is_active',
        )
        .order('registration_no'),
    ]);
    if (d.error || v.error) this.toast.error(d.error ?? v.error);
    this.drivers.set((d.data ?? []) as Driver[]);
    this.vehicles.set((v.data ?? []) as Vehicle[]);
  }

  protected driverName(id: number | null): string {
    return this.drivers().find((x) => x.id === id)?.full_name ?? '-';
  }

  /** Expired or expiring within 30 days. */
  protected soon(date: string | null): boolean {
    return !!date && new Date(date).getTime() < Date.now() + 30 * 86_400_000;
  }

  protected async saveDriver(): Promise<void> {
    const x = this.d!;
    const mobile = x.mobile.replace(/\D/g, '').slice(-10);
    if (!x.full_name.trim() || mobile.length !== 10) {
      this.toast.error('Name and a 10-digit mobile are required.');
      return;
    }
    const row = {
      ...x,
      full_name: x.full_name.trim(),
      mobile,
      license_expiry: x.license_expiry || null,
      notes: x.notes?.trim() || null,
    };
    const { id, ...data } = row;
    const db = await this.db.db();
    if (
      await this.toast.run(
        async () =>
          ok(
            id
              ? await db.from('drivers').update(data).eq('id', id)
              : await db.from('drivers').insert(data),
          ),
        'Driver saved',
      )
    ) {
      this.d = null;
      await this.load();
    }
  }

  protected async saveVehicle(): Promise<void> {
    const x = this.v!;
    const reg = x.registration_no.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (reg.length < 6) {
      this.toast.error('Enter the car number, e.g. CG04AB1234.');
      return;
    }
    const { id, ...data } = {
      ...x,
      registration_no: reg,
      insurance_expiry: x.insurance_expiry || null,
      permit_expiry: x.permit_expiry || null,
      puc_expiry: x.puc_expiry || null,
    };
    const db = await this.db.db();
    if (
      await this.toast.run(
        async () =>
          ok(
            id
              ? await db.from('vehicles').update(data).eq('id', id)
              : await db.from('vehicles').insert(data),
          ),
        'Car saved',
      )
    ) {
      this.v = null;
      await this.load();
    }
  }
}
