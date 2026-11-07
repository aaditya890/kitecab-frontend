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

// ---------- leads (enquiries) -----------------------------------------
export const LEAD_STATUSES = [
  { value: 'new', label: 'New', style: 'bg-amber-100 text-amber-900' },
  { value: 'follow_up', label: 'Follow-up', style: 'bg-sky-100 text-sky-900' },
  {
    value: 'contacted',
    label: 'Contacted',
    style: 'bg-violet-100 text-violet-900',
  },
  {
    value: 'converted',
    label: 'Booked',
    style: 'bg-emerald-100 text-emerald-900',
  },
  {
    value: 'not_interested',
    label: 'Not interested',
    style: 'bg-zinc-200 text-zinc-700',
  },
  { value: 'invalid', label: 'Wrong number', style: 'bg-red-100 text-red-900' },
] as const;

export const OUTCOMES = [
  { value: 'no_answer', label: 'No answer', hint: 'Try again later' },
  { value: 'busy', label: 'Busy / cut call', hint: 'Try again later' },
  { value: 'call_back', label: 'Call back later', hint: 'Set a time' },
  { value: 'interested', label: 'Interested', hint: 'Set a follow-up' },
  { value: 'booked', label: 'Booked ✓', hint: 'Lead closed' },
  { value: 'not_interested', label: 'Not interested', hint: 'Lead closed' },
  { value: 'wrong_number', label: 'Wrong number', hint: 'Lead closed' },
  { value: 'note', label: 'Just a note', hint: 'No status change' },
] as const;

export function leadLabel(s: string | null | undefined): string {
  return LEAD_STATUSES.find((x) => x.value === s)?.label ?? s ?? '-';
}

export function outcomeLabel(s: string): string {
  return OUTCOMES.find((x) => x.value === s)?.label ?? s;
}

for (const l of LEAD_STATUSES) STATUS_STYLE['lead_' + l.value] = l.style;

/** "just now", "12 min ago", "3 h ago", "2 days ago", then the date. */
export function ago(ts: string | null | undefined): string {
  if (!ts) return '-';
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 0) return inFuture(-s);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400)
    return `${Math.floor(s / 86400)} day${s < 2 * 86400 ? '' : 's'} ago`;
  return stamp(ts);
}

function inFuture(s: number): string {
  if (s < 3600) return `in ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `in ${Math.round(s / 3600)} h`;
  return `in ${Math.round(s / 86400)} days`;
}

/** Empty, "N/A", "-" → null, so templates can hide the field. */
export function val(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return !s || s === '-' || s.toUpperCase() === 'N/A' ? null : s;
}

/** Local datetime-input value ('YYYY-MM-DDTHH:mm') for a Date. */
export function localInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
