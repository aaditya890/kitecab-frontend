import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  afterEach(() => delete (window as unknown as { gtag?: unknown }).gtag);

  it('fires the exact same Check Price conversion as the live site', () => {
    const calls: unknown[][] = [];
    (window as unknown as { gtag: (...a: unknown[]) => void }).gtag = (...a) => calls.push(a);
    TestBed.inject(AnalyticsService).trackCheckPrice();
    expect(calls).toEqual([['event', 'conversion', { send_to: 'AW-17814447196/8BPHCL3KuNMbENzIy65C' }]]);
  });

  it('does nothing when gtag is blocked', () => {
    expect(() => TestBed.inject(AnalyticsService).trackCheckPrice()).not.toThrow();
  });
});
