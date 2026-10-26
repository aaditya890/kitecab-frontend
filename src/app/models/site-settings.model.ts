/** Contact details shown on the website. Defaults come from site.config.ts; admin can override them in Settings. */
export interface ContactInfo {
  /** E.164, e.g. +919009611602 */
  phone: string;
  /** Human format, e.g. +91 90096 11602 */
  phoneDisplay: string;
  /** Digits with country code, e.g. 919009611602 */
  whatsapp: string;
  email: string;
  address: {
    line: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
}

/** A row of the public `settings` table. */
export interface SettingRow {
  key: string;
  value: unknown;
}
