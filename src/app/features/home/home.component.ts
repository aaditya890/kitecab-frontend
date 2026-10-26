import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE } from '../../core/config/site.config';

/** Temporary page so the base setup can be built and checked. Replaced in the website step. */
@Component({
  selector: 'kc-home',
  template: `
    <main class="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <img [src]="site.images.logo" alt="KiteCab logo" width="96" height="96" class="size-24 rounded-full" />
      <h1 class="text-3xl font-semibold text-kc-ink sm:text-4xl">KiteCab — cab service in Chhattisgarh</h1>
      <p class="text-kc-muted">One way, round trip and local rental cabs across Chhattisgarh and Nagpur.</p>
      <a
        class="inline-flex h-12 items-center rounded-xl bg-kc-yellow px-6 font-semibold text-kc-ink hover:bg-kc-yellow-dark"
        [href]="'tel:' + site.contact.phone"
        >Call {{ site.contact.phoneDisplay }}</a
      >
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly site = SITE;
}
