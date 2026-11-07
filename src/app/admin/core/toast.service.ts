import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'error';
}

/** Small "Saved" / error messages in the corner of the admin panel. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly items = signal<Toast[]>([]);
  private next = 1;

  ok(text: string): void {
    this.push(text, 'ok');
  }

  error(e: unknown): void {
    this.push(e instanceof Error ? e.message : String(e), 'error');
  }

  /** Runs an action and shows the result. Returns false if it failed. */
  async run(action: () => Promise<unknown>, success: string): Promise<boolean> {
    try {
      await action();
      this.ok(success);
      return true;
    } catch (e) {
      this.error(e);
      return false;
    }
  }

  private push(text: string, kind: Toast['kind']): void {
    const id = this.next++;
    this.items.update((l) => [...l, { id, text, kind }]);
    setTimeout(
      () => this.items.update((l) => l.filter((t) => t.id !== id)),
      kind === 'error' ? 6000 : 2500,
    );
  }
}
