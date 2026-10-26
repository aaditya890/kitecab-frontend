/** '+919009611602' or '9009611602' -> '919009611602' (digits with country code). */
export function toInternationalDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

/** '+919009611602' -> '+91 90096 11602'. Unknown formats are returned unchanged. */
export function formatIndianPhone(phone: string): string {
  const digits = toInternationalDigits(phone);
  if (digits.length !== 12 || !digits.startsWith('91')) return phone;
  return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
}

/** wa.me link with an optional prefilled message. */
export function whatsappLink(whatsapp: string, text?: string): string {
  const base = `https://wa.me/${toInternationalDigits(whatsapp)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
