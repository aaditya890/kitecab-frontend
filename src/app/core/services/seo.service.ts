import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { SITE } from '../config/site.config';

export interface PageSeo {
  /** Page title without the brand; " | KiteCab" is added unless the title already has it. */
  title: string;
  /** 140–160 characters, written for people searching on Google. */
  description: string;
  /** Path of this page, e.g. '/refund-policy'. Used for the canonical URL. */
  path: string;
  image?: string;
  type?: 'website' | 'article';
  /** Keep this page out of Google (thank-you pages, admin…). */
  noindex?: boolean;
  /** Structured data (schema.org) for rich results. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Sets everything Google and social apps read for a page: title, description,
 * canonical URL, robots, Open Graph, Twitter card and JSON-LD.
 * Runs during prerender, so it all ends up in the static HTML.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  set(seo: PageSeo): void {
    const fullTitle = seo.title.includes(SITE.name) ? seo.title : `${seo.title} | ${SITE.name}`;
    const url = absoluteUrl(seo.path);
    const image = absoluteUrl(seo.image ?? SITE.images.ogDefault);
    const indexable = environment.indexable && !seo.noindex;

    this.title.setTitle(fullTitle);
    this.tag('name', 'description', seo.description);
    this.tag('name', 'robots', indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');

    this.tag('property', 'og:type', seo.type ?? 'website');
    this.tag('property', 'og:site_name', SITE.name);
    this.tag('property', 'og:locale', SITE.locale);
    this.tag('property', 'og:title', fullTitle);
    this.tag('property', 'og:description', seo.description);
    this.tag('property', 'og:url', url);
    this.tag('property', 'og:image', image);

    this.tag('name', 'twitter:card', 'summary_large_image');
    this.tag('name', 'twitter:title', fullTitle);
    this.tag('name', 'twitter:description', seo.description);
    this.tag('name', 'twitter:image', image);

    this.setCanonical(url);
    this.setJsonLd(seo.jsonLd);
  }

  private tag(attr: 'name' | 'property', key: string, content: string): void {
    this.meta.updateTag({ [attr]: key, content }, `${attr}="${key}"`);
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data: PageSeo['jsonLd']): void {
    this.document.head.querySelectorAll('script[data-kc-jsonld]').forEach((el) => el.remove());
    if (!data) return;
    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-kc-jsonld', '');
    // Escape "<" so a value can never close the script tag.
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }
}

/** '/refund-policy' -> 'https://kitecab.com/refund-policy' (no trailing slash except home). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const clean = ('/' + path.replace(/^\/+/, '')).replace(/\/+$/, '') || '/';
  return clean === '/' ? `${SITE.url}/` : `${SITE.url}${clean}`;
}
