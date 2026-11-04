import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { FaqItem } from '../../core/seo/schema';

let nextId = 0;

/** Accordion FAQ using <details> — works without JavaScript, all text is in the HTML for Google. */
@Component({
  selector: 'kc-faq',
  template: `
    <section [attr.aria-labelledby]="headingId">
      <h2 [id]="headingId" class="text-2xl font-semibold text-kc-ink">{{ heading() }}</h2>
      <div class="mt-5 divide-y divide-kc-line rounded-2xl border border-kc-line bg-white">
        @for (f of items(); track f.q) {
          <details class="group px-5 py-4">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-kc-ink">
              <h3 class="text-base">{{ f.q }}</h3>
              <span class="text-xl text-kc-teal transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p class="mt-3 leading-relaxed text-kc-muted">{{ f.a }}</p>
          </details>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent {
  readonly items = input.required<FaqItem[]>();
  readonly heading = input('Frequently asked questions');
  /** Counter (not random) so prerendered and browser ids match during hydration. */
  protected readonly headingId = `kc-faq-${nextId++}`;
}
