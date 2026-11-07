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

import { SiteSettingsService } from '../../core/services/site-settings.service';
import { AdminDbService } from '../core/admin-db.service';
import { ago, day, rs, stamp, typeLabel, val } from '../core/format';
import { downloadInvoice, type InvoiceBooking } from '../core/invoice';
import { ok } from '../core/paged-list';
import { ToastService } from '../core/toast.service';
import { BadgeComponent } from '../ui/badge.component';
import {
  ContactActionsComponent,
  waLink,
} from '../ui/contact-actions.component';

interface Booking extends InvoiceBooking {
  status: string;
  advance_amount: number | null;
  advance_percent: number | null;
  driver_id: number | null;
  vehicle_id: number | null;
  assigned_at: string | null;
  admin_notes: string | null;
  coupon_code: string | null;
  discount_amount: number;
  fare_before_discount: number | null;
  source: string;
  handled_by: string | null;
  enquiry_id: number | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  balance_collected: number | null;
  balance_mode: string | null;
  extra_charges: number;
  extra_note: string | null;
  customer_rating: number | null;
  feedback: string | null;
  created_at: string;
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
}

interface Vehicle {
  id: number;
  driver_id: number | null;
  registration_no: string;
  car_type: string;
  model: string | null;
}

interface Activity {
  id: number;
  action: string;
  detail: string | null;
  actor_name: string;
  created_at: string;
}

type Panel = '' | 'edit' | 'complete' | 'cancel';

const ACTION_LABEL: Record<string, string> = {
  created: 'Booking created',
  status: 'Status changed',
  driver: 'Driver / car',
  fare: 'Fare changed',
  pickup: 'Pickup changed',
  collected: 'Balance collected',
  whatsapp: 'WhatsApp sent',
  note: 'Note',
};

@Component({
  selector: 'kc-admin-booking-detail',
  imports: [FormsModule, RouterLink, BadgeComponent, ContactActionsComponent],
  template: `
    <a routerLink="/admin/bookings" class="text-sm text-kc-teal hover:underline"
      >← All bookings</a
    >

    @if (b(); as b) {
      <!-- header -->
      <div class="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="kc-adm-h1">Booking #{{ b.id }}</h1>
            <kc-badge [value]="b.status" />
            @if (latestPayment(); as p) {
              <kc-badge
                [value]="p.status"
                [label]="'Advance ' + p.status.toLowerCase()"
              />
            }
          </div>
          <p class="mt-1 text-sm text-kc-muted">
            Booked {{ ago(b.created_at) }} · via {{ b.source }} · handled by
            {{ handledName() || 'nobody' }}
            @if (b.handled_by !== db.userId()) {
              ·
              <button
                type="button"
                class="text-kc-teal hover:underline"
                (click)="takeOver()"
              >
                take it
              </button>
            }
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="kc-adm-btn" (click)="copyDetails()">
            Copy details
          </button>
          <button
            type="button"
            class="kc-adm-btn"
            (click)="invoice()"
            [disabled]="busy()"
          >
            Invoice PDF
          </button>
          <a
            class="kc-adm-btn"
            [routerLink]="['/admin/bookings/new']"
            [queryParams]="{ copy: b.id }"
            >Book again</a
          >
        </div>
      </div>

      <!-- next step banner -->
      @if (nextStep(); as n) {
        <div
          class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
          [class]="n.tone"
        >
          <p class="text-sm"><b>Next:</b> {{ n.text }}</p>
          @if (n.action) {
            <button
              type="button"
              class="kc-adm-btn-primary"
              (click)="n.action!()"
            >
              {{ n.button }}
            </button>
          }
        </div>
      }

      <div class="mt-5 grid gap-5 xl:grid-cols-3">
        <div class="flex flex-col gap-5 xl:col-span-2">
          <!-- trip + customer -->
          <section class="kc-adm-card p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs text-kc-muted">
                  {{ typeLabel(b.booking_type) }} · {{ b.car_type }}
                </p>
                <h2 class="text-xl font-semibold">
                  {{ b.pickup_location }} →
                  {{ b.drop_location || b.rental_package || 'Local' }}
                </h2>
                <p class="mt-1 text-sm">
                  <b>{{ day(b.pickup_date) }}, {{ b.pickup_time }}</b> ·
                  {{ b.pickup_address }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-semibold">{{ rs(b.fare) }}</p>
                @if (b.discount_amount) {
                  <p class="text-xs text-emerald-700">
                    {{ rs(b.discount_amount) }} off{{
                      b.coupon_code ? ' · ' + b.coupon_code : ''
                    }}
                  </p>
                }
              </div>
            </div>

            <dl
              class="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-kc-line pt-4 text-sm sm:grid-cols-3"
            >
              @for (f of facts(); track f.k) {
                <div>
                  <dt class="text-xs text-kc-muted">{{ f.k }}</dt>
                  <dd class="font-medium">{{ f.v }}</dd>
                </div>
              }
            </dl>

            <div
              class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-kc-surface p-3"
            >
              <div>
                <p class="font-medium">{{ b.customer_name }}</p>
                @if (val(b.email)) {
                  <p class="text-xs text-kc-muted">{{ b.email }}</p>
                }
              </div>
              <kc-contact [mobile]="b.mobile" [text]="waBookingText()" />
            </div>

            @if (val(b.admin_notes)) {
              <p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm">
                <b>Office note:</b> {{ b.admin_notes }}
              </p>
            }
            @if (b.status === 'cancelled') {
              <p class="mt-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm">
                <b>Cancelled</b> {{ stamp(b.cancelled_at) }}
                @if (b.cancel_reason) {
                  — {{ b.cancel_reason }}
                }
              </p>
            }
            @if (b.status === 'completed') {
              <p class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                <b>Completed</b> {{ stamp(b.completed_at) }} · collected
                {{ rs(b.balance_collected)
                }}{{ b.balance_mode ? ' by ' + b.balance_mode : '' }}
                @if (b.extra_charges) {
                  · extras {{ rs(b.extra_charges)
                  }}{{ b.extra_note ? ' (' + b.extra_note + ')' : '' }}
                }
                @if (b.customer_rating) {
                  · {{ '★'.repeat(b.customer_rating) }}
                }
              </p>
            }

            <div class="mt-4 flex flex-wrap gap-2 border-t border-kc-line pt-4">
              <button type="button" class="kc-adm-btn" (click)="toggle('edit')">
                Edit trip
              </button>
              @if (b.status !== 'completed' && b.status !== 'cancelled') {
                @if (b.status === 'new') {
                  <button
                    type="button"
                    class="kc-adm-btn"
                    (click)="setStatus('confirmed')"
                  >
                    Mark confirmed
                  </button>
                }
                <button
                  type="button"
                  class="kc-adm-btn"
                  (click)="toggle('complete')"
                >
                  Trip completed
                </button>
                <button
                  type="button"
                  class="kc-adm-btn !text-red-700"
                  (click)="toggle('cancel')"
                >
                  Cancel booking
                </button>
              } @else {
                <button
                  type="button"
                  class="kc-adm-btn"
                  (click)="setStatus('confirmed')"
                >
                  Re-open
                </button>
              }
            </div>

            <!-- panels -->
            @switch (panel()) {
              @case ('edit') {
                <div
                  class="mt-4 grid gap-3 rounded-xl border border-kc-line p-4 sm:grid-cols-2"
                >
                  <label class="text-sm"
                    ><span class="kc-adm-label">Pickup date</span
                    ><input
                      class="kc-adm-input w-full"
                      type="date"
                      [(ngModel)]="edit.pickup_date"
                  /></label>
                  <label class="text-sm"
                    ><span class="kc-adm-label">Pickup time</span
                    ><input
                      class="kc-adm-input w-full"
                      [(ngModel)]="edit.pickup_time"
                      placeholder="6:30 PM"
                  /></label>
                  <label class="text-sm sm:col-span-2"
                    ><span class="kc-adm-label">Pickup address</span
                    ><input
                      class="kc-adm-input w-full"
                      [(ngModel)]="edit.pickup_address"
                  /></label>
                  <label class="text-sm"
                    ><span class="kc-adm-label">Name</span
                    ><input
                      class="kc-adm-input w-full"
                      [(ngModel)]="edit.customer_name"
                  /></label>
                  <label class="text-sm"
                    ><span class="kc-adm-label">Email</span
                    ><input
                      class="kc-adm-input w-full"
                      [(ngModel)]="edit.email"
                  /></label>
                  <label class="text-sm"
                    ><span class="kc-adm-label">Fare (₹)</span
                    ><input
                      class="kc-adm-input w-full"
                      type="number"
                      min="0"
                      [(ngModel)]="edit.fare"
                  /></label>
                  <label class="text-sm"
                    ><span class="kc-adm-label">Passengers</span
                    ><input
                      class="kc-adm-input w-full"
                      type="number"
                      min="1"
                      max="20"
                      [(ngModel)]="edit.passengers"
                  /></label>
                  <label class="text-sm sm:col-span-2"
                    ><span class="kc-adm-label">Office note</span
                    ><textarea
                      class="kc-adm-input w-full"
                      rows="2"
                      [(ngModel)]="edit.admin_notes"
                    ></textarea>
                  </label>
                  <div class="flex gap-2 sm:col-span-2">
                    <button
                      type="button"
                      class="kc-adm-btn-primary"
                      (click)="saveEdit()"
                      [disabled]="busy()"
                    >
                      Save changes</button
                    ><button
                      type="button"
                      class="kc-adm-btn"
                      (click)="panel.set('')"
                    >
                      Close
                    </button>
                  </div>
                </div>
              }
              @case ('complete') {
                <div
                  class="mt-4 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:grid-cols-2"
                >
                  <p class="text-sm sm:col-span-2">
                    Balance due from customer:
                    <b>{{ rs(balanceDue()) }}</b> (fare {{ rs(b.fare) }} −
                    advance paid {{ rs(paid()) }})
                  </p>
                  <label class="text-sm"
                    ><span class="kc-adm-label"
                      >Amount collected by driver (₹)</span
                    ><input
                      class="kc-adm-input w-full"
                      type="number"
                      min="0"
                      [(ngModel)]="done.collected"
                  /></label>
                  <label class="text-sm"
                    ><span class="kc-adm-label">How</span>
                    <select class="kc-adm-input w-full" [(ngModel)]="done.mode">
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank transfer</option>
                    </select>
                  </label>
                  <label class="text-sm"
                    ><span class="kc-adm-label"
                      >Extra charges (₹) — toll, parking, extra km</span
                    ><input
                      class="kc-adm-input w-full"
                      type="number"
                      min="0"
                      [(ngModel)]="done.extra"
                  /></label>
                  <label class="text-sm"
                    ><span class="kc-adm-label">Extra charges note</span
                    ><input
                      class="kc-adm-input w-full"
                      [(ngModel)]="done.extraNote"
                  /></label>
                  <label class="text-sm"
                    ><span class="kc-adm-label">Customer rating</span>
                    <select
                      class="kc-adm-input w-full"
                      [(ngModel)]="done.rating"
                    >
                      <option [ngValue]="null">Not asked</option>
                      @for (r of [5, 4, 3, 2, 1]; track r) {
                        <option [ngValue]="r">{{ '★'.repeat(r) }}</option>
                      }
                    </select>
                  </label>
                  <label class="text-sm"
                    ><span class="kc-adm-label">Feedback</span
                    ><input
                      class="kc-adm-input w-full"
                      [(ngModel)]="done.feedback"
                  /></label>
                  <div class="flex gap-2 sm:col-span-2">
                    <button
                      type="button"
                      class="kc-adm-btn-primary"
                      (click)="complete()"
                      [disabled]="busy()"
                    >
                      Mark trip completed</button
                    ><button
                      type="button"
                      class="kc-adm-btn"
                      (click)="panel.set('')"
                    >
                      Close
                    </button>
                  </div>
                </div>
              }
              @case ('cancel') {
                <div
                  class="mt-4 rounded-xl border border-red-200 bg-red-50/40 p-4"
                >
                  <p class="kc-adm-label">Why is it cancelled?</p>
                  <div class="flex flex-wrap gap-1.5">
                    @for (r of cancelReasons; track r) {
                      <button
                        type="button"
                        class="kc-adm-btn !py-1 text-xs"
                        [class.!bg-red-700]="cancelReason === r"
                        [class.!text-white]="cancelReason === r"
                        (click)="cancelReason = r"
                      >
                        {{ r }}
                      </button>
                    }
                  </div>
                  <input
                    class="kc-adm-input mt-2 w-full"
                    [(ngModel)]="cancelReason"
                    placeholder="Or type the reason"
                  />
                  @if (paid() > 0) {
                    <p class="mt-2 text-sm text-red-800">
                      Advance of {{ rs(paid()) }} was paid — refund it from
                      Razorpay if the policy allows.
                    </p>
                  }
                  <div class="mt-3 flex gap-2">
                    <button
                      type="button"
                      class="kc-adm-btn-primary !bg-red-700"
                      (click)="cancel()"
                      [disabled]="busy() || !cancelReason.trim()"
                    >
                      Cancel booking</button
                    ><button
                      type="button"
                      class="kc-adm-btn"
                      (click)="panel.set('')"
                    >
                      Keep it
                    </button>
                  </div>
                </div>
              }
            }
          </section>

          <!-- activity -->
          <section class="kc-adm-card p-5">
            <h2 class="font-semibold">Timeline</h2>
            <ol class="mt-3 border-l-2 border-kc-line pl-4">
              @for (a of activity(); track a.id) {
                <li class="relative pb-3 text-sm">
                  <span
                    class="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-kc-teal"
                  ></span>
                  <p>
                    <b>{{ actionLabel(a.action) }}</b>
                    @if (a.detail) {
                      — {{ a.detail }}
                    }
                  </p>
                  <p class="text-xs text-kc-muted">
                    {{ stamp(a.created_at) }} · {{ a.actor_name }}
                  </p>
                </li>
              } @empty {
                <li class="text-sm text-kc-muted">No activity yet.</li>
              }
            </ol>
            <div class="mt-2 flex gap-2">
              <input
                class="kc-adm-input flex-1"
                [(ngModel)]="newNote"
                placeholder="Add a note to the timeline…"
                (keydown.enter)="addNote()"
              />
              <button
                type="button"
                class="kc-adm-btn"
                (click)="addNote()"
                [disabled]="!newNote.trim()"
              >
                Add
              </button>
            </div>
          </section>
        </div>

        <!-- right column -->
        <div class="flex flex-col gap-5">
          <section class="kc-adm-card p-5">
            <h2 class="font-semibold">Driver and car</h2>
            @if (b.driver_id && currentDriver(); as d) {
              <div class="mt-3 rounded-lg bg-kc-surface p-3">
                <p class="font-medium">{{ d.full_name }}</p>
                <p class="text-xs text-kc-muted">
                  {{ currentCar()?.registration_no || 'No car chosen' }} ·
                  {{ currentCar()?.model || currentCar()?.car_type || '' }}
                </p>
                <div class="mt-2">
                  <kc-contact [mobile]="d.mobile" [text]="tripForDriver()" />
                </div>
              </div>
              <button
                type="button"
                class="kc-adm-btn-primary mt-3 w-full"
                (click)="resend('driver-whatsapp')"
                [disabled]="busy()"
              >
                Send driver details to customer
              </button>
            }
            <label class="mt-3 block text-sm"
              ><span class="kc-adm-label">{{
                b.driver_id ? 'Change driver' : 'Driver'
              }}</span>
              <select
                class="kc-adm-input w-full"
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
            <label class="mt-2 block text-sm"
              ><span class="kc-adm-label">Car</span>
              <select class="kc-adm-input w-full" [(ngModel)]="vehicleId">
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
                @if (db.isAdmin()) {
                  <a
                    routerLink="/admin/drivers"
                    class="text-kc-teal hover:underline"
                    >Add drivers</a
                  >
                }
              </p>
            }
            <button
              type="button"
              class="kc-adm-btn mt-3 w-full"
              (click)="assign()"
              [disabled]="
                busy() ||
                (driverId === b.driver_id && vehicleId === b.vehicle_id)
              "
            >
              Save driver
            </button>
          </section>

          <section class="kc-adm-card p-5">
            <h2 class="font-semibold">Payment</h2>
            <dl class="mt-3 space-y-1.5 text-sm">
              <div class="flex justify-between">
                <dt class="text-kc-muted">Fare</dt>
                <dd>{{ rs(b.fare) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-kc-muted">
                  Advance asked ({{ b.advance_percent ?? '-' }}%)
                </dt>
                <dd>{{ rs(b.advance_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-kc-muted">Advance paid online</dt>
                <dd class="font-medium" [class.text-emerald-700]="paid() > 0">
                  {{ rs(paid()) }}
                </dd>
              </div>
              <div class="flex justify-between border-t border-kc-line pt-1.5">
                <dt>Balance to collect</dt>
                <dd class="font-semibold">{{ rs(balanceDue()) }}</dd>
              </div>
            </dl>
            <ul class="mt-3 space-y-2 text-sm">
              @for (p of payments(); track p.id) {
                <li class="rounded-lg border border-kc-line p-2">
                  <div class="flex items-center justify-between">
                    <kc-badge [value]="p.status" /><span>{{
                      rs(p.amount_paid ?? p.advance_amount)
                    }}</span>
                  </div>
                  <p class="mt-1 text-xs text-kc-muted">
                    Link {{ p.attempt }} · {{ ago(p.created_at) }}
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
                    <div class="mt-1 flex gap-3 text-xs font-medium">
                      <button
                        type="button"
                        class="text-kc-teal hover:underline"
                        (click)="copy(p.payment_link, 'Pay link copied')"
                      >
                        Copy link
                      </button>
                      <a
                        class="text-kc-teal hover:underline"
                        [href]="waPayLink(p.payment_link)"
                        target="_blank"
                        rel="noopener"
                        >Send on my WhatsApp</a
                      >
                    </div>
                  }
                </li>
              } @empty {
                <li class="text-kc-muted">No payment link yet.</li>
              }
            </ul>
            <div class="mt-3 grid gap-2">
              @if (paid() === 0 && b.status !== 'cancelled') {
                <button
                  type="button"
                  class="kc-adm-btn-primary"
                  (click)="resend('new-payment-link')"
                  [disabled]="busy()"
                >
                  {{
                    payments().length
                      ? 'New payment link + WhatsApp'
                      : 'Create payment link + WhatsApp'
                  }}
                </button>
              }
              @if (latestPayment()?.status === 'PENDING') {
                <button
                  type="button"
                  class="kc-adm-btn"
                  (click)="resend('customer-whatsapp')"
                  [disabled]="busy()"
                >
                  Resend booking WhatsApp
                </button>
              }
              <button
                type="button"
                class="kc-adm-btn"
                (click)="resend('admin-whatsapp')"
                [disabled]="busy()"
              >
                Resend admin alert
              </button>
            </div>
          </section>
        </div>
      </div>
    } @else {
      <p class="mt-6 text-kc-muted">{{ error() || 'Loading…' }}</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingDetailComponent implements OnInit {
  readonly id = input.required<string>();

  protected readonly db = inject(AdminDbService);
  private readonly toast = inject(ToastService);
  private readonly site = inject(SiteSettingsService);

  protected readonly rs = rs;
  protected readonly stamp = stamp;
  protected readonly day = day;
  protected readonly ago = ago;
  protected readonly val = val;
  protected readonly typeLabel = typeLabel;
  protected readonly cancelReasons = [
    'Customer changed plan',
    'Booked another cab',
    'Price too high',
    'No driver available',
    'Customer not reachable',
    'Duplicate booking',
  ];

  protected readonly b = signal<Booking | null>(null);
  protected readonly payments = signal<Payment[]>([]);
  protected readonly activity = signal<Activity[]>([]);
  protected readonly drivers = signal<Driver[]>([]);
  protected readonly allVehicles = signal<Vehicle[]>([]);
  protected readonly handledName = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly panel = signal<Panel>('');

  protected edit: Partial<Booking> = {};
  protected driverId: number | null = null;
  protected vehicleId: number | null = null;
  protected cancelReason = '';
  protected newNote = '';
  protected done = {
    collected: 0,
    mode: 'cash',
    extra: 0,
    extraNote: '',
    rating: null as number | null,
    feedback: '',
  };
  private readonly chosenDriver = signal<number | null>(null);

  protected readonly latestPayment = computed<Payment | null>(
    () => this.payments()[0] ?? null,
  );
  protected readonly paid = computed(() =>
    this.payments()
      .filter((p) => p.status === 'PAID')
      .reduce((s, p) => s + (p.amount_paid ?? p.advance_amount), 0),
  );
  protected readonly balanceDue = computed(() =>
    Math.max(0, (this.b()?.fare ?? 0) - this.paid()),
  );
  protected readonly currentDriver = computed(
    () => this.drivers().find((d) => d.id === this.b()?.driver_id) ?? null,
  );
  protected readonly currentCar = computed(
    () => this.allVehicles().find((v) => v.id === this.b()?.vehicle_id) ?? null,
  );
  protected readonly vehicles = computed(() => {
    const d = this.chosenDriver();
    return [...this.allVehicles()].sort(
      (a, b) => Number(b.driver_id === d) - Number(a.driver_id === d),
    );
  });

  /** Only facts that have a value — no empty boxes. */
  protected readonly facts = computed(() => {
    const b = this.b();
    if (!b) return [];
    const rows: { k: string; v: string | null }[] = [
      { k: 'Passengers', v: String(b.passengers) },
      { k: 'Distance', v: b.distance_km ? `${b.distance_km} km` : null },
      {
        k: 'Waiting time',
        v: b.booking_type === 'round-trip' ? val(b.waiting_time) : null,
      },
      {
        k: 'Total km (round trip)',
        v: b.approx_distance_km ? `${b.approx_distance_km} km` : null,
      },
      {
        k: 'Package',
        v: b.booking_type === 'local-rental' ? val(b.rental_package) : null,
      },
      {
        k: 'Invoice no.',
        v: `INV${(b.id + 5125).toString().padStart(6, '0')}`,
      },
      { k: 'Lead', v: b.enquiry_id ? `#${b.enquiry_id}` : null },
    ];
    return rows.filter((r): r is { k: string; v: string } => !!r.v);
  });

  /** What the office should do next on this booking. */
  protected readonly nextStep = computed(() => {
    const b = this.b();
    if (!b || b.status === 'cancelled' || b.status === 'completed') return null;
    const p = this.latestPayment();
    if (!p && this.paid() === 0 && (b.advance_amount ?? 0) > 0)
      return {
        text: 'No payment link yet. Send one so the customer can pay the advance.',
        button: 'Create payment link',
        action: () => this.resend('new-payment-link'),
        tone: 'border-amber-300 bg-amber-50',
      };
    if (p?.status === 'PENDING')
      return {
        text: `Advance of ${rs(p.advance_amount)} not paid yet (link sent ${ago(p.created_at)}). Call the customer to confirm.`,
        button: '',
        action: null,
        tone: 'border-amber-300 bg-amber-50',
      };
    if (!b.driver_id)
      return {
        text: 'Assign a driver and car (right side).',
        button: '',
        action: null,
        tone: 'border-sky-300 bg-sky-50',
      };
    if (b.pickup_date < new Date().toISOString().slice(0, 10))
      return {
        text: 'Pickup date has passed. Mark the trip completed and note the amount collected.',
        button: 'Trip completed',
        action: () => this.toggle('complete'),
        tone: 'border-emerald-300 bg-emerald-50',
      };
    return null;
  });

  ngOnInit(): void {
    void this.load();
  }

  private get bookingId(): number {
    return Number(this.id());
  }

  protected actionLabel(a: string): string {
    return ACTION_LABEL[a] ?? a;
  }

  protected async load(): Promise<void> {
    const db = await this.db.db();
    const [b, p, a, d, v] = await Promise.all([
      db.from('bookings').select('*').eq('id', this.bookingId).maybeSingle(),
      db
        .from('booking_payments')
        .select(
          'id,status,advance_amount,amount_paid,payment_link,razorpay_payment_id,attempt,paid_at,created_at',
        )
        .eq('booking_id', this.bookingId)
        .order('created_at', { ascending: false }),
      db
        .from('admin_activity')
        .select('id,action,detail,actor_name,created_at')
        .eq('entity', 'booking')
        .eq('entity_id', String(this.bookingId))
        .order('created_at', { ascending: false }),
      db
        .from('drivers')
        .select('id,full_name,mobile')
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
    this.edit = {
      pickup_date: booking.pickup_date,
      pickup_time: booking.pickup_time,
      pickup_address: booking.pickup_address,
      customer_name: booking.customer_name,
      email: booking.email,
      fare: booking.fare,
      passengers: booking.passengers,
      admin_notes: booking.admin_notes,
    };
    this.driverId = booking.driver_id;
    this.vehicleId = booking.vehicle_id;
    this.chosenDriver.set(booking.driver_id);
    this.payments.set((p.data ?? []) as Payment[]);
    this.activity.set((a.data ?? []) as Activity[]);
    this.drivers.set((d.data ?? []) as Driver[]);
    this.allVehicles.set((v.data ?? []) as Vehicle[]);
    this.done = {
      ...this.done,
      collected: Math.max(0, booking.fare - this.paid()),
    };
    if (booking.handled_by) {
      const { data } = await db
        .from('admin_staff')
        .select('full_name,email')
        .eq('id', booking.handled_by)
        .maybeSingle();
      this.handledName.set(data ? data.full_name || data.email : '');
    } else this.handledName.set('');
    this.b.set(booking);
  }

  private async update(
    patch: Record<string, unknown>,
    success: string,
  ): Promise<boolean> {
    this.busy.set(true);
    const okay = await this.toast.run(
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
    if (okay) {
      this.panel.set('');
      await this.load();
    }
    this.busy.set(false);
    return okay;
  }

  protected toggle(p: Panel): void {
    this.panel.set(this.panel() === p ? '' : p);
  }

  protected takeOver(): void {
    void this.update(
      { handled_by: this.db.userId() },
      'You now handle this booking',
    );
  }

  protected saveEdit(): void {
    const e = this.edit;
    if (
      !e.pickup_date ||
      !e.pickup_time?.trim() ||
      !e.pickup_address?.trim() ||
      !(Number(e.fare) > 0) ||
      !e.customer_name?.trim()
    ) {
      this.toast.error('Name, date, time, address and fare are required.');
      return;
    }
    void this.update(
      {
        pickup_date: e.pickup_date,
        pickup_time: e.pickup_time.trim(),
        pickup_address: e.pickup_address.trim(),
        customer_name: e.customer_name.trim(),
        email: e.email?.trim() || null,
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
    const patch: Record<string, unknown> = { status };
    if (status === 'confirmed')
      Object.assign(patch, {
        cancel_reason: null,
        cancelled_at: null,
        completed_at: null,
      });
    void this.update(patch, `Marked ${status}`);
  }

  protected cancel(): void {
    void this.update(
      {
        status: 'cancelled',
        cancel_reason: this.cancelReason.trim(),
        cancelled_at: new Date().toISOString(),
      },
      'Booking cancelled',
    );
  }

  protected complete(): void {
    const d = this.done;
    if (!(Number(d.collected) >= 0)) {
      this.toast.error('Enter the amount collected (0 if none).');
      return;
    }
    void this.update(
      {
        status: 'completed',
        completed_at: new Date().toISOString(),
        balance_collected: Math.round(Number(d.collected)),
        balance_mode: d.mode,
        extra_charges: Math.max(0, Math.round(Number(d.extra) || 0)),
        extra_note: d.extraNote.trim() || null,
        customer_rating: d.rating,
        feedback: d.feedback.trim() || null,
      },
      'Trip completed',
    );
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
      this.driverId
        ? 'Driver assigned — now send the details to the customer'
        : 'Driver removed',
    );
  }

  protected async addNote(): Promise<void> {
    const note = this.newNote.trim();
    if (!note) return;
    const done = await this.toast.run(
      async () =>
        ok(
          await (
            await this.db.db()
          )
            .from('activity_log')
            .insert({
              entity: 'booking',
              entity_id: String(this.bookingId),
              action: 'note',
              detail: note,
              actor_id: this.db.userId(),
            }),
        ),
      'Note added',
    );
    if (done) {
      this.newNote = '';
      await this.load();
    }
  }

  protected async resend(
    action:
      | 'customer-whatsapp'
      | 'admin-whatsapp'
      | 'new-payment-link'
      | 'driver-whatsapp',
  ): Promise<void> {
    if (
      action === 'new-payment-link' &&
      this.payments().length &&
      !confirm('Cancel the old unpaid link and send a new one on WhatsApp?')
    )
      return;
    this.busy.set(true);
    const msg = {
      'customer-whatsapp': 'Booking WhatsApp sent',
      'admin-whatsapp': 'Admin alert sent',
      'new-payment-link': 'Payment link sent',
      'driver-whatsapp': 'Driver details sent to customer',
    }[action];
    const sent = await this.toast.run(
      () => this.db.api('/admin/resend', { bookingId: this.bookingId, action }),
      msg,
    );
    if (sent)
      await (
        await this.db.db()
      )
        .from('activity_log')
        .insert({
          entity: 'booking',
          entity_id: String(this.bookingId),
          action: 'whatsapp',
          detail: msg,
          actor_id: this.db.userId(),
        });
    await this.load();
    this.busy.set(false);
  }

  protected async invoice(): Promise<void> {
    this.busy.set(true);
    const b = this.b()!;
    await this.toast.run(
      () =>
        downloadInvoice(b, {
          advancePaid: this.paid(),
          phone: this.site.contact().phoneDisplay,
          email: this.site.contact().email,
          driver: this.currentDriver()?.full_name ?? null,
          carNumber: this.currentCar()?.registration_no ?? null,
          extraCharges: b.extra_charges,
          discount: b.discount_amount,
          status: b.status,
        }),
      'Invoice downloaded',
    );
    this.busy.set(false);
  }

  protected copy(text: string, msg = 'Copied'): void {
    void navigator.clipboard.writeText(text).then(() => this.toast.ok(msg));
  }

  private tripLine(b: Booking): string {
    return b.booking_type === 'local-rental'
      ? `${b.pickup_location} · ${b.rental_package ?? 'local rental'}`
      : `${b.pickup_location} to ${b.drop_location}`;
  }

  /** Plain text of the booking for pasting anywhere. */
  protected copyDetails(): void {
    const b = this.b()!;
    const d = this.currentDriver();
    const c = this.currentCar();
    const lines = [
      `KiteCab booking #${b.id}`,
      `${typeLabel(b.booking_type)}, ${b.car_type}: ${this.tripLine(b)}`,
      `Pickup: ${day(b.pickup_date)}, ${b.pickup_time}`,
      `Address: ${b.pickup_address}`,
      `Customer: ${b.customer_name}, ${b.mobile}`,
      `Passengers: ${b.passengers}`,
      `Fare: ${rs(b.fare)} · advance paid ${rs(this.paid())} · balance ${rs(this.balanceDue())}`,
      d
        ? `Driver: ${d.full_name}, ${d.mobile}${c ? ` · ${c.registration_no}` : ''}`
        : '',
    ].filter(Boolean);
    this.copy(lines.join('\n'), 'Booking details copied');
  }

  protected waBookingText(): string {
    const b = this.b()!;
    return `Hello ${b.customer_name}, this is KiteCab about your booking #${b.id} (${this.tripLine(b)}, ${day(b.pickup_date)} ${b.pickup_time}).`;
  }

  protected waPayLink(link: string): string {
    const b = this.b()!;
    return waLink(
      b.mobile,
      `Hello ${b.customer_name}, please pay the advance of ${rs(b.advance_amount)} for your KiteCab booking #${b.id} here: ${link}`,
    );
  }

  protected tripForDriver(): string {
    const b = this.b()!;
    return [
      `KiteCab trip #${b.id}`,
      `${typeLabel(b.booking_type)} · ${b.car_type}`,
      this.tripLine(b),
      `Pickup: ${day(b.pickup_date)}, ${b.pickup_time}`,
      `Address: ${b.pickup_address}`,
      `Customer: ${b.customer_name}, ${b.mobile}`,
      `Passengers: ${b.passengers}`,
      `Collect from customer: ${rs(this.balanceDue())}`,
    ].join('\n');
  }
}
