import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  CatalogFile,
  RentalPackage,
  RoundTripRate,
  RouteFare,
} from '../../models/catalog.model';

/**
 * Locations, fares, rental packages and round-trip rates for the booking form.
 *
 * Source: kitecab-backend GET /api/catalog (live from the database, CDN-cached
 * for a minute, so admin price changes and on/off switches show up quickly).
 * If the API is down, the build-time copy /data/catalog.json is used instead.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly file = signal<CatalogFile | null>(null);
  private requested = false;

  readonly ready = computed(() => this.file() !== null);
  readonly failed = signal(false);
  readonly locations = computed(() => this.file()?.locations ?? []);
  readonly rentals = computed<RentalPackage[]>(
    () => this.file()?.rentals ?? [],
  );
  readonly roundTripRates = computed<RoundTripRate[]>(
    () => this.file()?.roundTrip ?? [],
  );

  /** "from|to" -> fare, for instant lookups while typing. */
  private readonly routeIndex = computed(() => {
    const f = this.file();
    const map = new Map<string, RouteFare>();
    if (!f) return map;
    for (const [a, b, km, h, s, suv] of f.routes) {
      map.set(`${f.locations[a]}|${f.locations[b]}`, {
        km,
        fares: { Hatchback: h, Sedan: s, SUV: suv },
      });
    }
    return map;
  });

  private readonly destinationIndex = computed(() => {
    const f = this.file();
    const map = new Map<string, string[]>();
    if (!f) return map;
    for (const [a, b] of f.routes) {
      const from = f.locations[a];
      map.set(from, [...(map.get(from) ?? []), f.locations[b]]);
    }
    return map;
  });

  /** Loads once, in the browser only (prerendered pages don't need it). */
  load(): void {
    if (!this.isBrowser || this.requested) return;
    this.requested = true;
    this.http
      .get<CatalogFile>(`${environment.apiUrl}/catalog`)
      .pipe(
        timeout(4000),
        catchError(() => this.http.get<CatalogFile>('/data/catalog.json')),
      )
      .subscribe({
        next: (f) => this.file.set(f),
        error: () => {
          this.requested = false;
          this.failed.set(true);
        },
      });
  }

  isLocation(name: string): boolean {
    return this.locations().includes(name);
  }

  /** Places you can go to from `pickup` (one way / round trip). */
  destinations(pickup: string): string[] {
    return this.destinationIndex().get(pickup) ?? [];
  }

  fare(pickup: string, drop: string): RouteFare | null {
    return this.routeIndex().get(`${pickup}|${drop}`) ?? null;
  }
}
