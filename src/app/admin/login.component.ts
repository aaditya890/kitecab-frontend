import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LogoComponent } from '../shared/components/logo/logo.component';
import { AdminDbService } from './core/admin-db.service';

@Component({
  selector: 'kc-admin-login',
  imports: [FormsModule, LogoComponent],
  template: `
    <main class="grid min-h-dvh bg-[#f4f5f2] lg:grid-cols-[1.1fr_1fr]">
      <!-- brand panel -->
      <section
        class="relative hidden overflow-hidden bg-kc-night p-12 text-white lg:flex lg:flex-col lg:justify-between"
        style="background-image: radial-gradient(700px circle at 100% 0%, rgb(7 88 105 / 0.8), transparent 60%), radial-gradient(500px circle at 0% 100%, rgb(252 185 36 / 0.15), transparent 60%)"
      >
        <kc-logo tone="onDark" [size]="44" [tagline]="true" />
        <div class="max-w-md">
          <p class="text-sm font-semibold tracking-[0.16em] text-kc-yellow uppercase">KiteCab Office</p>
          <h1 class="mt-3 text-4xl leading-tight font-semibold">Every booking, lead and driver in one place.</h1>
          <ul class="mt-8 space-y-3 text-white/80">
            @for (f of features; track f) {
              <li class="flex items-center gap-3">
                <span class="grid size-6 place-items-center rounded-full bg-kc-yellow text-xs font-bold text-kc-night"
                  >✓</span
                >
                {{ f }}
              </li>
            }
          </ul>
        </div>
        <p class="text-xs text-white/40">Office use only · activity is recorded</p>
      </section>

      <!-- form -->
      <section class="flex items-center justify-center px-4 py-12">
        <form class="w-full max-w-sm" (ngSubmit)="submit()">
          <kc-logo class="mb-8 block lg:hidden" [size]="40" />
          <h2 class="text-2xl font-semibold tracking-tight text-kc-ink">Welcome back</h2>
          <p class="mt-1 text-sm text-kc-muted">Log in with your office email.</p>

          <label class="mt-8 block">
            <span class="kc-label">Email</span>
            <input
              class="kc-field bg-white"
              type="email"
              name="email"
              autocomplete="username"
              required
              [(ngModel)]="email"
            />
          </label>
          <label class="mt-4 block">
            <span class="kc-label">Password</span>
            <span class="relative block">
              <input
                class="kc-field bg-white pr-12"
                [type]="show() ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                required
                [(ngModel)]="password"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-1 my-auto grid size-10 place-items-center rounded-lg text-kc-muted transition hover:bg-kc-surface hover:text-kc-ink"
                (click)="show.set(!show())"
                [attr.aria-label]="show() ? 'Hide password' : 'Show password'"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="size-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  @if (show()) {
                    <path
                      d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.4 10.4 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-3 4.2M6.6 6.6C4.4 8 2.8 10.1 2 12c1 2.5 5 7 10 7a10 10 0 0 0 5.4-1.6"
                    />
                  } @else {
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  }
                </svg>
              </button>
            </span>
          </label>

          @if (error()) {
            <p class="kc-enter mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{{ error() }}</p>
          }
          <button class="kc-adm-btn-primary mt-6 h-12 w-full text-base" type="submit" [disabled]="busy()">
            @if (busy()) {
              <span
                class="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              ></span>
              Checking…
            } @else {
              Log in
            }
          </button>
          <p class="mt-6 text-center text-xs text-kc-muted">Forgot your password? Ask the KiteCab admin to reset it.</p>
        </form>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent {
  readonly next = input<string>('/admin');

  private readonly db = inject(AdminDbService);
  private readonly router = inject(Router);

  protected readonly features = [
    'Leads with call reminders and follow-up history',
    'Bookings, drivers, payments and invoices',
    'Staff performance and a full activity log',
  ];
  protected email = '';
  protected password = '';
  protected readonly show = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    const err = await this.db.login(this.email.trim(), this.password);
    this.busy.set(false);
    if (err) {
      this.error.set(err);
      return;
    }
    const next = this.next()?.startsWith('/admin') ? this.next() : '/admin';
    await this.router.navigateByUrl(next);
  }
}
