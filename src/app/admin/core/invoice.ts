/**
 * Booking invoice PDF — same layout as the old admin panel (navy header with a
 * plum corner, logo, Booking ID card, Invoice Details, one-row Trip Details
 * table, total card, notes, footer). Invoice number = booking ID + 5125.
 *
 * Added: advance paid / balance to driver lines in the total card, and the
 * contact details come from Settings. jsPDF is loaded only when clicked.
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
}

const navy = { r: 14, g: 22, b: 73 }; // #0e1649
const plum = { r: 106, g: 27, b: 110 }; // #6a1b6e

const TYPE_LABEL: Record<string, string> = {
  oneway: 'One Way',
  'round-trip': 'Round Trip',
  'local-rental': 'Local Rental',
};

const dash = (v: unknown) => {
  const s = v == null ? '' : String(v).trim();
  return !s || s.toUpperCase() === 'N/A' ? '-' : s;
};
const formatRs = (n: number) =>
  `RS ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0)}`;
const ddmmyyyy = (iso: string) => {
  const [y, m, d] = (iso || '').slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '-';
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

export async function downloadInvoice(
  b: InvoiceBooking,
  extra: InvoiceExtras,
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // HEADER
  const headerH = 48;
  doc.setFillColor(navy.r, navy.g, navy.b);
  doc.rect(0, 0, 210, headerH, 'F');
  doc.setFillColor(plum.r, plum.g, plum.b);
  doc.triangle(156, 0, 210, 0, 210, headerH, 'F');

  const logo = { x: 12, y: 8, w: 38, h: 38 };
  try {
    doc.addImage(
      await dataUrl('/assets/invoice-logo.png'),
      'PNG',
      logo.x,
      logo.y,
      logo.w,
      logo.h,
    );
  } catch {
    /* invoice still works without the logo */
  }

  const invoiceX = 198;
  const invoiceY = 20;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('INVOICE', invoiceX, invoiceY, { align: 'right' });
  doc.setFontSize(10);
  doc.text('KITECAB - SAFEST TAXI PARTNER', invoiceX, invoiceY + 8, {
    align: 'right',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const a = SITE.contact.address;
  doc.text(`Address: ${a.line},`, invoiceX, invoiceY + 14, { align: 'right' });
  doc.text(
    `${a.city}, ${a.region} - ${a.postalCode || '492001'}`,
    invoiceX,
    invoiceY + 19,
    { align: 'right' },
  );

  // BOOKING ID CARD
  const cardsTop = headerH + 8;
  const bill = { x: 12, y: cardsTop, w: 118, h: 28 };
  doc.setDrawColor(plum.r, plum.g, plum.b);
  doc.setLineWidth(1.2);
  doc.roundedRect(bill.x, bill.y, bill.w, bill.h, 4, 4);
  doc.setLineWidth(0.3);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.setFontSize(11);
  doc.text(`Booking ID: #${b.id}`, bill.x + 4, bill.y + 8.3);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.text(dash(b.customer_name), bill.x + 4, bill.y + 14);
  doc.text(`Mobile: ${dash(b.mobile)}`, bill.x + 4, bill.y + 19);
  doc.text(`Email: ${dash(b.email)}`, bill.x + 4, bill.y + 24);

  // INVOICE DETAILS
  const meta = { x: 142, y: cardsTop, w: 56, h: 24 };
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(meta.x, meta.y, meta.w, meta.h, 3, 3, 'F');
  doc.setDrawColor(220, 220, 225);
  doc.roundedRect(meta.x, meta.y, meta.w, meta.h, 3, 3);
  doc.setDrawColor(plum.r, plum.g, plum.b);
  doc.setLineWidth(0.8);
  doc.line(meta.x, meta.y, meta.x + meta.w, meta.y);
  doc.setLineWidth(0.3);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.setFontSize(10);
  doc.text('Invoice Details', meta.x + meta.w / 2, meta.y + 7, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9.5);
  const invoiceNo = (b.id + 5125).toString().padStart(6, '0');
  doc.text(`Invoice Number: INV${invoiceNo}`, meta.x + 6, meta.y + 13);
  doc.text(
    `Invoice Date: ${new Date().toLocaleDateString('en-GB')}`,
    meta.x + 6,
    meta.y + 18,
  );

  // TRIP DETAILS
  let y = Math.max(bill.y + bill.h, meta.y + meta.h) + 12;
  doc.setFillColor(248, 248, 248);
  doc.rect(12, y, 186, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.setFontSize(12);
  doc.text('Trip Details', 16, y + 6);
  doc.setDrawColor(navy.r, navy.g, navy.b);
  doc.setLineWidth(0.6);
  doc.line(12, y + 10, 198, y + 10);
  doc.setLineWidth(0.3);

  const head: string[] = [];
  const row: string[] = [];
  const col = (label: string, value: string) => {
    if (value && value !== '-') {
      head.push(label);
      row.push(value);
    }
  };
  const rental = b.booking_type === 'local-rental';
  col('Booking Type', TYPE_LABEL[b.booking_type] ?? dash(b.booking_type));
  col('Car Type', dash(b.car_type));
  col('Pickup', dash(b.pickup_location));
  if (!rental) col('Drop', dash(b.drop_location));
  col('Pickup Date', ddmmyyyy(b.pickup_date));
  col('Pickup Time', dash(b.pickup_time));
  if (b.booking_type === 'oneway')
    col('Distance', b.distance_km ? `${b.distance_km} km` : '-');
  else if (b.booking_type === 'round-trip') {
    col('Waiting', dash(b.waiting_time));
    col('Distance', b.approx_distance_km ? `${b.approx_distance_km} km` : '-');
  } else col('Package', dash(b.rental_package));
  col('Passengers', dash(b.passengers));

  const w = Math.max(20, Math.floor(186 / head.length));
  autoTable(doc, {
    startY: y + 14,
    head: [head],
    body: [row],
    theme: 'grid',
    headStyles: {
      fillColor: [navy.r, navy.g, navy.b],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left',
      valign: 'middle',
    },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2.2,
      overflow: 'linebreak',
      valign: 'middle',
    },
    columnStyles: Object.fromEntries(head.map((_, i) => [i, { cellWidth: w }])),
    margin: { left: 12, right: 12 },
  });
  y =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 28;

  // TOTAL CARD — pickup address left, amounts right
  const address = dash(b.pickup_address);
  const lines: string[] =
    address !== '-' ? doc.splitTextToSize(address, 186 - 70 - 12) : [];
  const paid = Math.max(0, extra.advancePaid || 0);
  const amountRows = paid > 0 ? 2 : 0;
  const cardH = Math.max(
    28 + amountRows * 6,
    14 + (lines.length ? 6 + lines.length * 4.8 : 0),
  );
  const card = { x: 12, y: y + 14, w: 186, h: cardH };
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(card.x, card.y, card.w, card.h, 3, 3, 'F');
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(card.x, card.y, card.w, card.h, 3, 3);
  doc.setFillColor(plum.r, plum.g, plum.b);
  doc.rect(card.x, card.y, 3, card.h, 'F');

  if (lines.length) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(navy.r, navy.g, navy.b);
    doc.setFontSize(10.5);
    doc.text('Pickup Address', card.x + 8, card.y + 9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9.5);
    doc.text(lines, card.x + 8, card.y + 15);
  }

  const right = card.x + card.w - 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.setFontSize(11.5);
  doc.text('Total (All taxes included)', right, card.y + 9, { align: 'right' });
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(17);
  doc.text(formatRs(b.fare), right, card.y + 18, { align: 'right' });
  if (paid > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`Advance paid online: ${formatRs(paid)}`, right, card.y + 25, {
      align: 'right',
    });
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Balance to driver: ${formatRs(Math.max(0, b.fare - paid))}`,
      right,
      card.y + 31,
      { align: 'right' },
    );
  }

  // NOTES
  let notesY = card.y + card.h + 14;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(navy.r, navy.g, navy.b);
  doc.setFontSize(12);
  doc.text('Additional Information', 12, notesY);
  doc.setDrawColor(plum.r, plum.g, plum.b);
  doc.setLineWidth(0.6);
  doc.line(12, notesY + 2, 40, notesY + 2);
  doc.setLineWidth(0.3);
  notesY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 55, 55);
  doc.setFontSize(10);
  for (const n of [
    'Please check trip details and report any issue within 24 hrs.',
    'System-generated invoice — no signature required.',
    'Thank you for choosing Kite Cab.',
  ]) {
    doc.text(`• ${n}`, 12, notesY);
    notesY += 6;
  }

  // FOOTER
  doc.setDrawColor(230, 230, 230);
  doc.line(12, 287, 198, 287);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Contact: ${extra.phone}  |  Website: www.kitecab.com  |  Email: ${extra.email}`,
    105,
    293,
    { align: 'center' },
  );
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${i} of ${pages}`, 198, 293, { align: 'right' });
  }

  const safe = String(b.customer_name)
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
  doc.save(`${safe || 'KiteCab'}-Invoice.pdf`);
}
