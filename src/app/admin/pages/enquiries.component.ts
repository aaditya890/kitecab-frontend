import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { SupabaseClient } from '@supabase/supabase-js';

import { AdminDbService } from '../core/admin-db.service';
import {
  BOOKING_TYPES,
  OUTCOMES,
  ago,
  downloadCsv,
  leadLabel,
  localInput,
  outcomeLabel,
  rs,
  stamp,
  typeLabel,
} from '../core/format';
import { PagedList, ok, searchTerm, toPage } from '../core/paged-list';
import { ToastService } from '../core/toast.service';
import { BadgeComponent } from '../ui/badge.component';
import { ContactActionsComponent } from '../ui/contact-actions.component';
import { PagerComponent } from '../ui/pager.component';

interface Lead {
  id: number;
  service_type: string | null;
  pickup: string;
  drop_or_package: string | null;
  mobile: string | null;
  customer_name: string | null;
  quoted_fare: number | null;
  status: string;
  attempts: number;
  next_follow_up_at: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  booking_id: number | null;
  source: string;
  past_bookings: number;
  lost_reason: string | null;
  created_at: string;
}

interface FollowUp {
  id: number;
  channel: string;
  outcome: string;
  note: string | null;
  next_at: string | null;
  staff_id: string | null;
  created_at: string;
}

interface Fare {
  distance_km: number;
  hatchback_price: number;
  sedan_price: number;
  suv_price: number;
}

type Tab =
  | 'due'
  | 'new'
  | 'follow_up'
  | 'contacted'
  | 'converted'
  | 'not_interested'
  | 'invalid'
  | 'all';

const TABS: { key: Tab; label: string }[] = [
  { key: 'due', label: 'Call now' },
  { key: 'new', label: 'New' },
  { key: 'follow_up', label: 'Follow-up' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'converted', label: 'Booked' },
  { key: 'not_interested', label: 'Not interested' },
  { key: 'invalid', label: 'Wrong number' },
  { key: 'all', label: 'All' },
];

const COLS =
  'id,service_type,pickup,drop_or_package,mobile,customer_name,quoted_fare,status,attempts,next_follow_up_at,assigned_to,assigned_name,booking_id,source,past_bookings,lost_reason,created_at';
const OPEN = ['new', 'contacted', 'follow_up'];

@Component({
  selector: 'kc-admin-enquiries',
  imports: [
    FormsModule,
    RouterLink,
    BadgeComponent,
    ContactActionsComponent,
    PagerComponent,
  ],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="kc-adm-h1">Enquiries / leads</h1>
        <p class="text-sm text-kc-muted">
          Everyone who checked a fare. Call, log what happened, set the next
          call.
        </p>
      </div>
      <div class="flex gap-2">
        <button type="button" class="kc-adm-btn" (click)="exportCsv()">
          Export CSV
        </button>
        <button
          type="button"
          class="kc-adm-btn-primary"
          (click)="adding.set(!adding())"
        >
          + Add lead
        </button>
      </div>
    </div>

    @if (adding()) {
      <form
        class="kc-adm-card mt-4 grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6"
        (ngSubmit)="addLead()"
      >
        <label class="text-sm"
          ><span class="kc-adm-label">Mobile *</span
          ><input
            class="kc-adm-input w-full"
            name="m"
            inputmode="numeric"
            [(ngModel)]="nl.mobile"
        /></label>
        <label class="text-sm"
          ><span class="kc-adm-label">Name</span
          ><input class="kc-adm-input w-full" name="n" [(ngModel)]="nl.name"
        /></label>
        <label class="text-sm"
          ><span class="kc-adm-label">Trip</span>
          <select class="kc-adm-input w-full" name="t" [(ngModel)]="nl.type">
            @for (t of types; track t.value) {
              <option [value]="t.value">{{ t.label }}</option>
            }
          </select>
        </label>
        <label class="text-sm"
          ><span class="kc-adm-label">Pickup *</span
          ><input class="kc-adm-input w-full" name="p" [(ngModel)]="nl.pickup"
        /></label>
        <label class="text-sm"
          ><span class="kc-adm-label">Drop / package</span
          ><input class="kc-adm-input w-full" name="d" [(ngModel)]="nl.drop"
        /></label>
        <label class="text-sm"
          ><span class="kc-adm-label">Came from</span>
          <select class="kc-adm-input w-full" name="s" [(ngModel)]="nl.source">
            <option value="phone">Phone call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="walk_in">Walk-in</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label class="text-sm sm:col-span-2 lg:col-span-5"
          ><span class="kc-adm-label">Note</span
          ><input class="kc-adm-input w-full" name="no" [(ngModel)]="nl.note"
        /></label>
        <div class="flex items-end gap-2">
          <button class="kc-adm-btn-primary" type="submit">Save lead</button
          ><button class="kc-adm-btn" type="button" (click)="adding.set(false)">
            Cancel
          </button>
        </div>
      </form>
    }

    <div
      class="mt-4 flex gap-1 overflow-x-auto border-b border-kc-line"
      role="tablist"
    >
      @for (t of tabs; track t.key) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="tab() === t.key"
          (click)="setTab(t.key)"
          class="-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium"
          [class]="
            tab() === t.key
              ? 'border-kc-teal text-kc-teal'
              : 'border-transparent text-kc-muted hover:text-kc-ink'
          "
        >
          {{ t.label }}
          @if (t.key !== 'all') {
            <span
              class="rounded-full px-1.5 text-xs"
              [class]="
                t.key === 'due' && counts()[t.key]
                  ? 'bg-red-600 text-white'
                  : 'bg-kc-surface text-kc-ink'
              "
              >{{ counts()[t.key] ?? 0 }}</span
            >
          }
        </button>
      }
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <input
        class="kc-adm-input w-full sm:w-64"
        type="search"
        placeholder="Search mobile, name or place"
        [(ngModel)]="q"
        (ngModelChange)="list.debounce()"
        aria-label="Search leads"
      />
      <select
        class="kc-adm-input"
        [(ngModel)]="type"
        (ngModelChange)="list.reset()"
        aria-label="Trip"
      >
        <option value="">All trips</option>
        @for (t of types; track t.value) {
          <option [value]="t.value">{{ t.label }}</option>
        }
      </select>
      <label class="flex items-center gap-2 text-sm"
        ><input
          type="checkbox"
          [(ngModel)]="mine"
          (ngModelChange)="list.reset()"
        />
        Only mine</label
      >
      <button type="button" class="kc-adm-btn" (click)="refresh()">
        Refresh
      </button>
    </div>

    <div class="mt-3 grid gap-4" [class.xl:grid-cols-[1fr_420px]]="!!sel()">
      <div
        class="kc-adm-card min-w-0 overflow-hidden"
        [class.opacity-60]="list.loading()"
      >
        <div class="overflow-x-auto">
          <table class="kc-adm-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Trip</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Next call</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              @for (e of list.rows(); track e.id) {
                <tr
                  class="cursor-pointer"
                  [class.!bg-sky-50]="sel()?.id === e.id"
                  (click)="open(e)"
                >
                  <td class="whitespace-nowrap">
                    <span class="font-medium">{{ ago(e.created_at) }}</span
                    ><br /><span class="text-xs text-kc-muted">{{
                      e.source
                    }}</span>
                  </td>
                  <td class="min-w-44">
                    {{ e.pickup }} → {{ e.drop_or_package || '…' }}<br /><span
                      class="text-xs text-kc-muted"
                      >{{ typeLabel(e.service_type) }}
                      @if (e.quoted_fare) {
                        · from {{ rs(e.quoted_fare) }}
                      }
                    </span>
                  </td>
                  <td>
                    @if (e.customer_name) {
                      <span class="block text-sm font-medium">{{
                        e.customer_name
                      }}</span>
                    }
                    <kc-contact
                      [mobile]="e.mobile"
                      [text]="waText(e)"
                      (used)="open(e)"
                    />
                    @if (e.past_bookings) {
                      <span class="mt-0.5 block text-xs text-emerald-700"
                        >★ {{ e.past_bookings }} past booking(s)</span
                      >
                    }
                  </td>
                  <td>
                    <kc-badge
                      [value]="'lead_' + e.status"
                      [label]="leadLabel(e.status)"
                    />
                    @if (e.attempts) {
                      <span class="mt-0.5 block text-xs text-kc-muted"
                        >{{ e.attempts }} call(s)</span
                      >
                    }
                  </td>
                  <td class="whitespace-nowrap text-sm">
                    @if (isOpen(e)) {
                      <span
                        [class.font-semibold]="overdue(e)"
                        [class.text-red-700]="overdue(e)"
                        >{{
                          e.next_follow_up_at
                            ? ago(e.next_follow_up_at)
                            : 'Call now'
                        }}</span
                      >
                    } @else if (e.booking_id) {
                      <a
                        class="text-kc-teal hover:underline"
                        [routerLink]="['/admin/bookings', e.booking_id]"
                        (click)="$event.stopPropagation()"
                        >#{{ e.booking_id }}</a
                      >
                    } @else {
                      <span class="text-kc-muted">—</span>
                    }
                  </td>
                  <td class="text-sm text-kc-muted">
                    {{ e.assigned_name || '—' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-10 text-center text-kc-muted">
                    {{
                      list.loading()
                        ? 'Loading…'
                        : tab() === 'due'
                          ? 'Nobody to call right now.'
                          : 'No leads here.'
                    }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <kc-pager [list]="list" />
      </div>

      @if (sel(); as e) {
        <aside class="kc-adm-card h-fit p-4 xl:sticky xl:top-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-xs text-kc-muted">
                Lead #{{ e.id }} · {{ stamp(e.created_at) }}
              </p>
              <h2 class="mt-0.5 text-lg font-semibold">
                {{ e.pickup }} → {{ e.drop_or_package || '…' }}
              </h2>
              <p class="text-sm text-kc-muted">
                {{ typeLabel(e.service_type) }}
              </p>
            </div>
            <button
              type="button"
              class="kc-adm-btn"
              (click)="sel.set(null)"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div
            class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-kc-surface p-3"
          >
            <div>
              <p class="font-medium">
                {{ e.customer_name || 'Name not known' }}
              </p>
              <kc-badge
                [value]="'lead_' + e.status"
                [label]="leadLabel(e.status)"
              />
            </div>
            <kc-contact [mobile]="e.mobile" [text]="waText(e)" />
          </div>
          @if (fare(); as f) {
            <div class="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div class="rounded-lg border border-kc-line p-2">
                <p class="text-xs text-kc-muted">Hatchback</p>
                <p class="font-semibold">{{ rs(f.hatchback_price) }}</p>
              </div>
              <div class="rounded-lg border border-kc-line p-2">
                <p class="text-xs text-kc-muted">Sedan</p>
                <p class="font-semibold">{{ rs(f.sedan_price) }}</p>
              </div>
              <div class="rounded-lg border border-kc-line p-2">
                <p class="text-xs text-kc-muted">SUV</p>
                <p class="font-semibold">{{ rs(f.suv_price) }}</p>
              </div>
            </div>
            <p class="mt-1 text-xs text-kc-muted">
              Current one-way fares · {{ f.distance_km }} km
            </p>
          }
          @if (e.assigned_to !== db.userId()) {
            <button type="button" class="kc-adm-btn mt-3" (click)="assignMe(e)">
              Assign to me
            </button>
          }

          <form
            class="mt-4 border-t border-kc-line pt-4"
            (ngSubmit)="saveFollowUp(e)"
          >
            <p class="text-sm font-semibold">What happened?</p>
            <div class="mt-2 grid grid-cols-2 gap-1.5">
              @for (o of outcomes; track o.value) {
                <button
                  type="button"
                  class="rounded-lg border px-2 py-1.5 text-left text-sm"
                  [class]="
                    outcome() === o.value
                      ? 'border-kc-teal bg-kc-teal text-white'
                      : 'border-kc-line hover:bg-kc-surface'
                  "
                  (click)="pickOutcome(o.value)"
                >
                  {{ o.label }}
                </button>
              }
            </div>
            <label class="mt-3 block text-sm"
              ><span class="kc-adm-label">Note</span
              ><textarea
                class="kc-adm-input w-full"
                name="note"
                rows="2"
                [(ngModel)]="note"
              ></textarea>
            </label>
            @if (needsNext()) {
              <p class="kc-adm-label mt-3">Next call</p>
              <div class="flex flex-wrap gap-1.5">
                @for (t of quickTimes; track t.label) {
                  <button
                    type="button"
                    class="kc-adm-btn !px-2 !py-1 text-xs"
                    (click)="setNext(t.mins)"
                  >
                    {{ t.label }}
                  </button>
                }
              </div>
              <input
                class="kc-adm-input mt-2 w-full"
                type="datetime-local"
                name="next"
                [(ngModel)]="next"
              />
            }
            <button
              class="kc-adm-btn-primary mt-3 w-full"
              type="submit"
              [disabled]="!outcome() || saving()"
            >
              {{ saving() ? 'Saving…' : 'Save follow-up' }}
            </button>
          </form>

          <h3 class="mt-5 text-sm font-semibold">History</h3>
          <ol class="mt-2 space-y-2 text-sm">
            @for (h of history(); track h.id) {
              <li class="rounded-lg border border-kc-line p-2">
                <div class="flex justify-between gap-2">
                  <b>{{ outcomeLabel(h.outcome) }}</b
                  ><span class="text-xs text-kc-muted">{{
                    ago(h.created_at)
                  }}</span>
                </div>
                <p class="text-xs text-kc-muted">
                  {{ h.channel }} · {{ staffName(h.staff_id) }}
                  @if (h.next_at) {
                    · next {{ stamp(h.next_at) }}
                  }
                </p>
                @if (h.note) {
                  <p class="mt-1">{{ h.note }}</p>
                }
              </li>
            } @empty {
              <li class="text-kc-muted">No calls yet.</li>
            }
          </ol>
        </aside>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnquiriesComponent {
  protected readonly db = inject(AdminDbService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly tabs = TABS;
  protected readonly types = BOOKING_TYPES;
  protected readonly outcomes = OUTCOMES;
  protected readonly ago = ago;
  protected readonly rs = rs;
  protected readonly stamp = stamp;
  protected readonly typeLabel = typeLabel;
  protected readonly leadLabel = leadLabel;
  protected readonly outcomeLabel = outcomeLabel;
  protected readonly quickTimes = [
    { label: '1 hour', mins: 60 },
    { label: '3 hours', mins: 180 },
    { label: 'Tomorrow 10 AM', mins: -1 },
    { label: '2 days', mins: 2880 },
  ];

  protected readonly tab = signal<Tab>('due');
  protected readonly counts = signal<Record<string, number>>({});
  protected readonly sel = signal<Lead | null>(null);
  protected readonly history = signal<FollowUp[]>([]);
  protected readonly fare = signal<Fare | null>(null);
  protected readonly staff = signal<Map<string, string>>(new Map());
  protected readonly saving = signal(false);
  protected readonly adding = signal(false);
  protected readonly outcome = signal('');
  protected readonly needsNext = computed(() =>
    ['no_answer', 'busy', 'call_back', 'interested'].includes(this.outcome()),
  );

  protected q = '';
  protected type = '';
  protected mine = false;
  protected note = '';
  protected next = '';
  protected nl = {
    mobile: '',
    name: '',
    type: 'oneway',
    pickup: '',
    drop: '',
    source: 'phone',
    note: '',
  };

  protected readonly list = new PagedList<Lead>(
    async (from, to) =>
      toPage<Lead>(await this.query(await this.db.db(), true).range(from, to)),
    30,
  );

  constructor() {
    void this.refresh();
    void this.loadStaff();
  }

  protected setTab(t: Tab): void {
    this.tab.set(t);
    void this.list.reset();
  }

  protected async refresh(): Promise<void> {
    const [{ data }] = await Promise.all([
      (await this.db.db()).rpc('lead_counts'),
      this.list.load(),
    ]);
    if (data) this.counts.set(data as Record<string, number>);
  }

  private async loadStaff(): Promise<void> {
    const { data } = await (
      await this.db.db()
    )
      .from('admin_staff')
      .select('id,full_name,email');
    this.staff.set(
      new Map(
        (data ?? []).map((s) => [
          s.id as string,
          (s.full_name || s.email) as string,
        ]),
      ),
    );
  }

  protected staffName(id: string | null): string {
    return (id && this.staff().get(id)) || 'Staff';
  }

  private query(db: SupabaseClient, count: boolean) {
    let q = db
      .from('admin_enquiries')
      .select(COLS, count ? { count: 'exact' } : undefined);
    const t = this.tab();
    if (t === 'due')
      q = q
        .in('status', OPEN)
        .or(
          `next_follow_up_at.is.null,next_follow_up_at.lte.${new Date().toISOString()}`,
        );
    else if (t !== 'all') q = q.eq('status', t);
    const s = searchTerm(this.q);
    if (s)
      q = /^\d+$/.test(s)
        ? q.like('mobile', `${s}%`)
        : q.or(
            `customer_name.ilike.*${s}*,pickup.ilike.*${s}*,drop_or_package.ilike.*${s}*`,
          );
    if (this.type) q = q.eq('service_type', this.type);
    if (this.mine) q = q.eq('assigned_to', this.db.userId());
    return t === 'due'
      ? q
          .order('next_follow_up_at', { ascending: true, nullsFirst: true })
          .order('created_at', { ascending: false })
      : q.order('created_at', { ascending: false });
  }

  protected isOpen(e: Lead): boolean {
    return OPEN.includes(e.status);
  }

  protected overdue(e: Lead): boolean {
    return (
      this.isOpen(e) &&
      (!e.next_follow_up_at ||
        new Date(e.next_follow_up_at).getTime() <= Date.now())
    );
  }

  protected waText(e: Lead): string {
    const trip = e.drop_or_package
      ? `${e.pickup} to ${e.drop_or_package}`
      : e.pickup;
    return `Hello${e.customer_name ? ' ' + e.customer_name : ''}, this is KiteCab. You checked the cab fare for ${trip} on our website. Shall I book it for you? Please share your pickup date and time.`;
  }

  protected async open(e: Lead): Promise<void> {
    this.sel.set(e);
    this.outcome.set('');
    this.note = '';
    this.next = '';
    this.history.set([]);
    this.fare.set(null);
    const db = await this.db.db();
    const [h, f] = await Promise.all([
      db
        .from('enquiry_followups')
        .select('id,channel,outcome,note,next_at,staff_id,created_at')
        .eq('enquiry_id', e.id)
        .order('created_at', { ascending: false }),
      e.service_type !== 'local-rental' && e.drop_or_package
        ? db
            .from('route_fares')
            .select('distance_km,hatchback_price,sedan_price,suv_price')
            .eq('pickup', e.pickup)
            .eq('drop', e.drop_or_package)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (this.sel()?.id !== e.id) return;
    this.history.set((h.data ?? []) as FollowUp[]);
    this.fare.set((f.data as Fare | null) ?? null);
  }

  protected pickOutcome(o: string): void {
    this.outcome.set(o);
    if (!this.next && ['no_answer', 'busy'].includes(o)) this.setNext(120);
    if (!this.next && ['call_back', 'interested'].includes(o)) this.setNext(-1);
  }

  protected setNext(mins: number): void {
    const d = new Date();
    if (mins === -1) {
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
    } else d.setMinutes(d.getMinutes() + mins);
    this.next = localInput(d);
  }

  protected async saveFollowUp(e: Lead): Promise<void> {
    const outcome = this.outcome();
    if (!outcome) return;
    this.saving.set(true);
    const nextAt =
      this.needsNext() && this.next ? new Date(this.next).toISOString() : null;
    const done = await this.toast.run(
      async () =>
        ok(
          await (await this.db.db()).from('enquiry_followups').insert({
            enquiry_id: e.id,
            channel: outcome === 'note' ? 'note' : 'call',
            outcome,
            note: this.note.trim() || null,
            next_at: nextAt,
          }),
        ),
      'Follow-up saved',
    );
    this.saving.set(false);
    if (!done) return;
    await this.refresh();
    const fresh = this.list.rows().find((x) => x.id === e.id);
    if (fresh) await this.open(fresh);
    else this.sel.set(null);
  }

  protected async assignMe(e: Lead): Promise<void> {
    if (
      await this.toast.run(
        async () =>
          ok(
            await (
              await this.db.db()
            )
              .from('enquiries')
              .update({ assigned_to: this.db.userId() })
              .eq('id', e.id),
          ),
        'Assigned to you',
      )
    ) {
      await this.list.load();
      this.sel.set(this.list.rows().find((x) => x.id === e.id) ?? null);
    }
  }

  protected async addLead(): Promise<void> {
    const mobile = this.nl.mobile.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(mobile) || this.nl.pickup.trim().length < 2) {
      this.toast.error('Enter a valid 10-digit mobile and the pickup place.');
      return;
    }
    const done = await this.toast.run(
      async () =>
        ok(
          await (await this.db.db()).from('enquiries').insert({
            mobile,
            customer_name: this.nl.name.trim() || null,
            service_type: this.nl.type,
            pickup: this.nl.pickup.trim(),
            drop_or_package: this.nl.drop.trim() || null,
            source: this.nl.source,
            note: this.nl.note.trim() || null,
            assigned_to: this.db.userId(),
          }),
        ),
      'Lead added',
    );
    if (done) {
      this.nl = {
        mobile: '',
        name: '',
        type: 'oneway',
        pickup: '',
        drop: '',
        source: 'phone',
        note: '',
      };
      this.adding.set(false);
      this.setTab('new');
      await this.refresh();
    }
  }

  protected async exportCsv(): Promise<void> {
    const res = await this.query(await this.db.db(), false).limit(5000);
    if (res.data)
      downloadCsv(
        `kitecab-leads-${this.tab()}.csv`,
        (res.data as unknown as Lead[]).map((e) => ({
          id: e.id,
          created: stamp(e.created_at),
          source: e.source,
          trip: typeLabel(e.service_type),
          pickup: e.pickup,
          drop: e.drop_or_package,
          name: e.customer_name,
          mobile: e.mobile,
          status: leadLabel(e.status),
          calls: e.attempts,
          next_call: stamp(e.next_follow_up_at),
          staff: e.assigned_name,
          booking: e.booking_id,
          reason: e.lost_reason,
        })),
      );
  }
}
