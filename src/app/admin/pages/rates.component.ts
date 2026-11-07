import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminDbService } from '../core/admin-db.service';
import { ok } from '../core/paged-list';
import { ToastService } from '../core/toast.service';

interface Rental {
  id?: number;
  hours: number;
  km: number;
  hatchback_price: number;
  sedan_price: number;
  suv_price: number;
  is_active: boolean;
}

interface RoundTrip {
  id: number;
  waiting_slot: string;
  sort_order: number;
  hatchback_per_km: number;
  sedan_per_km: number;
  suv_per_km: number;
  hatchback_base: number;
  sedan_base: number;
  suv_base: number;
  is_active: boolean;
}

const RT_NUMBERS = [
  'hatchback_per_km',
  'sedan_per_km',
  'suv_per_km',
  'hatchback_base',
  'sedan_base',
  'suv_base',
] as const;

@Component({
  selector: 'kc-admin-rates',
  imports: [FormsModule],
  template: `
    <h1 class="kc-adm-h1">Local rental and round trip prices</h1>

    <section class="kc-adm-card mt-5 overflow-hidden">
      <div class="flex items-center justify-between border-b border-kc-line px-4 py-3">
        <h2 class="font-semibold">Local rental packages</h2>
        <button type="button" class="kc-adm-btn" (click)="addRental()">+ Add package</button>
      </div>
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>Hours</th>
              <th>Km</th>
              <th>Hatchback ₹</th>
              <th>Sedan ₹</th>
              <th>SUV ₹</th>
              <th>Online</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of rentals(); track $index) {
              <tr>
                <td>
                  <input class="kc-adm-input w-20" type="number" [(ngModel)]="r.hours" />
                </td>
                <td>
                  <input class="kc-adm-input w-20" type="number" [(ngModel)]="r.km" />
                </td>
                <td>
                  <input class="kc-adm-input w-24" type="number" [(ngModel)]="r.hatchback_price" />
                </td>
                <td>
                  <input class="kc-adm-input w-24" type="number" [(ngModel)]="r.sedan_price" />
                </td>
                <td>
                  <input class="kc-adm-input w-24" type="number" [(ngModel)]="r.suv_price" />
                </td>
                <td>
                  <input type="checkbox" [(ngModel)]="r.is_active" aria-label="Online" />
                </td>
                <td>
                  <button type="button" class="kc-adm-btn-primary" (click)="saveRental(r)">Save</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="kc-adm-card mt-5 overflow-hidden">
      <div class="border-b border-kc-line px-4 py-3">
        <h2 class="font-semibold">Round trip rates</h2>
        <p class="mt-1 text-sm text-kc-muted">Fare = per-km rate × approx km + base charge for the waiting time.</p>
      </div>
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>Waiting</th>
              <th>Hatch ₹/km</th>
              <th>Sedan ₹/km</th>
              <th>SUV ₹/km</th>
              <th>Hatch base</th>
              <th>Sedan base</th>
              <th>SUV base</th>
              <th>Online</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of roundTrip(); track r.id) {
              <tr>
                <td class="whitespace-nowrap font-medium">
                  {{ r.waiting_slot }}
                </td>
                @for (k of rtNumbers; track k) {
                  <td>
                    <input class="kc-adm-input w-20" type="number" [(ngModel)]="r[k]" />
                  </td>
                }
                <td>
                  <input type="checkbox" [(ngModel)]="r.is_active" aria-label="Online" />
                </td>
                <td>
                  <button type="button" class="kc-adm-btn-primary" (click)="saveRoundTrip(r)">Save</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="px-4 py-3 text-sm text-kc-muted">
        Example: 100 km Sedan with "1 day" waiting = 11 × 100 + 1500 = ₹2,600 (using the numbers above).
      </p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatesComponent {
  private readonly db = inject(AdminDbService);
  private readonly toast = inject(ToastService);
  protected readonly rtNumbers = RT_NUMBERS;
  protected readonly rentals = signal<Rental[]>([]);
  protected readonly roundTrip = signal<RoundTrip[]>([]);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const db = await this.db.db();
    const [r, t] = await Promise.all([
      db.from('rental_packages').select('id,hours,km,hatchback_price,sedan_price,suv_price,is_active').order('hours'),
      db.from('round_trip_rates').select('*').order('sort_order'),
    ]);
    this.rentals.set((r.data ?? []) as Rental[]);
    this.roundTrip.set((t.data ?? []) as RoundTrip[]);
  }

  protected addRental(): void {
    this.rentals.update((l) => [
      ...l,
      {
        hours: 0,
        km: 0,
        hatchback_price: 0,
        sedan_price: 0,
        suv_price: 0,
        is_active: true,
      },
    ]);
  }

  private positive(...n: unknown[]): boolean {
    return n.every((x) => Number.isInteger(Number(x)) && Number(x) > 0);
  }

  protected async saveRental(r: Rental): Promise<void> {
    if (!this.positive(r.hours, r.km, r.hatchback_price, r.sedan_price, r.suv_price)) {
      this.toast.error('All numbers must be whole numbers above 0.');
      return;
    }
    const { id, ...raw } = r;
    const data = {
      ...raw,
      hours: +r.hours,
      km: +r.km,
      hatchback_price: +r.hatchback_price,
      sedan_price: +r.sedan_price,
      suv_price: +r.suv_price,
    };
    const db = await this.db.db();
    if (
      await this.toast.run(
        async () =>
          ok(
            id
              ? await db.from('rental_packages').update(data).eq('id', id)
              : await db.from('rental_packages').insert(data),
          ),
        `${r.hours} hours ${r.km} km saved`,
      )
    ) {
      await this.load();
    }
  }

  protected async saveRoundTrip(r: RoundTrip): Promise<void> {
    if (!this.positive(...RT_NUMBERS.map((k) => r[k]))) {
      this.toast.error('All numbers must be whole numbers above 0.');
      return;
    }
    const patch: Record<string, unknown> = { is_active: r.is_active };
    for (const k of RT_NUMBERS) patch[k] = Number(r[k]);
    if (
      await this.toast.run(
        async () => ok(await (await this.db.db()).from('round_trip_rates').update(patch).eq('id', r.id)),
        `${r.waiting_slot} saved`,
      )
    ) {
      await this.load();
    }
  }
}
