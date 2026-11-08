import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

let nextId = 0;

/** Text box with a suggestion list of places (accessible combobox). */
@Component({
  selector: 'kc-place-input',
  template: `
    <div class="relative">
      @if (variant() === 'row') {
        <!-- row inside a grouped card: marker · small label · large borderless input -->
        <div class="flex items-center gap-3 px-4 py-2.5">
          <span class="grid w-5 shrink-0 place-items-center" aria-hidden="true">
            @if (icon() === 'drop') {
              <svg viewBox="0 0 24 24" class="size-[18px] text-kc-yellow-dark" fill="currentColor">
                <path
                  d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
                />
              </svg>
            } @else {
              <span class="size-3 rounded-full border-[3px] border-kc-teal bg-white"></span>
            }
          </span>
          <span class="min-w-0 flex-1">
            <label [for]="id" class="block text-[11px] font-semibold tracking-[0.08em] text-kc-muted uppercase">{{
              label()
            }}</label>
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
              class="block h-7 w-full truncate bg-transparent p-0 text-[17px] font-medium text-kc-ink placeholder:font-normal placeholder:text-kc-muted/55 focus:outline-none focus-visible:outline-none"
              [class.pr-12]="padEnd()"
            />
          </span>
        </div>
      } @else {
        <div class="relative">
          <label [for]="id" class="kc-label">{{ label() }}</label>
          @if (icon() === 'pickup') {
            <span class="pointer-events-none absolute bottom-0 left-4 z-10 flex h-12 items-center" aria-hidden="true">
              <span class="size-2.5 rounded-full bg-kc-teal ring-4 ring-kc-teal/15"></span>
            </span>
          } @else if (icon() === 'drop') {
            <span
              class="pointer-events-none absolute bottom-0 left-3.5 z-10 flex h-12 items-center text-kc-yellow-dark"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" class="size-4" fill="currentColor">
                <path
                  d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
                />
              </svg>
            </span>
          }
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
            class="kc-field"
            [class.pl-10]="!!icon()"
          />
        </div>
      }
      @if (open() && matches().length) {
        <ul
          [id]="id + '-list'"
          role="listbox"
          [attr.aria-label]="label()"
          class="kc-enter absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-auto rounded-2xl bg-white p-1.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5"
        >
          @for (opt of matches(); track opt; let i = $index) {
            <li
              [id]="id + '-opt-' + i"
              role="option"
              [attr.aria-selected]="i === active()"
              (mousedown)="$event.preventDefault(); choose(opt)"
              class="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-kc-surface"
              [class.bg-kc-surface]="i === active()"
            >
              <svg viewBox="0 0 24 24" class="size-4 shrink-0 text-kc-muted/70" fill="currentColor" aria-hidden="true">
                <path
                  d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
                />
              </svg>
              {{ opt }}
            </li>
          }
        </ul>
      }
      @if (invalid() && variant() !== 'row') {
        <p [id]="id + '-err'" class="mt-1.5 text-[13px] text-red-700">
          {{ errorText() }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceInputComponent {
  readonly label = input.required<string>();
  /** Leading marker: teal dot for pickup, pin for drop. */
  readonly icon = input<'pickup' | 'drop' | ''>('');
  readonly placeholder = input('Type a city or area');
  readonly options = input<readonly string[]>([]);
  readonly invalid = input(false);
  readonly errorText = input('Choose a place from the list');
  readonly value = model('');
  /** 'field' = boxed input with label above; 'row' = row inside a grouped card (errors shown by the parent). */
  readonly variant = input<'field' | 'row'>('field');
  /** Leave room on the right (e.g. for a swap button). */
  readonly padEnd = input(false);

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
