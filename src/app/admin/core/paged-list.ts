import { signal } from '@angular/core';

export interface Page<T> {
  rows: T[];
  total: number;
}

/**
 * Server-side pagination state for one admin list.
 * Only the current page (e.g. 25 rows) is ever downloaded; the database
 * counts the total, so lists stay fast with lakhs of rows.
 */
export class PagedList<T> {
  readonly rows = signal<T[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');

  private seq = 0;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly fetchPage: (from: number, to: number) => Promise<Page<T>>,
    readonly size = 25,
  ) {}

  get pages(): number {
    return Math.max(1, Math.ceil(this.total() / this.size));
  }

  async load(page = this.page()): Promise<void> {
    const mine = ++this.seq;
    this.loading.set(true);
    this.error.set('');
    try {
      const from = page * this.size;
      const res = await this.fetchPage(from, from + this.size - 1);
      if (mine !== this.seq) return; // a newer search already started
      this.rows.set(res.rows);
      this.total.set(res.total);
      this.page.set(page);
    } catch (e) {
      if (mine === this.seq) this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      if (mine === this.seq) this.loading.set(false);
    }
  }

  /** Back to page 1 (after a filter change). */
  reset(): Promise<void> {
    return this.load(0);
  }

  /** Waits until typing stops, then reloads page 1. */
  debounce(ms = 300): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.reset(), ms);
  }
}

/** Throws the Supabase error, or returns rows + count for a PagedList. */
export function toPage<T>(res: {
  data: unknown[] | null;
  count: number | null;
  error: { message: string } | null;
}): Page<T> {
  if (res.error) throw new Error(res.error.message);
  return { rows: (res.data ?? []) as T[], total: res.count ?? 0 };
}

/** Throws if a Supabase write failed. */
export function ok(res: { error: { message: string } | null }): void {
  if (res.error) throw new Error(res.error.message);
}

/** Makes user text safe inside a PostgREST or() filter. */
export function searchTerm(q: string): string {
  return q
    .trim()
    .replace(/[,()*%\\]/g, ' ')
    .replace(/\s+/g, ' ');
}
