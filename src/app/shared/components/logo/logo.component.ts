import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let nextId = 0;

/**
 * KiteCab logo: round KC mark + "KiteCab" wordmark.
 * Inline SVG (no extra request, sharp at any size). The wordmark uses the site font.
 *
 *   <kc-logo />                         light background (header)
 *   <kc-logo tone="onDark" />           dark background (footer, admin sidebar)
 *   <kc-logo [wordmark]="false" />      mark only
 */
@Component({
  selector: 'kc-logo',
  template: `
    <span class="inline-flex items-center gap-2.5" [attr.aria-label]="wordmark() ? null : 'KiteCab'">
      <svg
        viewBox="0 0 64 64"
        [attr.width]="size()"
        [attr.height]="size()"
        class="shrink-0"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <clipPath [attr.id]="clipId"><circle cx="32" cy="32" r="25.6" /></clipPath>
        </defs>
        <circle cx="32" cy="32" r="31.5" fill="#FCB924" />
        <circle cx="32" cy="32" r="29.4" fill="#075869" />
        <circle cx="32" cy="32" r="25.6" fill="#050607" />
        <g [attr.clip-path]="'url(#' + clipId + ')'">
          <path d="M29.6 40 H34.4 L46 64 H18 Z" fill="#2B3036" />
          <path d="M24.6 64 L30.4 40 M39.4 64 L33.6 40" stroke="#E9ECEF" stroke-width="0.9" />
          <path d="M32 42 V44.4 M32 47 V50 M32 53.2 V57.4" stroke="#E9ECEF" stroke-width="0.9" stroke-linecap="round" />
          <rect x="29.3" y="50.6" width="5.4" height="7.4" rx="1.6" fill="#FCB924" />
          <rect x="30.1" y="52" width="3.8" height="1.6" rx="0.5" fill="#5B4300" />
        </g>
        <g fill="#FCB924">
          <path d="M12.5 15.5 H18.2 V25.4 L26 15.5 H32.6 L23.9 26.4 L33 38.5 H26.2 L18.2 27.8 V38.5 H12.5 Z" />
          <path d="M53.1 21.75 A10.5 10.5 0 1 0 53.1 32.25 L48.59 29.65 A5.3 5.3 0 1 1 48.59 24.35 Z" />
        </g>
      </svg>
      @if (wordmark()) {
        <span class="flex flex-col leading-none">
          <span class="font-bold tracking-tight" [class]="textClass()" [style.font-size.px]="size() * 0.5">
            Kite<span [class]="cabClass()">Cab</span>
          </span>
          @if (tagline()) {
            <span
              class="mt-1 font-medium tracking-[0.14em] uppercase"
              [class]="taglineClass()"
              [style.font-size.px]="Math.max(10, size() * 0.19)"
              >Taxi service · Chhattisgarh</span
            >
          }
        </span>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  /** Height of the round mark in px; the wordmark scales with it. */
  readonly size = input(44);
  readonly tone = input<'onLight' | 'onDark'>('onLight');
  readonly wordmark = input(true);
  readonly tagline = input(false);

  protected readonly clipId = `kc-logo-clip-${nextId++}`;
  protected readonly Math = Math;
  protected readonly textClass = computed(() => (this.tone() === 'onDark' ? 'text-white' : 'text-kc-ink'));
  /** Gold on dark; teal on light (gold text on white is too faint to read). */
  protected readonly cabClass = computed(() => (this.tone() === 'onDark' ? 'text-kc-yellow' : 'text-kc-teal'));
  protected readonly taglineClass = computed(() => (this.tone() === 'onDark' ? 'text-white/70' : 'text-kc-muted'));
}
