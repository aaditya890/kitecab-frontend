import { SITE } from '../config/site.config';
import { ContactInfo } from '../../models/site-settings.model';
import { applySettings } from './site-settings.service';

const defaults = structuredClone(SITE.contact) as ContactInfo;

describe('applySettings (admin overrides)', () => {
  it('keeps defaults when the database has nothing', () => {
    expect(applySettings(defaults, [])).toEqual(defaults);
  });

  it('uses the admin phone, email, WhatsApp and address', () => {
    const next = applySettings(defaults, [
      { key: 'support_phone', value: '+91 98765 43210' },
      { key: 'support_whatsapp', value: '9876500000' },
      { key: 'support_email', value: 'help@kitecab.com' },
      { key: 'business', value: { name: 'KiteCab', address: 'New Office, VIP Road', gstin: '' } },
    ]);
    expect(next.phone).toBe('+919876543210');
    expect(next.phoneDisplay).toBe('+91 98765 43210');
    expect(next.whatsapp).toBe('919876500000');
    expect(next.email).toBe('help@kitecab.com');
    expect(next.address.line).toBe('New Office, VIP Road');
    expect(next.address.city).toBe('Raipur');
  });

  it('ignores empty or broken values', () => {
    const next = applySettings(defaults, [
      { key: 'support_phone', value: '123' },
      { key: 'support_email', value: 'not-an-email' },
      { key: 'business', value: { address: '   ' } },
    ]);
    expect(next).toEqual(defaults);
  });
});
