import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminDbService } from '../core/admin-db.service';
import { BOOKING_STATUSES, day, rs, stamp, typeLabel } from '../core/format';
import { downloadInvoice, type InvoiceBooking } from '../core/invoice';
import { ok } from '../core/paged-list';
import { ToastService } from '../core/toast.service';
import { SiteSettingsService } from '../../core/services/site-settings.service';
import { BadgeComponent } from '../ui/badge.component';

interface Booking extends InvoiceBooking {
  status: string;
  advance_amount: number | null;
  advance_percent: number | null;
  driver_id: number | null;
  vehicle_id: number | null;
  assigned_at: string | null;
  admin_notes: string | null;
  customer_id: number | null;
  coupon_code: string | null;
  discount_amount: number;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: number;
  status: string;
  advance_amount: number;
  amount_paid: number | null;
  payment_link: string | null;
  razorpay_payment_id: string | null;
  attempt: number;
  paid_at: string | null;
  created_at: string;
}

interface Driver {
  id: number;
  full_name: string;
  mobile: string;
  status: string;
}

interface Vehicle {
  id: number;
  driver_id: number | null;
  registration_no: string;
  car_type: string;
  model: string | null;
}

interface History {
  id: number;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
}

@Component({
  selector: 'kc-admin-booking-detail',
  imports: [FormsModule, RouterLink, BadgeComponent],
  template: `
    <a routerLink="/admin/bookings" class="text-sm text-kc-teal hover:underline"
      >← All bookings</a
    >

    @if (b(); as b) {
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <h1 class="kc-adm-h1">Booking #{{ b.id }}</h1>
          <kc-badge [value]="b.status" />
          <kc-badge [value]="latestPayment()?.status" />
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="kc-adm-btn"
            (click)="invoice()"
            [disabled]="busy()"
          >
            Invoice PDF
          </button>
          <a class="kc-adm-btn" [href]="'tel:+91' + b.mobile">Call customer</a>
          <a
            class="kc-adm-btn"
            [href]="waCustomer()"
            target="_blank"
            rel="noopener"
            >WhatsApp customer</a
          >
        </div>
      </div>
      <p class="mt-1 text-sm text-kc-muted">
        Booked {{ stamp(b.created_at) }} · invoice INV{{
          (b.id + 5125).toString().padStart(6, '0')
        }}
      </p>

      <div class="mt-5 grid gap-5 xl:grid-cols-3">
        <!-- trip + customer -->
        <section class="kc-adm-card p-5 xl:col-span-2">
          <h2 class="font-semibold">Trip</h2>
          <dl
            class="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2"
          >
            <div>
              <dt class="text-kc-muted">Trip</dt>
              <dd>{{ typeLabel(b.booking_type) }} · {{ b.car_type }}</dd>
            </div>
            <div>
              <dt class="text-kc-muted">Route</dt>
              <dd>
                {{ b.pickup_location }} →
                {{ b.drop_location || b.rental_package || '-' }}
              </dd>
            </div>
            @if (b.booking_type === 'round-trip') {
              <div>
                <dt class="text-kc-muted">Waiting / approx km</dt>
                <dd>
                  {{ b.waiting_time || '-' }} ·
                  {{ b.approx_distance_km ?? '-' }} km
                </dd>
              </div>
            } @else if (b.distance_km) {
              <div>
                <dt class="text-kc-muted">Distance</dt>
                <dd>{{ b.distance_km }} km</dd>
              </div>
            }
            <div>
              <dt class="text-kc-muted">Passengers</dt>
              <dd>{{ b.passengers }}</dd>
            </div>
            <div>
              <dt class="text-kc-muted">Customer</dt>
              <dd>
                {{ b.customer_name }} ·
                <a
                  class="text-kc-teal hover:underline"
                  [href]="'tel:+91' + b.mobile"
                  >{{ b.mobile }}</a
                >
              </dd>
            </div>
            <div>
              <dt class="text-kc-muted">Email</dt>
              <dd>{{ b.email || '-' }}</dd>
            </div>
            <div>
              <dt class="text-kc-muted">Fare</dt>
              <dd class="font-semibold">
                {{ rs(b.fare) }}
                @if (b.discount_amount) {
                  <span class="font-normal text-kc-muted"
                    >(coupon {{ b.coupon_code }} −{{
                      rs(b.discount_amount)
                    }})</span
                  >
                }
              </dd>
            </div>
            <div>
              <dt class="text-kc-muted">Advance / balance</dt>
              <dd>
                {{ rs(b.advance_amount) }} / {{ rs(b.fare - paid()) }} to driver
              </dd>
            </div>
          </dl>

          <h2 class="mt-6 font-semibold">Edit</h2>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="text-sm"
              >Pickup date<input
                class="kc-adm-input mt-1 w-full"
                type="date"
                [(ngModel)]="edit.pickup_date"
            /></label>
            <label class="text-sm"
              >Pickup time<input
                class="kc-adm-input mt-1 w-full"
                [(ngModel)]="edit.pickup_time"
                placeholder="6:30 PM"
            /></label>
            <label class="text-sm sm:col-span-2"
              >Pickup address<input
                class="kc-adm-input mt-1 w-full"
                [(ngModel)]="edit.pickup_address"
            /></label>
            <label class="text-sm"
              >Fare (₹)<input
                class="kc-adm-input mt-1 w-full"
                type="number"
                min="0"
                [(ngModel)]="edit.fare"
            /></label>
            <label class="text-sm"
              >Passengers<input
                class="kc-adm-input mt-1 w-full"
                type="number"
                min="1"
                max="20"
                [(ngModel)]="edit.passengers"
            /></label>
            <label class="text-sm sm:col-span-2"
              >Admin notes (only admins see this)<textarea
                class="kc-adm-input mt-1 w-full"
                rows="2"
                [(ngModel)]="edit.admin_notes"
              ></textarea>
            </label>
          </div>
          <button
            type="button"
            class="kc-adm-btn-primary mt-3"
            (click)="saveEdit()"
            [disabled]="busy()"
          >
            Save changes
          </button>
        </section>

        <!-- operations -->
        <section class="flex flex-col gap-5">
          <div class="kc-adm-card p-5">
            <h2 class="font-semibold">Status</h2>
            <div class="mt-3 flex flex-wrap gap-2">
              @for (s of statuses; track s) {
                <button
                  type="button"
                  class="kc-adm-btn capitalize"
                  [class.!bg-kc-teal]="b.status === s"
                  [class.!text-white]="b.status === s"
                  (click)="setStatus(s)"
                  [disabled]="busy() || b.status === s"
                >
                  {{ s }}
                </button>
              }
            </div>
          </div>

          <div class="kc-adm-card p-5">
            <h2 class="font-semibold">Driver and car</h2>
            <label class="mt-3 block text-sm"
              >Driver
              <select
                class="kc-adm-input mt-1 w-full"
                [(ngModel)]="driverId"
                (ngModelChange)="onDriver($event)"
              >
                <option [ngValue]="null">— none —</option>
                @for (d of drivers(); track d.id) {
                  <option [ngValue]="d.id">
                    {{ d.full_name }} · {{ d.mobile }}
                  </option>
                }
              </select>
            </label>
            <label class="mt-3 block text-sm"
              >Car
              <select class="kc-adm-input mt-1 w-full" [(ngModel)]="vehicleId">
                <option [ngValue]="null">— none —</option>
                @for (v of vehicles(); track v.id) {
                  <option [ngValue]="v.id">
                    {{ v.registration_no }} · {{ v.model || v.car_type }}
                  </option>
                }
              </select>
            </label>
            @if (!drivers().length) {
              <p class="mt-2 text-xs text-kc-muted">
                No approved drivers yet.
                <a
                  routerLink="/admin/drivers"
                  class="text-kc-teal hover:underline"
                  >Add drivers</a
                >.
              </p>
            }
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                class="kc-adm-btn-primary"
                (click)="assign()"
                [disabled]="busy()"
              >
                Save driver
              </button>
              @if (b.driver_id) {
                <a
                  class="kc-adm-btn"
                  [href]="waDriverToCustomer()"
                  target="_blank"
                  rel="noopener"
                  >Send driver details to customer</a
                >
                <a
                  class="kc-adm-btn"
                  [href]="waTripToDriver()"
                  target="_blank"
                  rel="noopener"
                  >Send trip to driver</a
                >
              }
            </div>
            @if (b.assigned_at) {
              <p class="mt-2 text-xs text-kc-muted">
                Assigned {{ stamp(b.assigned_at) }}
              </p>
            }
          </div>

          <div class="kc-adm-card p-5">
            <h2 class="font-semibold">Advance payment</h2>
            <ul class="mt-3 space-y-2 text-sm">
              @for (p of payments(); track p.id) {
                <li class="rounded-lg border border-kc-line p-2">
                  <div class="flex items-center justify-between">
                    <kc-badge [value]="p.status" /><span>{{
                      rs(p.amount_paid ?? p.advance_amount)
                    }}</span>
                  </div>
                  <p class="mt-1 text-xs text-kc-muted">
                    Link #{{ p.attempt }} · {{ stamp(p.created_at) }}
                    @if (p.paid_at) {
                      · paid {{ stamp(p.paid_at) }}
                    }
                  </p>
                  @if (p.razorpay_payment_id) {
                    <p class="text-xs text-kc-muted">
                      {{ p.razorpay_payment_id }}
                    </p>
                  }
                  @if (p.status === 'PENDING' && p.payment_link) {
                    <button
                      type="button"
                      class="mt-1 text-xs font-medium text-kc-teal hover:underline"
                      (click)="copy(p.payment_link)"
                    >
                      Copy pay link
                    </button>
                  }
                </li>
              } @empty {
                <li class="text-kc-muted">No payment link.</li>
              }
            </ul>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                class="kc-adm-btn"
                (click)="resend('customer-whatsapp')"
                [disabled]="busy() || latestPayment()?.status !== 'PENDING'"
              >
                Resend to customer
              </button>
              <button
                type="button"
                class="kc-adm-btn"
                (click)="resend('new-payment-link')"
                [disabled]="busy() || paid() > 0"
              >
                New pay link
              </button>
              <button
                type="button"
                class="kc-adm-btn"
                (click)="resend('admin-whatsapp')"
                [disabled]="busy()"
              >
                Resend admin alert
              </button>
            </div>
          </div>

          <div class="kc-adm-card p-5">
            <h2 class="font-semibold">History</h2>
            <ol class="mt-3 space-y-1 text-sm">
              @for (h of history(); track h.id) {
                <li>
                  <span class="text-kc-muted">{{ stamp(h.created_at) }}</span> ·
                  {{ h.from_status ? h.from_status + ' → ' : ''
                  }}<b class="capitalize">{{ h.to_status }}</b>
                </li>
              }
            </ol>
          </div>
        </section>
      </div>
    } @else {
      <p class="mt-6 text-kc-muted">{{ error() || 'Loading…' }}</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDetailComponent implements OnInit {
  readonly id = input.required<string>();

  private readonly db = inject(AdminDbService);
  private readonly toast = inject(ToastService);
  private readonly site = inject(SiteSettingsService);

  protected readonly statuses = BOOKING_STATUSES;
  protected readonly rs = rs;
  protected readonly stamp = stamp;
  protected readonly typeLabel = typeLabel;

  protected readonly b = signal<Booking | null>(null);
  protected readonly payments = signal<Payment[]>([]);
  protected readonly history = signal<History[]>([]);
  protected readonly drivers = signal<Driver[]>([]);
  protected readonly allVehicles = signal<Vehicle[]>([]);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected edit: Partial<Booking> = {};
  protected driverId: number | null = null;
  protected vehicleId: number | null = null;
  private readonly chosenDriver = signal<number | null>(null);

  protected readonly latestPayment = computed<Payment | null>(
    () => this.payments()[0] ?? null,
  );
  protected readonly paid = computed(() =>
    this.payments()
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + (p.amount_paid ?? p.advance_amount), 0),
  );
  /** The chosen driver's cars first, then the rest. */
  protected readonly vehicles = computed(() => {
    const d = this.chosenDriver();
    return [...this.allVehicles()].sort(
      (a, b) => Number(b.driver_id === d) - Number(a.driver_id === d),
    );
  });

  ngOnInit(): void {
    void this.load();
  }

  private get bookingId(): number {
    return Number(this.id());
  }

  protected async load(): Promise<void> {
    const db = await this.db.db();
    const [b, p, h, d, v] = await Promise.all([
      db.from('bookings').select('*').eq('id', this.bookingId).maybeSingle(),
      db
        .from('booking_payments')
        .select(
          'id,status,advance_amount,amount_paid,payment_link,razorpay_payment_id,attempt,paid_at,created_at',
        )
        .eq('booking_id', this.bookingId)
        .order('created_at', { ascending: false }),
      db
        .from('booking_status_history')
        .select('id,from_status,to_status,note,created_at')
        .eq('booking_id', this.bookingId)
        .order('created_at'),
      db
        .from('drivers')
        .select('id,full_name,mobile,status')
        .eq('status', 'approved')
        .order('full_name'),
      db
        .from('vehicles')
        .select('id,driver_id,registration_no,car_type,model')
        .eq('is_active', true)
        .order('registration_no'),
    ]);
    if (b.error || !b.data) {
      this.error.set(b.error?.message ?? 'Booking not found.');
      return;
    }
    const booking = b.data as Booking;
    this.b.set(booking);
    this.edit = {
      pickup_date: booking.pickup_date,
      pickup_time: booking.pickup_time,
      pickup_address: booking.pickup_address,
      fare: booking.fare,
      passengers: booking.passengers,
      admin_notes: booking.admin_notes,
    };
    this.driverId = booking.driver_id;
    this.vehicleId = booking.vehicle_id;
    this.chosenDriver.set(booking.driver_id);
    this.payments.set((p.data ?? []) as Payment[]);
    this.history.set((h.data ?? []) as History[]);
    this.drivers.set((d.data ?? []) as Driver[]);
    this.allVehicles.set((v.data ?? []) as Vehicle[]);
  }

  private async update(
    patch: Record<string, unknown>,
    success: string,
  ): Promise<void> {
    this.busy.set(true);
    const done = await this.toast.run(
      async () =>
        ok(
          await (
            await this.db.db()
          )
            .from('bookings')
            .update(patch)
            .eq('id', this.bookingId),
        ),
      success,
    );
    if (done) await this.load();
    this.busy.set(false);
  }

  protected saveEdit(): void {
    const e = this.edit;
    if (
      !e.pickup_date ||
      !e.pickup_time?.trim() ||
      !e.pickup_address?.trim() ||
      !(Number(e.fare) >= 0)
    ) {
      this.toast.error('Date, time, address and fare are required.');
      return;
    }
    void this.update(
      {
        pickup_date: e.pickup_date,
        pickup_time: e.pickup_time.trim(),
        pickup_address: e.pickup_address.trim(),
        fare: Math.round(Number(e.fare)),
        passengers: Math.min(
          20,
          Math.max(1, Math.round(Number(e.passengers) || 1)),
        ),
        admin_notes: e.admin_notes?.trim() || null,
      },
      'Booking saved',
    );
  }

  protected setStatus(status: string): void {
    if (status === 'cancelled' && !confirm('Cancel this booking?')) return;
    void this.update({ status }, `Marked ${status}`);
  }

  protected onDriver(id: number | null): void {
    this.chosenDriver.set(id);
    const own = this.allVehicles().find((v) => v.driver_id === id);
    if (own) this.vehicleId = own.id;
  }

  protected assign(): void {
    const b = this.b()!;
    const patch: Record<string, unknown> = {
      driver_id: this.driverId,
      vehicle_id: this.vehicleId,
      assigned_at: this.driverId ? new Date().toISOString() : null,
    };
    if (this.driverId && (b.status === 'new' || b.status === 'confirmed'))
      patch['status'] = 'assigned';
    void this.update(
      patch,
      this.driverId ? 'Driver assigned' : 'Driver removed',
    );
  }

  protected async resend(
    action: 'customer-whatsapp' | 'admin-whatsapp' | 'new-payment-link',
  ): Promise<void> {
    if (
      action === 'new-payment-link' &&
      !confirm('Cancel the old unpaid link and send a new one on WhatsApp?')
    )
      return;
    this.busy.set(true);
    const msg = {
      'customer-whatsapp': 'Sent to customer',
      'admin-whatsapp': 'Admin alert sent',
      'new-payment-link': 'New link sent',
    }[action];
    await this.toast.run(
      () => this.db.api('/admin/resend', { bookingId: this.bookingId, action }),
      msg,
    );
    await this.load();
    this.busy.set(false);
  }

  protected async invoice(): Promise<void> {
    this.busy.set(true);
    await this.toast.run(
      () =>
        downloadInvoice(this.b()!, {
          advancePaid: this.paid(),
          phone: this.site.contact().phoneDisplay,
          email: this.site.contact().email,
        }),
      'Invoice downloaded',
    );
    this.busy.set(false);
  }

  protected copy(text: string): void {
    void navigator.clipboard
      .writeText(text)
      .then(() => this.toast.ok('Link copied'));
  }

  // ---- WhatsApp chat links (open the admin's own WhatsApp with the text ready) ----
  private wa(mobile: string, text: string): string {
    const n = mobile.replace(/\D/g, '');
    return `https://wa.me/${n.length === 10 ? '91' + n : n}?text=${encodeURIComponent(text)}`;
  }

  private tripLine(b: Booking): string {
    return `${b.pickup_location} → ${b.drop_location || b.rental_package || ''}`.trim();
  }

  protected waCustomer(): string {
    const b = this.b()!;
    return this.wa(
      b.mobile,
      `Hello ${b.customer_name}, this is KiteCab about your booking #${b.id} (${this.tripLine(b)}, ${day(b.pickup_date)} ${b.pickup_time}).`,
    );
  }

  protected waDriverToCustomer(): string {
    const b = this.b()!;
    const d = this.drivers().find((x) => x.id === b.driver_id);
    const v = this.allVehicles().find((x) => x.id === b.vehicle_id);
    return this.wa(
      b.mobile,
      `Hello ${b.customer_name}, the driver for your KiteCab booking #${b.id} has been assigned.\n\n` +
        `Driver name: ${d?.full_name ?? '-'}\nDriver mobile: ${d?.mobile ?? '-'}\nCar model: ${v?.model || v?.car_type || '-'}\n` +
        `Car number: ${v?.registration_no ?? '-'}\nPickup: ${day(b.pickup_date)}, ${b.pickup_time}\n\nHave a safe trip with KiteCab.`,
    );
  }

  protected waTripToDriver(): string {
    const b = this.b()!;
    const d = this.drivers().find((x) => x.id === b.driver_id);
    if (!d) return '#';
    const balance = b.fare - this.paid();
    return this.wa(
      d.mobile,
      `KiteCab trip #${b.id}\n${typeLabel(b.booking_type)} · ${b.car_type}\n${this.tripLine(b)}\n` +
        `Pickup: ${day(b.pickup_date)}, ${b.pickup_time}\nAddress: ${b.pickup_address}\n` +
        `Customer: ${b.customer_name}, ${b.mobile}\nPassengers: ${b.passengers}\nCollect from customer: ₹${balance.toLocaleString('en-IN')}`,
    );
  }
}
