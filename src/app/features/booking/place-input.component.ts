import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

let nextId = 0;

/** Text box with a suggestion list of places (accessible combobox). */
@Component({
  selector: 'kc-place-input',
  template: `
    <div class="relative">
      <label [for]="id" class="mb-1 block text-sm font-medium text-kc-ink">{{ label() }}</label>
      <input
        [id]="id"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="id + '-list'"
        [attr.aria-activedescendant]="open() && active() >= 0 ? id + '-opt-' + active() : null"
        [attr.aria-invalid]="invalid() || null"
        [attr.aria-describedby]="invalid() ? id + '-err' : null"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="onInput($any($event.target).value)"
        (focus)="open.set(true)"
        (blur)="onBlur()"
        (keydown)="onKey($event)"
        class="h-12 w-full rounded-xl border bg-white px-4 text-base text-kc-ink placeholder:text-kc-muted/70 focus:border-kc-teal focus:outline-none"
        [class.border-kc-line]="!invalid()"
        [class.border-red-600]="invalid()"
      />
      @if (open() && matches().length) {
        <ul
          [id]="id + '-list'"
          role="listbox"
          [attr.aria-label]="label()"
          class="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-kc-line bg-white py-1 shadow-lg"
        >
          @for (opt of matches(); track opt; let i = $index) {
            <li
              [id]="id + '-opt-' + i"
              role="option"
              [attr.aria-selected]="i === active()"
              (mousedown)="$event.preventDefault(); choose(opt)"
              class="cursor-pointer px-4 py-2.5 text-sm"
              [class.bg-kc-surface]="i === active()"
            >
              {{ opt }}
            </li>
          }
        </ul>
      }
      @if (invalid()) {
        <p [id]="id + '-err'" class="mt-1 text-sm text-red-700">{{ errorText() }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceInputComponent {
  readonly label = input.required<string>();
  readonly placeholder = input('Type a city or area');
  readonly options = input<readonly string[]>([]);
  readonly invalid = input(false);
  readonly errorText = input('Choose a place from the list');
  readonly value = model('');

  protected readonly id = `kc-place-${nextId++}`;
  protected readonly open = signal(false);
  protected readonly active = signal(-1);

  protected readonly matches = computed(() => {
    const q = this.value().trim().toLowerCase();
    const all = this.options();
    if (!q) return all.slice(0, 8);
    const starts = all.filter((o) => o.toLowerCase().startsWith(q));
    const contains = all.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains].slice(0, 8);
  });

  protected onInput(text: string): void {
    this.value.set(text);
    this.open.set(true);
    this.active.set(-1);
  }

  protected choose(option: string): void {
    this.value.set(option);
    this.open.set(false);
    this.active.set(-1);
  }

  protected onBlur(): void {
    // Accept an exact match typed in a different case, e.g. "raipur" -> "Raipur".
    const typed = this.value().trim().toLowerCase();
    const exact = this.options().find((o) => o.toLowerCase() === typed);
    if (exact) this.value.set(exact);
    this.open.set(false);
  }

  protected onKey(e: KeyboardEvent): void {
    const n = this.matches().length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.open.set(true);
      this.active.set(n ? (this.active() + 1) % n : -1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.active.set(n ? (this.active() - 1 + n) % n : -1);
    } else if (e.key === 'Enter' && this.open() && this.active() >= 0) {
      e.preventDefault();
      this.choose(this.matches()[this.active()]);
    } else if (e.key === 'Escape') {
      this.open.set(false);
    }
  }
}
