/**
 * Business details in ONE place.
 *
 * These are the DEFAULTS. Phone, WhatsApp, email and address can also be changed
 * from Admin → Settings without a new deploy (see SiteSettingsService); the
 * website then shows the admin's values.
 *
 * Secrets (payment, WhatsApp API keys) are NEVER here — they live in kitecab-backend.
 */
export const SITE = {
  name: 'KiteCab',
  legalName: 'KiteCab Taxi Service',
  url: 'https://kitecab.com',
  tagline: 'Taxi service in Chhattisgarh',
  locale: 'en_IN',

  contact: {
    phone: '+919009611602',
    phoneDisplay: '+91 90096 11602',
    whatsapp: '919009611602',
    email: 'kitecabtaxiservice@gmail.com',
    address: {
      line: 'Kandul Road, Sejbahar, Kamal Vihar',
      city: 'Raipur',
      region: 'Chhattisgarh',
      postalCode: '',
      country: 'IN',
    },
  },

  /** Default WhatsApp chat message. */
  whatsappGreeting: 'Hi KiteCab, I want to book a cab.',

  /** Areas we rank for (SEO): Chhattisgarh first, Nagpur as the border city. */
  serviceArea: ['Chhattisgarh', 'Nagpur'],

  /** Main cities named across the site (SEO). Order = importance. */
  keyCities: ['Raipur', 'Bilaspur', 'Durg', 'Bhilai', 'Raigarh', 'Korba', 'Ambikapur', 'Jagdalpur', 'Rajnandgaon', 'Nagpur'],

  images: {
    /** Vector mark (any size). Raster badge for places that need PNG (invoice, social). */
    logo: '/assets/brand/kitecab-mark.svg',
    logoPng: '/assets/logo-badge.png',
    ogDefault: '/assets/20241024_121332.png',
  },

  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61568161917950',
    instagram: 'https://www.instagram.com/kitecab_/',
    x: 'https://x.com/kitecab127406',
  },

  /** Tracking IDs — same as the live site. Do not change without the owner's OK. */
  analytics: {
    ga4: 'G-T836ZN3ZW3',
    gtagLoaderId: 'G-F0DRP723DL',
    googleAds: 'AW-17814447196',
    gtm: 'GTM-53VC3R5Q',
    /** Fired on "Check price" for one way, round trip and local rental. */
    checkPriceConversion: 'AW-17814447196/8BPHCL3KuNMbENzIy65C',
  },
} as const;
