const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const BOOKING_TYPES = [
  { value: 'oneway', label: 'One way' },
  { value: 'round-trip', label: 'Round trip' },
  { value: 'local-rental', label: 'Local rental' },
] as const;

export const BOOKING_STATUSES = [
  'new',
  'confirmed',
  'assigned',
  'completed',
  'cancelled',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const CAR_TYPES = ['Hatchback', 'Sedan', 'SUV'] as const;

export function typeLabel(t: string | null | undefined): string {
  return BOOKING_TYPES.find((b) => b.value === t)?.label ?? t ?? '-';
}

export function rs(n: number | null | undefined): string {
  return n == null ? '-' : '₹' + Number(n).toLocaleString('en-IN');
}

/** 2026-11-07 → 7 Nov 2026 */
export function day(d: string | null | undefined): string {
  if (!d) return '-';
  const [y, m, dd] = d.slice(0, 10).split('-').map(Number);
  return `${dd} ${MONTHS[m - 1]} ${y}`;
}

/** Timestamp → 7 Nov, 4:51 PM (India time) */
export function stamp(ts: string | null | undefined): string {
  if (!ts) return '-';
  const d = new Date(new Date(ts).getTime() + 330 * 60_000); // IST, no Intl needed
  const h = d.getUTCHours() % 12 || 12;
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${h}:${min} ${d.getUTCHours() < 12 ? 'AM' : 'PM'}`;
}

/** Today's date in India as YYYY-MM-DD. */
export function todayIst(offsetDays = 0): string {
  return new Date(Date.now() + 330 * 60_000 + offsetDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export const STATUS_STYLE: Record<string, string> = {
  new: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-sky-100 text-sky-900',
  assigned: 'bg-violet-100 text-violet-900',
  completed: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-zinc-200 text-zinc-700',
  PAID: 'bg-emerald-100 text-emerald-900',
  PENDING: 'bg-amber-100 text-amber-900',
  EXPIRED: 'bg-zinc-200 text-zinc-700',
  CANCELLED: 'bg-zinc-200 text-zinc-700',
  FAILED: 'bg-red-100 text-red-900',
};

/** CSV download (Excel opens it). */
export function downloadCsv(
  name: string,
  rows: Record<string, unknown>[],
): void {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    cols.join(','),
    ...rows.map((r) => cols.map((c) => cell(r[c])).join(',')),
  ].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
