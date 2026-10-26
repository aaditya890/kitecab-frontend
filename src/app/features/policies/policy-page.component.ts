import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { POLICY_NAV } from '../../core/config/navigation';
import { SiteSettingsService } from '../../core/services/site-settings.service';

/** Shared frame for legal pages: title, last-updated date, content, contact block, links. */
@Component({
  selector: 'kc-policy-page',
  imports: [RouterLink],
  template: `
    <article class="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header class="border-b border-kc-line pb-6">
        <h1 class="text-3xl font-semibold text-kc-ink sm:text-4xl">{{ heading() }}</h1>
        <p class="mt-2 text-sm text-kc-muted">Last updated: {{ updated() }}</p>
      </header>

      <div class="kc-prose mt-8">
        <ng-content />

        <h2>Contact us</h2>
        <p>KiteCab Taxi Service</p>
        <ul>
          <li>Phone and WhatsApp: <a [href]="settings.telHref()">{{ settings.contact().phoneDisplay }}</a></li>
          <li>Email: <a [href]="settings.mailHref()">{{ settings.contact().email }}</a></li>
          <li>Office: {{ settings.addressText() }}</li>
        </ul>
      </div>

      <nav aria-label="Other policies" class="mt-10 flex flex-wrap gap-2 border-t border-kc-line pt-6">
        @for (link of policies; track link.path) {
          <a [routerLink]="link.path" class="rounded-lg border border-kc-line px-3 py-2 text-sm hover:bg-white">{{ link.label }}</a>
        }
      </nav>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyPageComponent {
  readonly heading = input.required<string>();
  readonly updated = input.required<string>();

  protected readonly settings = inject(SiteSettingsService);
  protected readonly policies = POLICY_NAV;
}
