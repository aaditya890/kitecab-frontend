// schema.org builders (JSON-LD). Google uses these for rich results.
import { SITE } from '../config/site.config';
import { absoluteUrl } from '../services/seo.service';

type Json = Record<string, unknown>;

export interface FaqItem {
  q: string;
  a: string;
}

export interface Crumb {
  name: string;
  path: string;
}

const businessId = `${SITE.url}/#business`;

/** The business itself. Referenced by every service via @id. */
export function localBusiness(): Json {
  const c = SITE.contact;
  return {
    '@type': 'LocalBusiness',
    '@id': businessId,
    name: SITE.name,
    legalName: SITE.legalName,
    url: `${SITE.url}/`,
    logo: absoluteUrl(SITE.images.logoPng),
    image: absoluteUrl(SITE.images.ogDefault),
    telephone: c.phone,
    email: c.email,
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Card',
    openingHours: 'Mo-Su 00:00-23:59',
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.address.line,
      addressLocality: c.address.city,
      addressRegion: c.address.region,
      ...(c.address.postalCode ? { postalCode: c.address.postalCode } : {}),
      addressCountry: c.address.country,
    },
    areaServed: [
      { '@type': 'State', name: 'Chhattisgarh' },
      ...SITE.keyCities.map((name) => ({ '@type': 'City', name })),
    ],
    sameAs: Object.values(SITE.social),
  };
}

export function website(): Json {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: `${SITE.url}/`,
    name: SITE.name,
    publisher: { '@id': businessId },
  };
}

/** A taxi service on a route or in a city, with its price range in INR. */
export function taxiService(opts: {
  name: string;
  path: string;
  area: string[];
  lowPrice?: number;
  highPrice?: number;
  description?: string;
}): Json {
  return {
    '@type': 'TaxiService',
    name: opts.name,
    url: absoluteUrl(opts.path),
    ...(opts.description ? { description: opts.description } : {}),
    provider: { '@id': businessId },
    areaServed: opts.area.map((name) => ({ '@type': 'City', name })),
    ...(opts.lowPrice
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: opts.lowPrice,
            highPrice: opts.highPrice ?? opts.lowPrice,
            offerCount: 3,
          },
        }
      : {}),
  };
}

export function breadcrumbs(items: Crumb[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function faqPage(items: FaqItem[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Wraps several schema objects into one @graph document. */
export function graph(...nodes: Json[]): Json {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
