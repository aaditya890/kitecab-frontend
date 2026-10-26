import { formatIndianPhone, toInternationalDigits, whatsappLink } from './phone';

describe('phone utils', () => {
  it('normalises Indian numbers', () => {
    expect(toInternationalDigits('+91 90096 11602')).toBe('919009611602');
    expect(toInternationalDigits('9009611602')).toBe('919009611602');
  });
  it('formats for display', () => {
    expect(formatIndianPhone('+919009611602')).toBe('+91 90096 11602');
    expect(formatIndianPhone('9009611602')).toBe('+91 90096 11602');
  });
  it('builds wa.me links with an encoded message', () => {
    expect(whatsappLink('+91 90096 11602', 'Hi KiteCab')).toBe('https://wa.me/919009611602?text=Hi%20KiteCab');
  });
});
