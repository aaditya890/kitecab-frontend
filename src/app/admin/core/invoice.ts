/**
 * Booking invoice PDF (A4) — KiteCab brand: teal header with the KC logo,
 * billed-to and trip cards, route, fare table, payment summary, driver, notes.
 * Invoice number = booking ID + 5125 (unchanged from the old panel).
 * jsPDF is loaded only when the button is clicked.
 */
import { SITE } from '../../core/config/site.config';

export interface InvoiceBooking {
  id: number;
  booking_type: string;
  car_type: string;
  pickup_location: string;
  drop_location: string | null;
  rental_package: string | null;
  waiting_time: string | null;
  approx_distance_km: number | null;
  distance_km: number | null;
  fare: number;
  customer_name: string;
  mobile: string;
  email: string | null;
  passengers: number;
  pickup_address: string;
  pickup_date: string;
  pickup_time: string;
}

export interface InvoiceExtras {
  advancePaid: number;
  phone: string;
  email: string;
  driver?: string | null;
  carNumber?: string | null;
  extraCharges?: number;
  discount?: number;
  status?: string;
}

type RGB = [number, number, number];
const TEAL: RGB = [7, 88, 105];
const TEAL_DARK: RGB = [5, 63, 75];
const GOLD: RGB = [252, 185, 36];
const INK: RGB = [23, 32, 31];
const MUTED: RGB = [90, 102, 101];
const LINE: RGB = [228, 231, 229];
const SURFACE: RGB = [246, 246, 243];
const GREEN: RGB = [21, 119, 58];
const RED: RGB = [185, 28, 28];

const TYPE_LABEL: Record<string, string> = {
  oneway: 'One way',
  'round-trip': 'Round trip',
  'local-rental': 'Local rental',
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** jsPDF's built-in fonts have no ₹ glyph, so amounts use "Rs." */
const money = (n: number) => `Rs. ${Math.round(n || 0).toLocaleString('en-IN')}`;
const longDate = (iso: string) => {
  const [y, m, d] = (iso || '').slice(0, 10).split('-').map(Number);
  return y ? `${d} ${MONTHS[m - 1]} ${y}` : '-';
};
const clean = (v: unknown) => {
  const s = v == null ? '' : String(v).trim();
  return !s || s === '-' || s.toUpperCase() === 'N/A' ? '' : s;
};

async function dataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function downloadInvoice(b: InvoiceBooking, x: InvoiceExtras): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210;
  const M = 14; // page margin
  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const ink = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const font = (style: 'normal' | 'bold', size: number) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  };

  const invoiceNo = 'INV' + (b.id + 5125).toString().padStart(6, '0');
  const extra = Math.max(0, x.extraCharges ?? 0);
  const discount = Math.max(0, x.discount ?? 0);
  const total = b.fare + extra;
  const paid = Math.max(0, x.advancePaid || 0);
  const balance = Math.max(0, total - paid);
  const fullyPaid = x.status === 'completed' || balance === 0;

  // ---------- header ----------
  fill(TEAL);
  doc.rect(0, 0, W, 40, 'F');
  fill(TEAL_DARK);
  doc.triangle(130, 0, W, 0, W, 40, 'F');
  fill(GOLD);
  doc.rect(0, 40, W, 1.6, 'F');

  try {
    doc.addImage(await dataUrl('/icons/icon-512.png'), 'PNG', M, 8, 24, 24);
  } catch {
    /* works without the logo */
  }
  ink([255, 255, 255]);
  font('bold', 20);
  doc.text('Kite', M + 28, 19);
  ink(GOLD);
  doc.text('Cab', M + 28 + doc.getTextWidth('Kite'), 19);
  ink([220, 235, 238]);
  font('normal', 8.5);
  doc.text('TAXI SERVICE  ·  CHHATTISGARH', M + 28, 25);
  const a = SITE.contact.address;
  doc.text(`${a.line}, ${a.city} ${a.postalCode || '492001'}`, M + 28, 30.5);

  ink([255, 255, 255]);
  font('bold', 18);
  doc.text('INVOICE', W - M, 17, { align: 'right' });
  font('normal', 9);
  doc.text(invoiceNo, W - M, 23.5, { align: 'right' });
  doc.text(`Issued ${longDate(new Date().toISOString())}`, W - M, 28.5, {
    align: 'right',
  });

  // status stamp
  const stamp = fullyPaid ? 'PAID' : 'BALANCE DUE';
  font('bold', 8);
  const sw = doc.getTextWidth(stamp) + 8;
  fill(fullyPaid ? GREEN : GOLD);
  doc.roundedRect(W - M - sw, 31, sw, 6, 3, 3, 'F');
  ink(fullyPaid ? [255, 255, 255] : INK);
  doc.text(stamp, W - M - sw / 2, 35, { align: 'center' });

  // ---------- billed to + booking cards ----------
  let y = 50;
  const cardW = (W - M * 2 - 6) / 2;
  const card = (cx: number, title: string, lines: [string, string][]) => {
    fill(SURFACE);
    doc.roundedRect(cx, y, cardW, 34, 2.5, 2.5, 'F');
    ink(TEAL);
    font('bold', 8);
    doc.text(title, cx + 5, y + 7);
    let ly = y + 13.5;
    for (const [k, v] of lines) {
      if (!v) continue;
      ink(MUTED);
      font('normal', 8.5);
      doc.text(k, cx + 5, ly);
      ink(INK);
      font(k === '' ? 'bold' : 'normal', k === '' ? 11 : 9);
      doc.text(doc.splitTextToSize(v, cardW - 30)[0], cx + (k === '' ? 5 : 27), ly);
      ly += k === '' ? 6.5 : 5.2;
    }
  };
  card(M, 'BILLED TO', [
    ['', clean(b.customer_name) || 'Customer'],
    ['Mobile', clean(b.mobile)],
    ['Email', clean(b.email)],
  ]);
  card(M + cardW + 6, 'BOOKING', [
    ['Booking ID', `#${b.id}`],
    ['Trip', `${TYPE_LABEL[b.booking_type] ?? b.booking_type} · ${b.car_type}`],
    ['Pickup', `${longDate(b.pickup_date)}, ${clean(b.pickup_time)}`],
    ['Passengers', String(b.passengers)],
  ]);

  // ---------- route ----------
  y += 42;
  const rental = b.booking_type === 'local-rental';
  stroke(LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, W - M * 2, rental ? 24 : 30, 2.5, 2.5);
  ink(TEAL);
  font('bold', 8);
  doc.text('ROUTE', M + 5, y + 7);
  fill(TEAL);
  doc.circle(M + 7, y + 13, 1.6, 'F');
  ink(INK);
  font('bold', 11);
  doc.text(clean(b.pickup_location), M + 12, y + 14);
  ink(MUTED);
  font('normal', 8.5);
  const addr = doc.splitTextToSize(clean(b.pickup_address), W - M * 2 - 20)[0] ?? '';
  doc.text(addr, M + 12, y + 18.5);
  if (rental) {
    ink(INK);
    font('normal', 9);
    doc.text(`Package: ${clean(b.rental_package) || 'Local rental'}`, M + 12, y + 21.5 + 0);
  } else {
    stroke(LINE);
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.line(M + 7, y + 15, M + 7, y + 22);
    doc.setLineDashPattern([], 0);
    fill(GOLD);
    doc.circle(M + 7, y + 24, 1.6, 'F');
    ink(INK);
    font('bold', 11);
    doc.text(clean(b.drop_location), M + 12, y + 25);
    const facts = [
      b.distance_km ? `${b.distance_km} km one way` : '',
      b.booking_type === 'round-trip' && clean(b.waiting_time) ? `waiting ${b.waiting_time}` : '',
      b.booking_type === 'round-trip' && b.approx_distance_km ? `${b.approx_distance_km} km total` : '',
    ].filter(Boolean);
    ink(MUTED);
    font('normal', 8.5);
    doc.text(facts.join('  ·  '), W - M - 5, y + 25, { align: 'right' });
  }
  y += rental ? 30 : 36;

  // ---------- fare table ----------
  const tripText = rental
    ? `${TYPE_LABEL[b.booking_type]} · ${b.car_type} · ${clean(b.rental_package)}`
    : `${TYPE_LABEL[b.booking_type] ?? ''} · ${b.car_type} · ${clean(b.pickup_location)} to ${clean(b.drop_location)}`;
  const body: string[][] = [];
  if (discount > 0) {
    body.push([tripText, money(b.fare + discount)]);
    body.push(['Discount', '- ' + money(discount)]);
  } else body.push([tripText, money(b.fare)]);
  if (extra > 0) body.push(['Extra charges (toll, parking, extra km)', money(extra)]);
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Amount']],
    body,
    theme: 'plain',
    margin: { left: M, right: M },
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: INK,
      lineColor: LINE,
    },
    headStyles: {
      fillColor: TEAL,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
    bodyStyles: { lineWidth: { bottom: 0.2 } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ---------- payment summary (right) + driver (left) ----------
  const sx = W - M - 78;
  const rows: [string, string, RGB?][] = [
    ['Total fare', money(total)],
    ['Advance paid online', paid ? '- ' + money(paid) : money(0), paid ? GREEN : undefined],
  ];
  fill(SURFACE);
  doc.roundedRect(sx, y, 78, 34, 2.5, 2.5, 'F');
  let ry = y + 8;
  for (const [k, v, c] of rows) {
    ink(MUTED);
    font('normal', 9);
    doc.text(k, sx + 5, ry);
    ink(c ?? INK);
    doc.text(v, sx + 73, ry, { align: 'right' });
    ry += 6.5;
  }
  stroke(LINE);
  doc.line(sx + 5, ry - 2.5, sx + 73, ry - 2.5);
  ink(INK);
  font('bold', 10);
  doc.text(x.status === 'completed' ? 'Balance paid to driver' : 'Balance to pay driver', sx + 5, ry + 4);
  ink(fullyPaid ? GREEN : RED);
  font('bold', 13);
  doc.text(money(x.status === 'completed' ? total - paid : balance), sx + 73, ry + 4.5, { align: 'right' });

  if (clean(x.driver)) {
    ink(TEAL);
    font('bold', 8);
    doc.text('DRIVER', M, y + 7);
    ink(INK);
    font('bold', 10);
    doc.text(clean(x.driver), M, y + 13);
    ink(MUTED);
    font('normal', 9);
    if (clean(x.carNumber)) doc.text(`Car ${x.carNumber}`, M, y + 18.5);
  }
  y += 44;

  // ---------- notes ----------
  ink(TEAL);
  font('bold', 8);
  doc.text('GOOD TO KNOW', M, y);
  ink(MUTED);
  font('normal', 8.5);
  const notes = [
    'Fares are fixed for the trip shown. Toll tax, parking and state entry tax are paid as actual.',
    'Please check the details and tell us about any issue within 24 hours.',
    'This is a computer-generated invoice and needs no signature.',
  ];
  notes.forEach((n, i) => doc.text(`•  ${n}`, M, y + 6 + i * 5));

  ink(INK);
  font('bold', 11);
  doc.text('Thank you for riding with KiteCab!', W / 2, 268, {
    align: 'center',
  });

  // ---------- footer ----------
  fill(TEAL);
  doc.rect(0, 280, W, 17, 'F');
  fill(GOLD);
  doc.rect(0, 280, W, 1, 'F');
  ink([255, 255, 255]);
  font('normal', 8.5);
  doc.text(`${x.phone}   |   www.kitecab.com   |   ${x.email}`, W / 2, 289.5, {
    align: 'center',
  });

  const safe = String(b.customer_name)
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  doc.save(`KiteCab-${invoiceNo}-${safe || 'invoice'}.pdf`);
}
