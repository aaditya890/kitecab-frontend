import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE } from '../../core/config/site.config';
import { LogoComponent } from '../../shared/components/logo/logo.component';

/** Temporary page so the base setup can be built and checked. Replaced in the website step. */
@Component({
  selector: 'kc-home',
  imports: [LogoComponent],
  template: `
    <main class="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <kc-logo [size]="72" [tagline]="true" />
      <h1 class="text-3xl font-semibold text-kc-ink sm:text-4xl">KiteCab — cab service in Chhattisgarh</h1>
      <p class="text-kc-muted">One way, round trip and local rental cabs across Chhattisgarh and Nagpur.</p>
      <a
        class="inline-flex h-12 items-center rounded-xl bg-kc-yellow px-6 font-semibold text-kc-night hover:bg-kc-yellow-dark"
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
