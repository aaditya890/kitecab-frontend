import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminDbService } from '../core/admin-db.service';
import { ok } from '../core/paged-list';
import { ToastService } from '../core/toast.service';

interface Business {
  name: string;
  address: string;
  gstin: string;
}

/**
 * Everything the owner may change without a developer.
 * Public values (phone, email, advance %) also update the website within a minute.
 */
@Component({
  selector: 'kc-admin-settings',
  imports: [FormsModule],
  template: `
    <h1 class="kc-adm-h1">Settings</h1>

    @if (loaded()) {
      <div class="mt-5 grid gap-5 xl:grid-cols-2">
        <section class="kc-adm-card p-5">
          <h2 class="font-semibold">Bookings</h2>
          <label class="mt-4 flex items-center gap-3 text-sm">
            <input type="checkbox" [(ngModel)]="bookingOpen" />
            <span
              ><b>Accept online bookings</b><br /><span class="text-kc-muted"
                >Switch off to stop all website bookings (customers will be
                asked to call).</span
              ></span
            >
          </label>
          <label class="mt-4 block text-sm"
            >Advance to pay online (%)
            <input
              class="kc-adm-input mt-1 block w-28"
              type="number"
              min="0"
              max="100"
              [(ngModel)]="advance"
            />
            <span class="text-xs text-kc-muted"
              >0 = no online advance. Currently {{ advance }}% of the
              fare.</span
            >
          </label>
          <button
            type="button"
            class="kc-adm-btn-primary mt-4"
            (click)="saveBookings()"
          >
            Save
          </button>
        </section>

        <section class="kc-adm-card p-5">
          <h2 class="font-semibold">Admin WhatsApp alerts</h2>
          <p class="mt-1 text-sm text-kc-muted">
            Every number here gets the new enquiry, new booking and advance paid
            messages.
          </p>
          <ul class="mt-3 space-y-2">
            @for (n of adminNumbers(); track $index) {
              <li class="flex items-center gap-2">
                <input
                  class="kc-adm-input w-44"
                  inputmode="numeric"
                  [ngModel]="n"
                  (ngModelChange)="setNumber($index, $event)"
                  [attr.aria-label]="'Admin number ' + ($index + 1)"
                />
                <button
                  type="button"
                  class="kc-adm-btn"
                  (click)="removeNumber($index)"
                >
                  Remove
                </button>
              </li>
            }
          </ul>
          <div class="mt-3 flex gap-2">
            <button
              type="button"
              class="kc-adm-btn"
              (click)="adminNumbers.update((l) => [...l, ''])"
            >
              + Add number
            </button>
            <button
              type="button"
              class="kc-adm-btn-primary"
              (click)="saveNumbers()"
            >
              Save numbers
            </button>
          </div>
        </section>

        <section class="kc-adm-card p-5">
          <h2 class="font-semibold">
            Contact shown on the website and invoice
          </h2>
          <label class="mt-4 block text-sm"
            >Phone / WhatsApp<input
              class="kc-adm-input mt-1 w-full"
              [(ngModel)]="phone"
              placeholder="+919009611602"
          /></label>
          <label class="mt-3 block text-sm"
            >Email<input
              class="kc-adm-input mt-1 w-full"
              type="email"
              [(ngModel)]="email"
          /></label>
          <label class="mt-3 block text-sm"
            >Business name<input
              class="kc-adm-input mt-1 w-full"
              [(ngModel)]="business.name"
          /></label>
          <label class="mt-3 block text-sm"
            >Address<input
              class="kc-adm-input mt-1 w-full"
              [(ngModel)]="business.address"
          /></label>
          <label class="mt-3 block text-sm"
            >GSTIN (leave empty if none)<input
              class="kc-adm-input mt-1 w-full uppercase"
              [(ngModel)]="business.gstin"
          /></label>
          <button
            type="button"
            class="kc-adm-btn-primary mt-4"
            (click)="saveContact()"
          >
            Save
          </button>
        </section>

        <section class="kc-adm-card p-5">
          <h2 class="font-semibold">WhatsApp sender (MSG91)</h2>
          <label class="mt-4 block text-sm"
            >Sender number<input
              class="kc-adm-input mt-1 w-full"
              [(ngModel)]="sender"
          /></label>
          <label class="mt-3 block text-sm"
            >Template namespace<input
              class="kc-adm-input mt-1 w-full font-mono text-xs"
              [(ngModel)]="namespace"
          /></label>
          <p class="mt-2 text-xs text-kc-muted">
            Change only if you move to a new MSG91 number. The MSG91 key itself
            stays on the server.
          </p>
          <button
            type="button"
            class="kc-adm-btn-primary mt-4"
            (click)="saveSender()"
          >
            Save
          </button>
        </section>
      </div>
    } @else {
      <p class="mt-6 text-kc-muted">Loading…</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly db = inject(AdminDbService);
  private readonly toast = inject(ToastService);

  protected readonly loaded = signal(false);
  protected readonly adminNumbers = signal<string[]>([]);
  protected bookingOpen = true;
  protected advance = 20;
  protected phone = '';
  protected email = '';
  protected business: Business = { name: '', address: '', gstin: '' };
  protected sender = '';
  protected namespace = '';

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    const { data, error } = await (
      await this.db.db()
    )
      .from('settings')
      .select('key,value');
    if (error) {
      this.toast.error(error);
      return;
    }
    const v = Object.fromEntries(
      (data ?? []).map((r) => [r.key, r.value]),
    ) as Record<string, unknown>;
    this.bookingOpen = v['booking_open'] !== false;
    this.advance = Number(v['advance_percent'] ?? 20);
    this.phone = String(v['support_phone'] ?? '');
    this.email = String(v['support_email'] ?? '');
    this.business = {
      name: '',
      address: '',
      gstin: '',
      ...(v['business'] as Partial<Business> | undefined),
    };
    this.sender = String(v['whatsapp_sender'] ?? '');
    this.namespace = String(v['whatsapp_namespace'] ?? '');
    this.adminNumbers.set(
      ((v['admin_whatsapp_numbers'] as string[]) ?? []).map(String),
    );
    this.loaded.set(true);
  }

  private async save(
    values: Record<string, unknown>,
    message: string,
  ): Promise<void> {
    const db = await this.db.db();
    await this.toast.run(async () => {
      for (const [key, value] of Object.entries(values))
        ok(await db.from('settings').update({ value }).eq('key', key));
    }, message);
  }

  /** 10 digits or 91 + 10 digits → 91XXXXXXXXXX */
  private wa(n: string): string | null {
    const d = n.replace(/\D/g, '');
    if (d.length === 10) return '91' + d;
    if (d.length === 12 && d.startsWith('91')) return d;
    return null;
  }

  protected setNumber(i: number, value: string): void {
    this.adminNumbers.update((l) => l.map((x, j) => (j === i ? value : x)));
  }

  protected removeNumber(i: number): void {
    this.adminNumbers.update((l) => l.filter((_, j) => j !== i));
  }

  protected saveBookings(): void {
    const a = Number(this.advance);
    if (!(a >= 0 && a <= 100)) {
      this.toast.error('Advance must be between 0 and 100.');
      return;
    }
    void this.save(
      { booking_open: this.bookingOpen, advance_percent: a },
      'Booking settings saved',
    );
  }

  protected saveNumbers(): void {
    const list = this.adminNumbers().filter((n) => n.trim());
    const clean = list.map((n) => this.wa(n));
    if (clean.some((n) => !n)) {
      this.toast.error('Each number must be a 10-digit Indian mobile.');
      return;
    }
    const unique = [...new Set(clean as string[])];
    this.adminNumbers.set(unique);
    void this.save(
      { admin_whatsapp_numbers: unique },
      `${unique.length} admin numbers saved`,
    );
  }

  protected saveContact(): void {
    const phone = this.wa(this.phone);
    if (!phone || !/^\S+@\S+\.\S+$/.test(this.email.trim())) {
      this.toast.error('Enter a valid phone and email.');
      return;
    }
    this.phone = '+' + phone;
    void this.save(
      {
        support_phone: this.phone,
        support_email: this.email.trim(),
        business: {
          name: this.business.name.trim(),
          address: this.business.address.trim(),
          gstin: this.business.gstin.trim().toUpperCase(),
        },
      },
      'Contact saved',
    );
  }

  protected saveSender(): void {
    const s = this.wa(this.sender);
    if (!s || !this.namespace.trim()) {
      this.toast.error('Enter the sender number and namespace.');
      return;
    }
    void this.save(
      { whatsapp_sender: s, whatsapp_namespace: this.namespace.trim() },
      'WhatsApp sender saved',
    );
  }
}
