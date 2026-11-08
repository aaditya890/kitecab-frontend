import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { MAIN_NAV } from '../core/config/navigation';
import { AnalyticsService } from '../core/services/analytics.service';
import { SiteSettingsService } from '../core/services/site-settings.service';
import { IconComponent } from '../shared/components/icon/icon.component';
import { LogoComponent } from '../shared/components/logo/logo.component';

@Component({
  selector: 'kc-site-header',
  imports: [RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    <header class="sticky top-0 z-40 border-b border-kc-line/80 bg-white/90 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <a routerLink="/" aria-label="KiteCab home" class="shrink-0">
          <kc-logo [size]="40" />
        </a>

        <nav aria-label="Main" class="hidden items-center gap-1 lg:flex">
          @for (link of nav; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-kc-surface text-kc-teal"
              class="rounded-lg px-3 py-2 text-sm font-medium text-kc-ink transition-colors hover:bg-kc-surface"
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
            class="hidden h-11 items-center gap-2 rounded-xl border border-kc-line px-4 text-sm font-medium text-kc-ink transition-colors hover:bg-kc-surface xl:inline-flex"
          >
            <kc-icon name="whatsapp" class="text-[#15773a]" /> WhatsApp
          </a>
          <a
            [href]="settings.telHref()"
            (click)="analytics.event('click_call', { location: 'header' })"
            class="inline-flex h-11 items-center gap-2 rounded-xl bg-kc-teal px-4 text-sm font-semibold text-white transition-colors hover:bg-kc-teal-dark"
          >
            <kc-icon name="phone" [size]="18" />
            <span class="hidden sm:inline">{{ settings.contact().phoneDisplay }}</span>
            <span class="sm:hidden">Call</span>
          </a>
          <button
            #menuButton
            type="button"
            class="inline-flex size-11 items-center justify-center rounded-xl border border-kc-line text-kc-ink transition-colors hover:bg-kc-surface lg:hidden"
            [attr.aria-expanded]="open()"
            aria-controls="kc-mobile-menu"
            aria-label="Open menu"
            (click)="open.set(true)"
          >
            <svg
              viewBox="0 0 24 24"
              class="size-[22px]"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M10 17h10" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- mobile drawer (always in the DOM so it can slide in and out) -->
    <div class="lg:hidden" [attr.inert]="open() ? null : ''">
      <div
        class="fixed inset-0 z-50 bg-kc-night/50 backdrop-blur-[2px] transition-opacity duration-300"
        [class.opacity-0]="!open()"
        [class.pointer-events-none]="!open()"
        (click)="close()"
        aria-hidden="true"
      ></div>

      <aside
        id="kc-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        class="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-white shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
        [class.translate-x-full]="!open()"
      >
        <div class="flex items-center justify-between border-b border-kc-line px-5 py-4">
          <kc-logo [size]="36" />
          <button
            #closeButton
            type="button"
            class="group grid size-10 place-items-center rounded-full bg-kc-surface text-kc-ink transition hover:bg-kc-ink hover:text-white"
            aria-label="Close menu"
            (click)="close()"
          >
            <kc-icon name="close" [size]="20" class="transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </div>

        <nav aria-label="Mobile" class="flex-1 overflow-y-auto px-3 py-3">
          @for (link of nav; track link.path; let i = $index) {
            <a
              [routerLink]="link.path"
              routerLinkActive="!bg-kc-teal/[0.06] [&_.kc-tile]:!bg-kc-teal [&_.kc-tile]:!text-white"
              class="kc-drawer-item group flex items-center gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-kc-surface"
              [style.transition-delay.ms]="open() ? 60 + i * 35 : 0"
              [class.kc-drawer-item-in]="open()"
            >
              <span
                class="kc-tile grid size-11 shrink-0 place-items-center rounded-xl bg-kc-teal/[0.08] text-kc-teal transition-colors group-hover:bg-kc-teal group-hover:text-white"
              >
                @if (link.icon) {
                  <kc-icon [name]="link.icon" [size]="21" />
                }
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-semibold text-kc-ink">{{ link.label }}</span>
                @if (link.hint) {
                  <span class="block truncate text-[13px] text-kc-muted">{{ link.hint }}</span>
                }
              </span>
              <kc-icon
                name="chevronRight"
                [size]="18"
                class="text-kc-muted/60 transition-transform group-hover:translate-x-0.5"
              />
            </a>
          }
        </nav>

        <div class="space-y-2.5 border-t border-kc-line bg-kc-surface/60 p-4">
          <a routerLink="/" fragment="book" class="kc-cta !h-12" (click)="close()">
            Book a cab <kc-icon name="arrowRight" [size]="18" />
          </a>
          <div class="grid grid-cols-2 gap-2.5">
            <a
              [href]="settings.telHref()"
              (click)="analytics.event('click_call', { location: 'menu' })"
              class="flex h-12 items-center justify-center gap-2 rounded-xl bg-kc-teal font-semibold text-white transition-colors hover:bg-kc-teal-dark"
            >
              <kc-icon name="phone" [size]="18" /> Call
            </a>
            <a
              [href]="settings.whatsappHref()"
              target="_blank"
              rel="noopener"
              (click)="analytics.event('click_whatsapp', { location: 'menu' })"
              class="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#15773a] font-semibold text-white transition-colors hover:bg-[#0f5f2d]"
            >
              <kc-icon name="whatsapp" [size]="18" /> WhatsApp
            </a>
          </div>
          <p class="pt-1 text-center text-xs text-kc-muted">
            <span class="mr-1 inline-block size-2 rounded-full bg-emerald-500 align-middle"></span>
            Open 24×7 · {{ settings.contact().phoneDisplay }}
          </p>
        </div>
      </aside>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeaderComponent {
  protected readonly settings = inject(SiteSettingsService);
  protected readonly analytics = inject(AnalyticsService);
  protected readonly nav = MAIN_NAV;
  protected readonly open = signal(false);

  private readonly document = inject(DOCUMENT);
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly closeButton = viewChild<ElementRef<HTMLButtonElement>>('closeButton');

  constructor() {
    // Close after navigating; lock page scroll while open; move focus in and back out.
    inject(Router).events.subscribe((e) => e instanceof NavigationEnd && this.open.set(false));
    let wasOpen = false;
    effect(() => {
      const open = this.open();
      const body = this.document.body;
      if (!body) return;
      body.style.overflow = open ? 'hidden' : '';
      if (open) setTimeout(() => this.closeButton()?.nativeElement.focus(), 50);
      else if (wasOpen) this.menuButton()?.nativeElement.focus();
      wasOpen = open;
    });
  }

  protected close(): void {
    if (this.open()) this.open.set(false);
  }
}
