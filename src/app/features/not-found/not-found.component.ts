import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'kc-not-found',
  imports: [RouterLink],
  template: `
    <section class="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p class="text-6xl font-bold text-kc-teal">404</p>
      <h1 class="text-2xl font-semibold text-kc-ink">This page doesn't exist</h1>
      <p class="text-kc-muted">Check the address, or book your cab from the home page.</p>
      <a routerLink="/" class="inline-flex h-12 items-center rounded-xl bg-kc-teal px-6 font-medium text-white hover:bg-kc-teal-dark"
        >Go to home page</a
      >
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  constructor() {
    inject(SeoService).set({
      title: 'Page not found',
      description: 'This page does not exist. Book a taxi anywhere in Chhattisgarh from the KiteCab home page.',
      path: '/404',
      noindex: true,
    });
  }
}
