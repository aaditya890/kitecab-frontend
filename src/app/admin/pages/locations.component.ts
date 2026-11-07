import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminDbService } from '../core/admin-db.service';
import { PagedList, ok, searchTerm, toPage } from '../core/paged-list';
import { ToastService } from '../core/toast.service';
import { PagerComponent } from '../ui/pager.component';

interface Row {
  id: number;
  name: string;
  slug: string;
  state: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Places. Switching one off hides every route from or to it on the website. */
@Component({
  selector: 'kc-admin-locations',
  imports: [FormsModule, PagerComponent],
  template: `
    <h1 class="kc-adm-h1">Locations</h1>
    <p class="mt-1 text-sm text-kc-muted">
      Switch a place off to stop all online bookings from or to it (for example during a strike or bad roads). Routes
      stay saved.
    </p>

    <form class="kc-adm-card mt-4 flex flex-wrap items-end gap-3 p-4" (ngSubmit)="add()">
      <label class="text-sm"
        >New place<input
          class="kc-adm-input mt-1 block w-60"
          name="n"
          placeholder="e.g. Kawardha"
          [(ngModel)]="newName"
      /></label>
      <label class="text-sm"
        >State
        <select class="kc-adm-input mt-1 block" name="s" [(ngModel)]="newState">
          @for (s of states; track s) {
            <option [value]="s">{{ s }}</option>
          }
        </select>
      </label>
      <button class="kc-adm-btn-primary" type="submit">Add place</button>
      <span class="text-xs text-kc-muted">Then add its routes in Routes and fares.</span>
    </form>

    <div class="mt-4 flex flex-wrap gap-2">
      <input
        class="kc-adm-input w-full sm:w-72"
        type="search"
        placeholder="Search place"
        [(ngModel)]="q"
        (ngModelChange)="list.debounce()"
        aria-label="Search places"
      />
      <select class="kc-adm-input" [(ngModel)]="active" (ngModelChange)="list.reset()" aria-label="On or off">
        <option value="">On and off</option>
        <option value="on">On only</option>
        <option value="off">Off only</option>
      </select>
    </div>

    <div class="kc-adm-card mt-4 overflow-hidden" [class.opacity-60]="list.loading()">
      <div class="overflow-x-auto">
        <table class="kc-adm-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>State</th>
              <th>Online</th>
              <th>Featured</th>
            </tr>
          </thead>
          <tbody>
            @for (l of list.rows(); track l.id) {
              <tr [class.opacity-50]="!l.is_active">
                <td class="font-medium">{{ l.name }}</td>
                <td>{{ l.state }}</td>
                <td>
                  <label class="inline-flex items-center gap-2"
                    ><input type="checkbox" [checked]="l.is_active" (change)="set(l, { is_active: !l.is_active })" />
                    {{ l.is_active ? 'On' : 'Off' }}</label
                  >
                </td>
                <td>
                  <input
                    type="checkbox"
                    [checked]="l.is_featured"
                    (change)="set(l, { is_featured: !l.is_featured })"
                    [attr.aria-label]="'Featured ' + l.name"
                  />
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="py-8 text-center text-kc-muted">
                  {{ list.loading() ? 'Loading…' : 'No places.' }}
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
export class LocationsComponent {
  private readonly db = inject(AdminDbService);
  private readonly toast = inject(ToastService);
  protected readonly states = ['CG', 'MH', 'MP', 'OD', 'BR', 'UP', 'JH', 'TS', 'AP'];
  protected q = '';
  protected active = '';
  protected newName = '';
  protected newState = 'CG';

  protected readonly list = new PagedList<Row>(async (from, to) => {
    let q = (await this.db.db()).from('locations').select('id,name,slug,state,is_active,is_featured,sort_order', {
      count: 'exact',
    });
    const t = searchTerm(this.q);
    if (t) q = q.ilike('name', `%${t}%`);
    if (this.active) q = q.eq('is_active', this.active === 'on');
    return toPage(await q.order('name').range(from, to));
  }, 50);

  constructor() {
    void this.list.load();
  }

  protected async set(l: Row, patch: Partial<Row>): Promise<void> {
    await this.toast.run(
      async () => ok(await (await this.db.db()).from('locations').update(patch).eq('id', l.id)),
      `${l.name} updated`,
    );
    await this.list.load();
  }

  protected async add(): Promise<void> {
    const name = this.newName.trim().replace(/\s+/g, ' ');
    if (name.length < 2) return;
    const label = this.newState === 'CG' ? name : `${name} (${this.newState})`;
    const done = await this.toast.run(async () => {
      const res = await (await this.db.db()).from('locations').insert({
        name: label,
        slug: slugify(name) + (this.newState === 'CG' ? '' : '-' + this.newState.toLowerCase()),
        state: this.newState,
      });
      if (res.error?.code === '23505') throw new Error(`${label} already exists.`);
      ok(res);
    }, `${label} added`);
    if (done) {
      this.newName = '';
      this.q = name;
      await this.list.reset();
    }
  }
}
