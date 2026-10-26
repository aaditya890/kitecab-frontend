import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MAIN_NAV } from '../core/config/navigation';
import { AnalyticsService } from '../core/services/analytics.service';
import { SiteSettingsService } from '../core/services/site-settings.service';
import { IconComponent } from '../shared/components/icon/icon.component';
import { LogoComponent } from '../shared/components/logo/logo.component';

@Component({
  selector: 'kc-site-header',
  imports: [RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  template: `
    <header class="sticky top-0 z-40 border-b border-kc-line bg-white/95 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <a routerLink="/" aria-label="KiteCab home" class="shrink-0">
          <kc-logo [size]="40" />
        </a>

        <nav aria-label="Main" class="hidden items-center gap-1 md:flex">
          @for (link of nav; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-kc-surface text-kc-teal"
              [routerLinkActiveOptions]="{ exact: link.path === '/' }"
              class="rounded-lg px-3 py-2 text-sm font-medium text-kc-ink hover:bg-kc-surface"
              >{{ link.label }}</a
            >
          }
        </nav>

        <div class="flex items-center gap-2">
          <a
            [href]="settings.whatsappHref()"
            target="_blank"
            rel="noopener"
            (click)="analytics.event('click_whatsapp', { location: 'header' })"
            class="hidden h-11 items-center gap-2 rounded-xl border border-kc-line px-4 text-sm font-medium text-kc-ink hover:bg-kc-surface sm:inline-flex"
          >
            <kc-icon name="whatsapp" class="text-[#1c8a43]" /> WhatsApp
          </a>
          <a
            [href]="settings.telHref()"
            (click)="analytics.event('click_call', { location: 'header' })"
            class="inline-flex h-11 items-center gap-2 rounded-xl bg-kc-teal px-4 text-sm font-semibold text-white hover:bg-kc-teal-dark"
          >
            <kc-icon name="phone" [size]="18" />
            <span class="hidden sm:inline">{{ settings.contact().phoneDisplay }}</span>
            <span class="sm:hidden">Call</span>
          </a>
          @if (nav.length > 1) {
            <button
              type="button"
              class="inline-flex size-11 items-center justify-center rounded-xl hover:bg-kc-surface md:hidden"
              [attr.aria-expanded]="menuOpen()"
              aria-controls="kc-mobile-menu"
              [attr.aria-label]="menuOpen() ? 'Close menu' : 'Open menu'"
              (click)="menuOpen.set(!menuOpen())"
            >
              <kc-icon [name]="menuOpen() ? 'close' : 'menu'" [size]="24" />
            </button>
          }
        </div>
      </div>

      @if (menuOpen()) {
        <nav id="kc-mobile-menu" aria-label="Main" class="border-t border-kc-line bg-white px-4 py-2 md:hidden">
          @for (link of nav; track link.path) {
            <a
              [routerLink]="link.path"
              (click)="menuOpen.set(false)"
              class="flex h-12 items-center justify-between rounded-lg px-2 font-medium text-kc-ink hover:bg-kc-surface"
              >{{ link.label }} <kc-icon name="chevronRight" class="text-kc-muted"
            /></a>
          }
        </nav>
      }
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  protected readonly settings = inject(SiteSettingsService);
  protected readonly analytics = inject(AnalyticsService);
  protected readonly nav = MAIN_NAV;
  protected readonly menuOpen = signal(false);
}
