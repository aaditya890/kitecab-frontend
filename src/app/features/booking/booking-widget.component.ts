import { ChangeDetectionStrategy, Component, OnInit, afterNextRender, computed, inject, input, signal } from '@angular/core';

import { SITE } from '../../core/config/site.config';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ApiService } from '../../core/services/api.service';
import { CatalogService } from '../../core/services/catalog.service';
import { SiteSettingsService } from '../../core/services/site-settings.service';
import { inr, rentalDisplay, rentalFares, rentalLabel, roundTripFares } from '../../core/utils/fare';
import { BookingResponse } from '../../models/booking.model';
import { CarPrices } from '../../models/catalog.model';
import { BOOKING_TYPE_LABELS, BookingType, CAR_TYPES, CarType } from '../../models/common.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PlaceInputComponent } from './place-input.component';

type Step = 'search' | 'fares' | 'details' | 'done';

interface Quote {
  type: BookingType;
  pickup: string;
  /** Drop place, or the rental package label. */
  dropOrPackage: string;
  summary: string;
  fares: CarPrices;
  km?: number;
  rentalId?: number;
  waitingTime?: string;
  approxKm?: number;
}

const MOBILE = /^[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** 'HH:mm' -> '6:30 PM' (format used in WhatsApp messages and old records). */
function to12h(value: string): string {
  const [h, m] = value.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

function todayIso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

@Component({
  selector: 'kc-booking-widget',
  imports: [PlaceInputComponent, IconComponent],
  templateUrl: './booking-widget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingWidgetComponent implements OnInit {
  /** Pre-fill from a route or city page. */
  readonly initialType = input<BookingType>('oneway');
  readonly initialPickup = input('');
  readonly initialDrop = input('');

  protected readonly catalog = inject(CatalogService);
  protected readonly settings = inject(SiteSettingsService);
  private readonly api = inject(ApiService);
  private readonly analytics = inject(AnalyticsService);

  protected readonly types: BookingType[] = ['oneway', 'round-trip', 'local-rental'];
  protected readonly typeLabels = BOOKING_TYPE_LABELS;
  protected readonly cars = CAR_TYPES;
  protected readonly seats = SITE.fares.seats;
  protected readonly extrasNote = SITE.fares.extrasNote;
  protected readonly inr = inr;
  protected readonly rentalDisplay = rentalDisplay;
  protected readonly minDate = todayIso();

  // ---- search ------------------------------------------------------------
  protected readonly type = signal<BookingType>('oneway');
  protected readonly pickup = signal('');
  protected readonly drop = signal('');
  protected readonly waitingTime = signal('');
  protected readonly approxKm = signal('');
  protected readonly rentalId = signal('');
  protected readonly mobile = signal('');
  protected readonly searchTried = signal(false);
  protected readonly searchError = signal('');

  // ---- result + details ----------------------------------------------------
  protected readonly step = signal<Step>('search');
  protected readonly quote = signal<Quote | null>(null);
  protected readonly car = signal<CarType | null>(null);
  protected readonly fullName = signal('');
  protected readonly email = signal('');
  protected readonly passengers = signal('1');
  protected readonly address = signal('');
  protected readonly date = signal('');
  protected readonly time = signal('');
  protected readonly detailsTried = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly result = signal<BookingResponse | null>(null);

  protected readonly dropOptions = computed(() => this.catalog.destinations(this.pickup()));
  protected readonly selectedFare = computed(() => {
    const q = this.quote();
    const c = this.car();
    return q && c ? q.fares[c] : null;
  });

  protected readonly errors = computed(() => {
    const t = this.type();
    const e: Record<string, string> = {};
    if (!this.catalog.isLocation(this.pickup())) e['pickup'] = 'Choose your pickup place from the list';
    if (t !== 'local-rental' && !this.dropOptions().includes(this.drop())) e['drop'] = 'Choose a drop place from the list';
    if (t === 'round-trip') {
      if (!this.waitingTime()) e['waiting'] = 'Choose how long the cab should wait';
      const km = Number(this.approxKm());
      if (!Number.isInteger(km) || km < 1 || km > 3000) e['km'] = 'Enter the total kilometres (1–3000)';
    }
    if (t === 'local-rental' && !this.rentalId()) e['rental'] = 'Choose a package';
    if (!MOBILE.test(this.mobile())) e['mobile'] = 'Enter a valid 10-digit mobile number';
    return e;
  });

  protected readonly detailErrors = computed(() => {
    const e: Record<string, string> = {};
    if (this.fullName().trim().length < 2) e['name'] = 'Enter your name';
    if (!MOBILE.test(this.mobile())) e['mobile'] = 'Enter a valid 10-digit mobile number';
    if (!EMAIL.test(this.email().trim())) e['email'] = 'Enter a valid email';
    if (this.address().trim().length < 3) e['address'] = 'Enter the pickup address';
    if (!this.date() || this.date() < this.minDate) e['date'] = 'Choose today or a later date';
    if (!this.time()) e['time'] = 'Choose a pickup time';
    return e;
  });

  constructor() {
    afterNextRender(() => this.catalog.load());
  }

  /** Pre-fill runs during prerender too, so route pages show their places in the HTML. */
  ngOnInit(): void {
    this.type.set(this.initialType());
    this.pickup.set(this.initialPickup());
    this.drop.set(this.initialDrop());
  }

  protected selectType(t: BookingType): void {
    this.type.set(t);
    this.searchTried.set(false);
    this.searchError.set('');
  }

  protected onlyDigits(value: string, max: number): string {
    return value.replace(/\D/g, '').slice(0, max);
  }

  protected checkPrice(event: Event): void {
    event.preventDefault();
    this.searchTried.set(true);
    this.searchError.set('');
    if (!this.catalog.ready()) {
      this.searchError.set('Fares are still loading. Please try again in a moment.');
      return;
    }
    if (Object.keys(this.errors()).length) return;

    const quote = this.buildQuote();
    if (!quote) {
      this.searchError.set('We don’t have a fixed fare for this trip yet. Call or WhatsApp us for a quote.');
      return;
    }

    // Same conversion and enquiry as the live site's "Check price".
    this.analytics.trackCheckPrice();
    this.api
      .sendEnquiry({ serviceType: quote.type, pickup: quote.pickup, dropOrPackage: quote.dropOrPackage, mobile: this.mobile() })
      .subscribe({ error: () => undefined });

    this.quote.set(quote);
    this.car.set(null);
    this.step.set('fares');
  }

  private buildQuote(): Quote | null {
    const t = this.type();
    const pickup = this.pickup();
    if (t === 'local-rental') {
      const pkg = this.catalog.rentals().find((p) => String(p.id) === this.rentalId());
      if (!pkg) return null;
      return { type: t, pickup, dropOrPackage: rentalLabel(pkg), summary: `${pickup} · ${rentalDisplay(pkg)}`, fares: rentalFares(pkg), rentalId: pkg.id };
    }
    const route = this.catalog.fare(pickup, this.drop());
    if (!route) return null;
    if (t === 'oneway') {
      return { type: t, pickup, dropOrPackage: this.drop(), summary: `${pickup} → ${this.drop()} · ${route.km} km`, fares: route.fares, km: route.km };
    }
    const rate = this.catalog.roundTripRates().find((r) => r.slot === this.waitingTime());
    if (!rate) return null;
    const km = Number(this.approxKm());
    return {
      type: t,
      pickup,
      dropOrPackage: this.drop(),
      summary: `${pickup} ⇄ ${this.drop()} · ${km} km · wait ${this.waitingTime()}`,
      fares: roundTripFares(rate, km),
      waitingTime: this.waitingTime(),
      approxKm: km,
    };
  }

  protected chooseCar(car: CarType): void {
    this.car.set(car);
    this.analytics.event('select_car', { car, trip: this.type() });
    this.step.set('details');
  }

  protected back(to: Step): void {
    this.step.set(to);
    this.submitError.set('');
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.detailsTried.set(true);
    const q = this.quote();
    const car = this.car();
    if (!q || !car || Object.keys(this.detailErrors()).length) return;

    this.submitting.set(true);
    this.submitError.set('');
    this.api
      .createBooking({
        bookingType: q.type,
        carType: car,
        pickup: q.pickup,
        ...(q.type === 'local-rental' ? { rentalPackageId: q.rentalId } : { drop: q.dropOrPackage }),
        ...(q.type === 'round-trip' ? { waitingTime: q.waitingTime, approxDistanceKm: q.approxKm } : {}),
        customer: {
          fullName: this.fullName().trim(),
          mobile: this.mobile(),
          email: this.email().trim(),
          passengers: Number(this.passengers()),
          pickupAddress: this.address().trim(),
          pickupDate: this.date(),
          pickupTime: to12h(this.time()),
        },
      })
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.step.set('done');
          this.submitting.set(false);
          this.analytics.event('booking_created', { trip: q.type, car, value: res.fare, currency: 'INR' });
        },
        error: (err: Error) => {
          this.submitError.set(err.message);
          this.submitting.set(false);
        },
      });
  }

  /** If online booking fails, the customer can send the same details on WhatsApp. */
  protected readonly whatsappFallback = computed(() => {
    const q = this.quote();
    const car = this.car();
    if (!q || !car) return this.settings.whatsappHref();
    const lines = [
      'Hi KiteCab, I want to book a cab:',
      `Trip: ${BOOKING_TYPE_LABELS[q.type]} — ${q.summary}`,
      `Car: ${car} (${inr(q.fares[car])})`,
      `Date and time: ${this.date() || '-'} ${this.time() ? to12h(this.time()) : ''}`,
      `Pickup address: ${this.address() || '-'}`,
      `Name: ${this.fullName() || '-'}, Mobile: ${this.mobile()}`,
    ];
    return this.settings.whatsappWith(lines.join('\n'));
  });

  protected startOver(): void {
    this.step.set('search');
    this.quote.set(null);
    this.car.set(null);
    this.result.set(null);
    this.detailsTried.set(false);
    this.searchTried.set(false);
  }
}
