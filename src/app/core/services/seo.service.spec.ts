import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { absoluteUrl, SeoService } from './seo.service';

describe('SeoService', () => {
  it('writes title, description, canonical, Open Graph and JSON-LD', () => {
    const seo = TestBed.inject(SeoService);
    const doc = TestBed.inject(DOCUMENT);
    seo.set({
      title: 'Raipur to Bilaspur Taxi',
      description: 'Fixed fare cab.',
      path: '/taxi/raipur-to-bilaspur',
      jsonLd: { '@type': 'TaxiService', name: '</script><b>' },
    });

    expect(doc.title).toBe('Raipur to Bilaspur Taxi | KiteCab');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Fixed fare cab.');
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://kitecab.com/taxi/raipur-to-bilaspur');
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://kitecab.com/taxi/raipur-to-bilaspur');
    const ld = doc.querySelector('script[data-kc-jsonld]')!.textContent!;
    expect(ld).not.toContain('</script>');
    expect(JSON.parse(ld).name).toBe('</script><b>');
  });

  it('does not repeat the brand and replaces old JSON-LD', () => {
    const seo = TestBed.inject(SeoService);
    const doc = TestBed.inject(DOCUMENT);
    seo.set({ title: 'A', description: 'a', path: '/a', jsonLd: { a: 1 } });
    seo.set({ title: 'KiteCab home', description: 'b', path: '/' });
    expect(doc.title).toBe('KiteCab home');
    expect(doc.querySelectorAll('script[data-kc-jsonld]').length).toBe(0);
  });

  it('builds absolute URLs', () => {
    expect(absoluteUrl('/')).toBe('https://kitecab.com/');
    expect(absoluteUrl('refund-policy/')).toBe('https://kitecab.com/refund-policy');
  });
});
