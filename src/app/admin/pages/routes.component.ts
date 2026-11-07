import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { SupabaseClient } from '@supabase/supabase-js';

import { AdminDbService } from '../core/admin-db.service';
import { downloadCsv } from '../core/format';
import { PagedList, ok, searchTerm, toPage } from '../core/paged-list';
import { ToastService } from '../core/toast.service';
import { PagerComponent } from '../ui/pager.component';

interface Row {
  id: number;
  from_location_id: number;
  to_location_id: number;
  pickup: string;
  drop: string;
  distance_km: number;
  hatchback_price: number;
  sedan_price: number;
  suv_price: number;
  is_active: boolean;
}

interface Place {
  id: number;
  name: string;
}

const COLS =
  'id,from_location_id,to_location_id,pickup,drop,distance_km,hatchback_price,sedan_price,suv_price,is_active';

@Component({
  selector: 'kc-admin-routes',
  imports: [FormsModule, PagerComponent],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="kc-adm-h1">Routes and one-way fares</h1>
      <div class="flex gap-2">
        <button type="button" class="kc-adm-btn" (click)="exportCsv()">
          Export CSV
        </button>
        <button type="button" class="kc-adm-btn-primary" (click)="openNew()">
          + Add route
        </button>
      </div>
    </div>
    <p class="mt-1 text-sm text-kc-muted">
      Changes reach the website booking form within about a minute. Switch a
      route off to stop online bookings on it.
    </p>

    @if (n) {
      <form
        class="kc-adm-card mt-4 grid gap-3 p-4 sm:grid-cols-4"
        (ngSubmit)="create()"
      >
        <label class="text-sm sm:col-span-2"
          >From
          <select
            class="kc-adm-input mt-1 w-full"
            name="f"
            required
            [(ngModel)]="n.from"
          >
            @for (p of places(); track p.id) {
              <option [ngValue]="p.id">{{ p.name }}</option>
            }
          </select>
        </label>
        <label class="text-sm sm:col-span-2"
          >To
          <select
            class="kc-adm-input mt-1 w-full"
            name="t"
            required
            [(ngModel)]="n.to"
          >
            @for (p of places(); track p.id) {
              <option [ngValue]="p.id">{{ p.name }}</option>
            }
          </select>
        </label>
        <label class="text-sm"
          >Distance km<input
            class="kc-adm-input mt-1 w-full"
            type="number"
            name="km"
            [(ngModel)]="n.km"
        /></label>
        <label class="text-sm"
          >Hatchback ₹<input
            class="kc-adm-input mt-1 w-full"
            type="number"
            name="h"
            [(ngModel)]="n.h"
        /></label>
        <label class="text-sm"
          >Sedan ₹<input
            class="kc-adm-input mt-1 w-full"
            type="number"
            name="s"
            [(ngModel)]="n.s"
        /></label>
        <label class="text-sm"
          >SUV ₹<input
            class="kc-adm-input mt-1 w-full"
            type="number"
            name="u"
            [(ngModel)]="n.u"
        /></label>
        <label class="flex items-center gap-2 text-sm sm:col-span-4"
          ><input type="checkbox" name="rev" [(ngModel)]="n.reverse" /> Also add
          the return route (same km and prices)</label
        >
        <div class="flex gap-2 sm:col-span-4">
          <button class="kc-adm-btn-primary" type="submit">Add route</button>
          <button class="kc-adm-btn" type="button" (click)="n = null">
            Cancel
          </button>
        </div>
      </form>
    }

    <div class="mt-4 flex flex-wrap gap-2">
      <input
        class="kc-adm-input w-full sm:w-72"
        type="search"
        placeholder="Search a place (pickup or drop)"
        [(ngModel)]="q"
        (ngModelChange)="list.debounce()"
        aria-label="Search routes"
      />
      <select
        class="kc-adm-input"
        [(ngModel)]="active"
        (ngModelChange)="list.reset()"
        aria-label="On or off"
      >
        <option value="">On and off</option>
        <option value="on">On only</option>
        <option value="off">Off only</option>
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
              <th>Route</th>
              <th>Km</th>
              <th>Hatchback ₹</th>
              <th>Sedan ₹</th>
              <th>SUV ₹</th>
              <th>Online</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of list.rows(); track r.id) {
              <tr [class.opacity-50]="!r.is_active">
                <td class="min-w-48 font-medium">
                  {{ r.pickup }} → {{ r.drop }}
                </td>
                @if (editId() === r.id) {
                  <td>
                    <input
                      class="kc-adm-input w-20"
                      type="number"
                      [(ngModel)]="e.distance_km"
                    />
                  </td>
                  <td>
                    <input
                      class="kc-adm-input w-24"
                      type="number"
                      [(ngModel)]="e.hatchback_price"
                    />
                  </td>
                  <td>
                    <input
                      class="kc-adm-input w-24"
                      type="number"
                      [(ngModel)]="e.sedan_price"
                    />
                  </td>
                  <td>
                    <input
                      class="kc-adm-input w-24"
                      type="number"
                      [(ngModel)]="e.suv_price"
                    />
                  </td>
                  <td></td>
                  <td class="whitespace-nowrap">
                    <button
                      type="button"
                      class="kc-adm-btn-primary"
                      (click)="save(r)"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      class="kc-adm-btn"
                      (click)="editId.set(null)"
                    >
                      ✕
                    </button>
                  </td>
                } @else {
                  <td>{{ r.distance_km }}</td>
                  <td>{{ r.hatchback_price }}</td>
                  <td>{{ r.sedan_price }}</td>
                  <td>{{ r.suv_price }}</td>
                  <td>
                    <label class="inline-flex items-center gap-2"
                      ><input
                        type="checkbox"
                        [checked]="r.is_active"
                        (change)="toggle(r)"
                      />
                      {{ r.is_active ? 'On' : 'Off' }}</label
                    >
                  </td>
                  <td>
                    <button
                      type="button"
                      class="kc-adm-btn"
                      (click)="startEdit(r)"
                    >
                      Edit
                    </button>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="py-8 text-center text-kc-muted">
                  {{ list.loading() ? 'Loading…' : 'No routes.' }}
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
export class RoutesComponent {
  private readonly db = inject(AdminDbService);
  private readonly toast = inject(ToastService);
  protected q = '';
  protected active = '';
  protected readonly editId = signal<number | null>(null);
  protected e: Partial<Row> = {};
  protected readonly places = signal<Place[]>([]);
  protected n: {
    from: number | null;
    to: number | null;
    km: number;
    h: number;
    s: number;
    u: number;
    reverse: boolean;
  } | null = null;

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
      .from('admin_routes')
      .select(COLS, count ? { count: 'exact' } : undefined);
    const t = searchTerm(this.q);
    if (t) q = q.or(`pickup.ilike.*${t}*,drop.ilike.*${t}*`);
    if (this.active) q = q.eq('is_active', this.active === 'on');
    return q.order('pickup').order('drop');
  }

  protected startEdit(r: Row): void {
    this.e = {
      distance_km: r.distance_km,
      hatchback_price: r.hatchback_price,
      sedan_price: r.sedan_price,
      suv_price: r.suv_price,
    };
    this.editId.set(r.id);
  }

  private valid(...n: unknown[]): boolean {
    return n.every((x) => Number.isInteger(Number(x)) && Number(x) > 0);
  }

  protected async save(r: Row): Promise<void> {
    const e = this.e;
    if (
      !this.valid(e.distance_km, e.hatchback_price, e.sedan_price, e.suv_price)
    ) {
      this.toast.error('Km and all prices must be whole numbers above 0.');
      return;
    }
    const patch = {
      distance_km: Number(e.distance_km),
      hatchback_price: Number(e.hatchback_price),
      sedan_price: Number(e.sedan_price),
      suv_price: Number(e.suv_price),
    };
    if (
      await this.toast.run(
        async () =>
          ok(
            await (
              await this.db.db()
            )
              .from('routes')
              .update(patch)
              .eq('id', r.id),
          ),
        `${r.pickup} → ${r.drop} saved`,
      )
    ) {
      this.editId.set(null);
      await this.list.load();
    }
  }

  protected async toggle(r: Row): Promise<void> {
    await this.toast.run(
      async () =>
        ok(
          await (
            await this.db.db()
          )
            .from('routes')
            .update({ is_active: !r.is_active })
            .eq('id', r.id),
        ),
      `${r.pickup} → ${r.drop} is ${r.is_active ? 'off' : 'on'}`,
    );
    await this.list.load();
  }

  protected async openNew(): Promise<void> {
    this.n = { from: null, to: null, km: 0, h: 0, s: 0, u: 0, reverse: true };
    if (!this.places().length) {
      const { data } = await (
        await this.db.db()
      )
        .from('locations')
        .select('id,name')
        .order('name');
      this.places.set((data ?? []) as Place[]);
    }
  }

  protected async create(): Promise<void> {
    const n = this.n!;
    if (
      !n.from ||
      !n.to ||
      n.from === n.to ||
      !this.valid(n.km, n.h, n.s, n.u)
    ) {
      this.toast.error(
        'Pick two different places and fill km and all three prices.',
      );
      return;
    }
    const row = (a: number, b: number) => ({
      from_location_id: a,
      to_location_id: b,
      distance_km: +n.km,
      hatchback_price: +n.h,
      sedan_price: +n.s,
      suv_price: +n.u,
    });
    const rows = n.reverse
      ? [row(n.from, n.to), row(n.to, n.from)]
      : [row(n.from, n.to)];
    const done = await this.toast.run(
      async () => {
        const res = await (await this.db.db()).from('routes').insert(rows);
        if (res.error?.code === '23505')
          throw new Error(
            'This route (or its return) already exists — search for it and edit it.',
          );
        ok(res);
      },
      rows.length > 1 ? 'Route and return route added' : 'Route added',
    );
    if (done) {
      this.n = null;
      await this.list.reset();
    }
  }

  protected async exportCsv(): Promise<void> {
    const res = await this.query(await this.db.db(), false).limit(10000);
    if (res.data)
      downloadCsv(
        'kitecab-routes.csv',
        (res.data as unknown as Row[]).map(
          ({ id, from_location_id, to_location_id, ...r }) => r,
        ),
      );
  }
}
