import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LogoComponent } from '../shared/components/logo/logo.component';
import { AdminDbService } from './core/admin-db.service';

@Component({
  selector: 'kc-admin-login',
  imports: [FormsModule, LogoComponent],
  template: `
    <main class="grid min-h-dvh place-items-center bg-kc-surface px-4">
      <form
        class="w-full max-w-sm rounded-2xl border border-kc-line bg-white p-6 shadow-sm"
        (ngSubmit)="submit()"
      >
        <kc-logo class="mb-6 block" />
        <h1 class="text-xl font-semibold text-kc-ink">Admin login</h1>
        <label class="mt-5 block text-sm font-medium"
          >Email
          <input
            class="kc-adm-input mt-1 w-full"
            type="email"
            name="email"
            autocomplete="username"
            required
            [(ngModel)]="email"
          />
        </label>
        <label class="mt-4 block text-sm font-medium"
          >Password
          <input
            class="kc-adm-input mt-1 w-full"
            type="password"
            name="password"
            autocomplete="current-password"
            required
            [(ngModel)]="password"
          />
        </label>
        @if (error()) {
          <p
            class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {{ error() }}
          </p>
        }
        <button
          class="kc-adm-btn-primary mt-6 w-full"
          type="submit"
          [disabled]="busy()"
        >
          {{ busy() ? 'Checking…' : 'Log in' }}
        </button>
      </form>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent {
  readonly next = input<string>('/admin');

  private readonly db = inject(AdminDbService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
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
