import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PagedList } from '../core/paged-list';

/** "Showing 26–50 of 2,851" with previous / next buttons. */
@Component({
  selector: 'kc-pager',
  template: `
    @let l = list();
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-t border-kc-line px-4 py-3 text-sm text-kc-muted"
    >
      <span>
        @if (l.total()) {
          {{ l.page() * l.size + 1 }}–{{
            min(l.total(), (l.page() + 1) * l.size)
          }}
          of {{ l.total().toLocaleString('en-IN') }}
        } @else if (!l.loading()) {
          Nothing found
        }
      </span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="kc-adm-btn"
          [disabled]="l.page() === 0 || l.loading()"
          (click)="l.load(l.page() - 1)"
        >
          ← Prev
        </button>
        <span>Page {{ l.page() + 1 }} / {{ l.pages }}</span>
        <button
          type="button"
          class="kc-adm-btn"
          [disabled]="l.page() + 1 >= l.pages || l.loading()"
          (click)="l.load(l.page() + 1)"
        >
          Next →
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagerComponent {
  readonly list = input.required<PagedList<unknown>>();
  protected readonly min = Math.min;
}
