import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { STATUS_STYLE } from '../core/format';

@Component({
  selector: 'kc-badge',
  template: `<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize" [class]="style()">{{
    label() || value() || '-'
  }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  readonly value = input<string | null | undefined>('');
  /** Text to show instead of the raw value. */
  readonly label = input<string | null | undefined>('');
  protected readonly style = computed(() => STATUS_STYLE[this.value() ?? ''] ?? 'bg-zinc-100 text-zinc-700');
}
