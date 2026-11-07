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
    const raw =
      e instanceof Error
        ? e.message
        : typeof e === 'object' && e && 'message' in e
          ? String((e as { message: unknown }).message)
          : String(e);
    this.push(friendly(raw), 'error');
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
    setTimeout(() => this.items.update((l) => l.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 2500);
  }
}

/** Database wording → plain words for the office. */
function friendly(msg: string): string {
  if (/duplicate key/i.test(msg)) {
    if (/mobile/i.test(msg)) return 'This mobile number is already saved.';
    if (/registration/i.test(msg)) return 'This car number is already saved.';
    if (/name|slug/i.test(msg)) return 'This name is already saved.';
    return 'This is already saved.';
  }
  if (/violates row-level security|permission denied/i.test(msg))
    return 'You do not have access to do this. Ask the admin.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'No internet or the server is not reachable. Try again.';
  if (/JWT expired|invalid JWT/i.test(msg)) return 'Your login expired. Please log in again.';
  return msg;
}
