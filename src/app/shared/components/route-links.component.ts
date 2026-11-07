import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { inr, lowestFare } from '../../core/utils/fare';
import { routePath } from '../../data/seo-routes';
import { SeoRoute } from '../../models/catalog.model';

/** Grid of route links with "from ₹" prices — internal linking for SEO and quick booking. */
@Component({
  selector: 'kc-route-links',
  imports: [RouterLink],
  template: `
    <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      @for (r of routes(); track r.slug; let i = $index) {
        <li [class.max-sm:hidden]="i >= mobileMax()">
          <a
            [routerLink]="path(r)"
            class="flex h-full items-center justify-between gap-3 rounded-xl border border-kc-line bg-white px-4 py-2.5 hover:border-kc-teal sm:py-3"
          >
            <span>
              <span class="block font-medium text-kc-ink"
                >{{ r.fromName }} to {{ r.toName }} taxi</span
              >
              <span class="text-sm text-kc-muted">{{ r.km }} km</span>
            </span>
            <span class="shrink-0 text-right text-sm text-kc-muted"
              >from
              <b class="block text-base text-kc-teal">{{
                inr(low(r))
              }}</b></span
            >
          </a>
        </li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouteLinksComponent {
  readonly routes = input.required<readonly SeoRoute[]>();
  /** On phones only the first few are shown (the rest stay in the HTML for search engines). */
  readonly mobileMax = input(6);
  protected readonly path = routePath;
  protected readonly low = (r: SeoRoute) => lowestFare(r.fares);
  protected readonly inr = inr;
}
