import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { ToastService } from '../core/toast.service';

/** 10-digit number → +91 link targets. */
export function waLink(mobile: string, text = ''): string {
  const d = mobile.replace(/\D/g, '');
  const n = d.length === 10 ? '91' + d : d;
  return `https://wa.me/${n}${text ? '?text=' + encodeURIComponent(text) : ''}`;
}

/**
 * Call · WhatsApp · Copy for one mobile number. Emits `used` with the channel,
 * so pages can log a follow-up when staff call or WhatsApp from here.
 */
@Component({
  selector: 'kc-contact',
  template: `
    @if (digits()) {
      <div class="inline-flex items-center gap-1" (click)="$event.stopPropagation()">
        @if (showNumber()) {
          <span
            class="mr-1 whitespace-nowrap tabular-nums"
            [class]="compact() ? 'text-[13px] text-kc-muted' : 'font-medium'"
            >{{ pretty() }}</span
          >
        }
        <a
          [href]="'tel:+91' + digits()"
          (click)="used.emit('call')"
          class="kc-icon-btn"
          [class]="compact() ? quiet : 'bg-kc-teal text-white hover:bg-kc-teal-dark'"
          title="Call"
          aria-label="Call {{ pretty() }}"
        >
          <svg viewBox="0 0 24 24" [class]="compact() ? 'size-3.5' : 'size-4'" fill="currentColor" aria-hidden="true">
            <path
              d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"
            />
          </svg>
        </a>
        <a
          [href]="wa()"
          target="_blank"
          rel="noopener"
          (click)="used.emit('whatsapp')"
          class="kc-icon-btn"
          [class]="compact() ? quietWa : 'bg-[#15773a] text-white hover:bg-[#0f5f2d]'"
          title="WhatsApp"
          aria-label="WhatsApp {{ pretty() }}"
        >
          <svg viewBox="0 0 24 24" [class]="compact() ? 'size-3.5' : 'size-4'" fill="currentColor" aria-hidden="true">
            <path
              d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z"
            />
          </svg>
        </a>
        <button
          type="button"
          (click)="copy()"
          class="kc-icon-btn"
          [class]="compact() ? quiet : 'border border-kc-line bg-white text-kc-ink hover:bg-kc-surface'"
          title="Copy number"
          aria-label="Copy {{ pretty() }}"
        >
          <svg
            viewBox="0 0 24 24"
            [class]="compact() ? 'size-3.5' : 'size-4'"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        </button>
      </div>
    } @else {
      <span class="text-xs text-kc-muted">No valid number</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactActionsComponent {
  readonly mobile = input<string | null | undefined>('');
  /** Text pre-filled in WhatsApp. */
  readonly text = input('');
  readonly showNumber = input(true);
  /** Small, quiet buttons for dense tables. */
  readonly compact = input(false);
  readonly used = output<'call' | 'whatsapp'>();

  protected readonly quiet = '!size-7 !rounded-md bg-kc-surface text-kc-muted hover:bg-kc-teal hover:text-white';
  protected readonly quietWa = '!size-7 !rounded-md bg-kc-surface text-kc-muted hover:bg-[#15773a] hover:text-white';

  private readonly toast = inject(ToastService);
  protected readonly digits = computed(() => {
    const d = (this.mobile() ?? '').replace(/\D/g, '').slice(-10);
    return d.length === 10 ? d : '';
  });
  protected readonly pretty = computed(() => this.digits().replace(/(\d{5})(\d{5})/, '$1 $2'));
  protected readonly wa = computed(() => waLink(this.digits(), this.text()));

  protected copy(): void {
    void navigator.clipboard.writeText(this.digits()).then(() => this.toast.ok(`Copied ${this.pretty()}`));
  }
}
