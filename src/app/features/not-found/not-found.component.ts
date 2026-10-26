import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'kc-not-found',
  imports: [RouterLink],
  template: `
    <main class="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p class="text-6xl font-bold text-kc-teal">404</p>
      <h1 class="text-2xl font-semibold text-kc-ink">This page doesn't exist</h1>
      <p class="text-kc-muted">Check the address, or book your cab from the home page.</p>
      <a routerLink="/" class="inline-flex h-12 items-center rounded-xl bg-kc-teal px-6 font-medium text-white hover:bg-kc-teal-dark"
        >Go to home page</a
      >
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
