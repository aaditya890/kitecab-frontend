import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminDbService } from '../core/admin-db.service';
import { BOOKING_TYPES, CAR_TYPES, rs, todayIst } from '../core/format';
import { ToastService } from '../core/toast.service';

type BookingType = 'oneway' | 'round-trip' | 'local-rental';
type Car = (typeof CAR_TYPES)[number];

interface RouteFare {
  id: number;
  drop: string;
  distance_km: number;
  hatchback_price: number;
  sedan_price: number;
  suv_price: number;
}
interface Rental {
  id: number;
  hours: number;
  km: number;
  hatchback_price: number;
  sedan_price: number;
  suv_price: number;
}
interface RoundTrip {
  waiting_slot: string;
  hatchback_per_km: number;
  sedan_per_km: number;
  suv_per_km: number;
  hatchback_base: number;
  sedan_base: number;
  suv_base: number;
}

const key = (car: Car) => car.toLowerCase() as 'hatchback' | 'sedan' | 'suv';

/** 'HH:mm' → '6:30 PM' (the format every message and old record uses). */
function to12h(v: string): string {
  const [h, m] = v.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

@Component({
  selector: 'kc-admin-booking-new',
  imports: [FormsModule, RouterLink],
  template: `
    <a routerLink="/admin/bookings" class="text-sm text-kc-teal hover:underline">← All bookings</a>
    <h1 class="kc-adm-h1 mt-2">New booking</h1>
    <p class="text-sm text-kc-muted">
      For phone, WhatsApp and walk-in customers. The fare comes from your price list; change it only if you agreed a
      different price.
    </p>

    <form class="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]" (ngSubmit)="save()">
      <div class="flex flex-col gap-5">
        <!-- trip -->
        <section class="kc-adm-card p-5">
          <h2 class="font-semibold">1. Trip</h2>
          <div
            class="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-kc-surface p-1"
            role="radiogroup"
            aria-label="Trip type"
          >
            @for (t of types; track t.value) {
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="type() === t.value"
                (click)="setType(t.value)"
                class="h-10 rounded-lg text-sm font-semibold"
                [class]="type() === t.value ? 'bg-kc-teal text-white' : 'hover:bg-white'"
              >
                {{ t.label }}
              </button>
            }
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <label class="text-sm"
              ><span class="kc-adm-label">Pickup city *</span>
              <input
                class="kc-adm-input w-full"
                name="pickup"
                list="kc-places"
                [ngModel]="pickup()"
                (ngModelChange)="setPickup($event)"
                placeholder="Type to search"
                autocomplete="off"
              />
            </label>
            @if (type() === 'local-rental') {
              <label class="text-sm"
                ><span class="kc-adm-label">Package *</span>
                <select
                  class="kc-adm-input w-full"
                  name="rental"
                  [ngModel]="rentalId()"
                  (ngModelChange)="rentalId.set(+$event)"
                >
                  <option [ngValue]="0">Choose</option>
                  @for (r of rentals(); track r.id) {
                    <option [ngValue]="r.id">{{ r.hours }} hours · {{ r.km }} km</option>
                  }
                </select>
              </label>
            } @else {
              <label class="text-sm"
                ><span class="kc-adm-label">Drop city *</span>
                <input
                  class="kc-adm-input w-full"
                  name="drop"
                  list="kc-drops"
                  [ngModel]="drop()"
                  (ngModelChange)="drop.set($event)"
                  [placeholder]="drops().length ? drops().length + ' places from ' + pickup() : 'Choose pickup first'"
                  autocomplete="off"
                />
              </label>
            }
            @if (type() === 'round-trip') {
              <label class="text-sm"
                ><span class="kc-adm-label">Waiting time *</span>
                <select
                  class="kc-adm-input w-full"
                  name="wait"
                  [ngModel]="waiting()"
                  (ngModelChange)="waiting.set($event)"
                >
                  <option value="">Choose</option>
                  @for (r of roundTrip(); track r.waiting_slot) {
                    <option [value]="r.waiting_slot">
                      {{ r.waiting_slot }}
                    </option>
                  }
                </select>
              </label>
              <label class="text-sm"
                ><span class="kc-adm-label">Total km, up and down *</span>
                <input
                  class="kc-adm-input w-full"
                  name="km"
                  type="number"
                  min="1"
                  [ngModel]="approxKm()"
                  (ngModelChange)="approxKm.set(+$event)"
                  [placeholder]="route() ? 'one way is ' + route()!.distance_km + ' km' : ''"
                />
              </label>
            }
          </div>
          <datalist id="kc-places">
            @for (p of places(); track p) {
              <option [value]="p"></option>
            }
          </datalist>
          <datalist id="kc-drops">
            @for (r of drops(); track r.id) {
              <option [value]="r.drop"></option>
            }
          </datalist>
          @if (pickup() && type() !== 'local-rental' && drop() && !route()) {
            <p class="mt-2 text-sm text-red-700">
              No price for {{ pickup() }} → {{ drop() }}. Add it in Routes and fares, or type the fare yourself below.
            </p>
          }

          <p class="kc-adm-label mt-4">Car *</p>
          <div class="grid grid-cols-3 gap-2">
            @for (c of cars; track c) {
              <button
                type="button"
                (click)="car.set(c)"
                class="rounded-xl border p-3 text-left"
                [class]="
                  car() === c ? 'border-kc-teal bg-kc-teal/5 ring-2 ring-kc-teal' : 'border-kc-line hover:bg-kc-surface'
                "
              >
                <span class="block text-sm font-semibold">{{ c }}</span>
                <span class="block text-lg font-semibold">{{ priceFor(c) ? rs(priceFor(c)) : '—' }}</span>
              </button>
            }
          </div>
        </section>

        <!-- customer -->
        <section class="kc-adm-card p-5">
          <h2 class="font-semibold">2. Customer</h2>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="text-sm"
              ><span class="kc-adm-label">Mobile *</span>
              <input
                class="kc-adm-input w-full"
                name="mobile"
                inputmode="numeric"
                maxlength="10"
                [ngModel]="mobile()"
                (ngModelChange)="setMobile($event)"
              />
              @if (known()) {
                <span class="mt-1 block text-xs text-emerald-700"
                  >★ Returning customer · {{ known()!.bookings }} past booking(s)</span
                >
              }
            </label>
            <label class="text-sm"
              ><span class="kc-adm-label">Name *</span
              ><input class="kc-adm-input w-full" name="name" [(ngModel)]="name"
            /></label>
            <label class="text-sm"
              ><span class="kc-adm-label">Email (for invoice)</span
              ><input class="kc-adm-input w-full" name="email" type="email" [(ngModel)]="email"
            /></label>
            <label class="text-sm"
              ><span class="kc-adm-label">Passengers</span
              ><input class="kc-adm-input w-full" name="pax" type="number" min="1" max="20" [(ngModel)]="passengers"
            /></label>
          </div>
        </section>

        <!-- pickup -->
        <section class="kc-adm-card p-5">
          <h2 class="font-semibold">3. Pickup</h2>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <label class="text-sm"
              ><span class="kc-adm-label">Date *</span
              ><input class="kc-adm-input w-full" name="date" type="date" [min]="today" [(ngModel)]="date"
            /></label>
            <label class="text-sm"
              ><span class="kc-adm-label">Time *</span
              ><input class="kc-adm-input w-full" name="time" type="time" [(ngModel)]="time"
            /></label>
            <label class="text-sm"
              ><span class="kc-adm-label">Booking came from</span>
              <select class="kc-adm-input w-full" name="src" [(ngModel)]="source">
                <option value="phone">Phone call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="walk_in">Walk-in</option>
                <option value="repeat">Repeat customer</option>
                <option value="website">Website</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label class="text-sm sm:col-span-3"
              ><span class="kc-adm-label">Pickup address *</span
              ><input
                class="kc-adm-input w-full"
                name="addr"
                [(ngModel)]="address"
                placeholder="House / landmark / area"
            /></label>
            <label class="text-sm sm:col-span-3"
              ><span class="kc-adm-label">Office note (only staff see this)</span
              ><input class="kc-adm-input w-full" name="note" [(ngModel)]="note"
            /></label>
          </div>
        </section>
      </div>

      <!-- summary -->
      <aside class="kc-adm-card h-fit p-5 xl:sticky xl:top-4">
        <h2 class="font-semibold">Summary</h2>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-kc-muted">Trip</dt>
            <dd class="text-right">{{ summary() }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-kc-muted">Price list fare</dt>
            <dd>{{ listFare() ? rs(listFare()) : '—' }}</dd>
          </div>
        </dl>
        <label class="mt-3 block text-sm"
          ><span class="kc-adm-label">Final fare (₹) *</span>
          <input
            class="kc-adm-input w-full text-lg font-semibold"
            name="fare"
            type="number"
            min="0"
            [ngModel]="fare()"
            (ngModelChange)="fareOverride.set($event === '' || $event === null ? null : +$event)"
          />
        </label>
        @if (discount() > 0) {
          <p class="mt-1 text-xs text-emerald-700">₹{{ discount() }} less than the price list</p>
        }
        @if (discount() < 0) {
          <p class="mt-1 text-xs text-amber-700">₹{{ -discount() }} more than the price list</p>
        }
        <div class="mt-3 flex justify-between text-sm">
          <span class="text-kc-muted">Advance ({{ advancePct() }}%)</span><b>{{ rs(advance()) }}</b>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-kc-muted">Balance to driver</span><b>{{ rs(fare() - advance()) }}</b>
        </div>

        @if (errors().length && tried()) {
          <ul class="mt-3 list-disc rounded-lg bg-red-50 py-2 pr-2 pl-6 text-sm text-red-800">
            @for (e of errors(); track e) {
              <li>{{ e }}</li>
            }
          </ul>
        }
        <button class="kc-adm-btn-primary mt-4 w-full !py-3" type="submit" [disabled]="saving()">
          {{ saving() ? 'Saving…' : 'Create booking' }}
        </button>
        <p class="mt-2 text-xs text-kc-muted">
          After saving you can send the payment link and booking details on WhatsApp from the booking page.
        </p>
      </aside>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingNewComponent implements OnInit {
  // pre-fill from a lead: /admin/bookings/new?enquiry=12&pickup=Raipur&drop=Bilaspur&mobile=...
  readonly enquiryParam = input('', { alias: 'enquiry' });
  readonly typeParam = input('', { alias: 'type' });
  readonly pickupParam = input('', { alias: 'pickup' });
  readonly dropParam = input('', { alias: 'drop' });
  readonly mobileParam = input('', { alias: 'mobile' });
  readonly nameParam = input('', { alias: 'name' });
  readonly copyParam = input('', { alias: 'copy' });

  private readonly db = inject(AdminDbService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly types = BOOKING_TYPES;
  protected readonly cars = CAR_TYPES;
  protected readonly rs = rs;
  protected readonly today = todayIst();

  protected readonly type = signal<BookingType>('oneway');
  protected readonly pickup = signal('');
  protected readonly drop = signal('');
  protected readonly rentalId = signal(0);
  protected readonly waiting = signal('');
  protected readonly approxKm = signal(0);
  protected readonly car = signal<Car>('Sedan');
  protected readonly mobile = signal('');
  protected readonly fareOverride = signal<number | null>(null);
  protected readonly advancePct = signal(20);
  protected readonly saving = signal(false);
  protected readonly tried = signal(false);

  protected readonly places = signal<string[]>([]);
  protected readonly drops = signal<RouteFare[]>([]);
  protected readonly rentals = signal<Rental[]>([]);
  protected readonly roundTrip = signal<RoundTrip[]>([]);
  protected readonly known = signal<{ id: number; bookings: number } | null>(null);

  protected name = '';
  protected email = '';
  protected passengers = 1;
  protected date = '';
  protected time = '';
  protected address = '';
  protected source = 'phone';
  protected note = '';

  protected readonly route = computed(() => this.drops().find((r) => r.drop === this.drop()) ?? null);
  protected readonly rental = computed(() => this.rentals().find((r) => r.id === this.rentalId()) ?? null);

  protected priceFor(c: Car): number {
    const k = key(c);
    const t = this.type();
    if (t === 'local-rental') return this.rental()?.[`${k}_price`] ?? 0;
    if (t === 'oneway') return this.route()?.[`${k}_price`] ?? 0;
    const r = this.roundTrip().find((x) => x.waiting_slot === this.waiting());
    return r && this.approxKm() > 0 ? r[`${k}_per_km`] * this.approxKm() + r[`${k}_base`] : 0;
  }

  protected readonly listFare = computed(() => {
    // depend on every signal priceFor reads
    this.type();
    this.route();
    this.rental();
    this.waiting();
    this.approxKm();
    this.roundTrip();
    return this.priceFor(this.car());
  });
  protected readonly fare = computed(() => this.fareOverride() ?? this.listFare());
  protected readonly discount = computed(() => (this.fareOverride() === null ? 0 : this.listFare() - this.fare()));
  protected readonly advance = computed(() => Math.round((this.fare() * this.advancePct()) / 100));

  protected readonly summary = computed(() => {
    const t = this.types.find((x) => x.value === this.type())?.label;
    const where =
      this.type() === 'local-rental'
        ? `${this.pickup()} · ${this.rental() ? this.rental()!.hours + 'h ' + this.rental()!.km + 'km' : '…'}`
        : `${this.pickup() || '…'} → ${this.drop() || '…'}`;
    return `${t}, ${this.car()} · ${where}`;
  });

  protected readonly errors = computed(() => {
    const e: string[] = [];
    if (!this.places().includes(this.pickup())) e.push('Choose the pickup city from the list');
    if (this.type() !== 'local-rental' && !this.drop().trim()) e.push('Enter the drop city');
    if (this.type() === 'local-rental' && !this.rental()) e.push('Choose a rental package');
    if (this.type() === 'round-trip' && (!this.waiting() || !(this.approxKm() > 0)))
      e.push('Choose waiting time and total km');
    if (!/^[6-9]\d{9}$/.test(this.mobile())) e.push('Enter a valid 10-digit mobile');
    if (!(this.fare() > 0)) e.push('Fare must be more than 0');
    return e;
  });

  async ngOnInit(): Promise<void> {
    const db = await this.db.db();
    const [p, r, t, s] = await Promise.all([
      db.from('locations').select('name').eq('is_active', true).order('name'),
      db
        .from('rental_packages')
        .select('id,hours,km,hatchback_price,sedan_price,suv_price')
        .eq('is_active', true)
        .order('hours'),
      db.from('round_trip_rates').select('*').eq('is_active', true).order('sort_order'),
      db.from('settings').select('value').eq('key', 'advance_percent').maybeSingle(),
    ]);
    this.places.set((p.data ?? []).map((x) => x.name as string));
    this.rentals.set((r.data ?? []) as Rental[]);
    this.roundTrip.set((t.data ?? []) as RoundTrip[]);
    if (s.data) this.advancePct.set(Number(s.data.value));

    if (this.copyParam()) await this.copyFrom(Number(this.copyParam()));
    else {
      const ty = this.typeParam() as BookingType;
      if (['oneway', 'round-trip', 'local-rental'].includes(ty)) this.type.set(ty);
      if (this.pickupParam()) await this.setPickup(this.pickupParam());
      if (this.dropParam()) this.drop.set(this.dropParam());
      if (this.nameParam()) this.name = this.nameParam();
      if (this.mobileParam()) await this.setMobile(this.mobileParam());
      if (this.enquiryParam()) this.source = 'phone';
    }
  }

  /** "Book again": same trip and customer, new date. */
  private async copyFrom(id: number): Promise<void> {
    const { data: b } = await (await this.db.db()).from('bookings').select('*').eq('id', id).maybeSingle();
    if (!b) return;
    this.type.set(b.booking_type);
    await this.setPickup(b.pickup_location);
    this.drop.set(b.drop_location ?? '');
    this.rentalId.set(b.rental_package_id ?? 0);
    this.waiting.set(b.waiting_time ?? '');
    this.approxKm.set(b.approx_distance_km ?? 0);
    this.car.set(b.car_type);
    this.name = b.customer_name;
    this.email = b.email ?? '';
    this.passengers = b.passengers;
    this.address = b.pickup_address;
    this.source = 'repeat';
    await this.setMobile(b.mobile);
  }

  protected setType(t: BookingType): void {
    this.type.set(t);
    this.fareOverride.set(null);
  }

  protected async setPickup(v: string): Promise<void> {
    this.pickup.set(v);
    this.fareOverride.set(null);
    if (!this.places().includes(v)) {
      this.drops.set([]);
      return;
    }
    const { data } = await (
      await this.db.db()
    )
      .from('route_fares')
      .select('id,drop,distance_km,hatchback_price,sedan_price,suv_price')
      .eq('pickup', v)
      .order('drop');
    if (this.pickup() === v) this.drops.set((data ?? []) as RouteFare[]);
  }

  protected async setMobile(v: string): Promise<void> {
    const m = String(v ?? '')
      .replace(/\D/g, '')
      .slice(-10);
    this.mobile.set(m);
    this.known.set(null);
    if (m.length !== 10) return;
    const { data } = await (
      await this.db.db()
    )
      .from('admin_customers')
      .select('id,full_name,email,bookings')
      .eq('mobile', m)
      .maybeSingle();
    if (data && this.mobile() === m) {
      this.known.set({ id: data.id, bookings: data.bookings });
      if (!this.name) this.name = data.full_name;
      if (!this.email && data.email) this.email = data.email;
    }
  }

  protected async save(): Promise<void> {
    this.tried.set(true);
    const missing = [...this.errors()];
    if (this.name.trim().length < 2) missing.push('Enter the customer name');
    if (!this.date || this.date < this.today) missing.push('Choose today or a later date');
    if (!this.time) missing.push('Choose the pickup time');
    if (this.address.trim().length < 3) missing.push('Enter the pickup address');
    if (missing.length) {
      this.toast.error(missing[0]);
      return;
    }
    this.saving.set(true);
    const db = await this.db.db();
    const t = this.type();
    const rental = this.rental();
    const route = this.route();
    try {
      const cust = await db
        .from('customers')
        .upsert(
          {
            full_name: this.name.trim(),
            mobile: this.mobile(),
            email: this.email.trim() || null,
          },
          { onConflict: 'mobile' },
        )
        .select('id')
        .single();
      if (cust.error) throw new Error(cust.error.message);
      const res = await db
        .from('bookings')
        .insert({
          booking_type: t,
          car_type: this.car(),
          pickup_location: this.pickup(),
          drop_location: t === 'local-rental' ? null : this.drop().trim(),
          route_id: t === 'local-rental' ? null : (route?.id ?? null),
          rental_package_id: rental?.id ?? null,
          rental_package: rental ? `${rental.hours}hour ${rental.km}km` : null,
          waiting_time: t === 'round-trip' ? this.waiting() : null,
          approx_distance_km: t === 'round-trip' ? this.approxKm() : null,
          distance_km: t === 'local-rental' ? (rental?.km ?? null) : (route?.distance_km ?? null),
          fare: Math.round(this.fare()),
          fare_before_discount: this.discount() > 0 ? this.listFare() : null,
          discount_amount: Math.max(0, this.discount()),
          advance_percent: this.advancePct(),
          advance_amount: this.advance(),
          customer_id: cust.data.id,
          customer_name: this.name.trim(),
          mobile: this.mobile(),
          email: this.email.trim() || null,
          passengers: Math.min(20, Math.max(1, Math.round(Number(this.passengers) || 1))),
          pickup_address: this.address.trim(),
          pickup_date: this.date,
          pickup_time: to12h(this.time),
          admin_notes: this.note.trim() || null,
          source: this.source,
          created_by: this.db.userId(),
          handled_by: this.db.userId(),
          enquiry_id: this.enquiryParam() ? Number(this.enquiryParam()) : null,
        })
        .select('id')
        .single();
      if (res.error) throw new Error(res.error.message);
      this.toast.ok(`Booking #${res.data.id} created`);
      await this.router.navigate(['/admin/bookings', res.data.id]);
    } catch (e) {
      this.toast.error(e);
    } finally {
      this.saving.set(false);
    }
  }
}
