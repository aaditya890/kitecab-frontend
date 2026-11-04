import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Crumb } from '../../core/seo/schema';

/** Visible breadcrumb trail (pair it with the breadcrumbs() schema on the page). */
@Component({
  selector: 'kc-breadcrumbs',
  imports: [RouterLink],
  template: `
    <nav aria-label="Breadcrumb" class="text-sm text-kc-muted">
      <ol class="flex flex-wrap items-center gap-1">
        @for (c of items(); track c.path; let last = $last) {
          <li class="flex items-center gap-1">
            @if (last) {
              <span aria-current="page" class="text-kc-ink">{{ c.name }}</span>
            } @else {
              <a [routerLink]="c.path" class="hover:text-kc-teal hover:underline">{{ c.name }}</a>
              <span aria-hidden="true">/</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  readonly items = input.required<Crumb[]>();
}
