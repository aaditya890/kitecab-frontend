import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SITE } from '../../core/config/site.config';
import { inr } from '../../core/utils/fare';
import { CarPrices } from '../../models/catalog.model';
import { CAR_TYPES } from '../../models/common.model';

/** Fares for all three cars as real text (Google reads the prices). */
@Component({
  selector: 'kc-fare-table',
  template: `
    <div class="overflow-x-auto rounded-2xl border border-kc-line bg-white">
      <table class="w-full min-w-[420px] text-left">
        <caption class="sr-only">{{ caption() }}</caption>
        <thead class="bg-kc-surface text-sm text-kc-muted">
          <tr>
            <th scope="col" class="px-5 py-3 font-medium">Car</th>
            <th scope="col" class="px-5 py-3 font-medium">Seats</th>
            <th scope="col" class="px-5 py-3 font-medium">{{ priceLabel() }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-kc-line">
          @for (c of cars; track c) {
            <tr>
              <th scope="row" class="px-5 py-4 font-semibold">{{ c }}</th>
              <td class="px-5 py-4 text-kc-muted">{{ seats[c] }} + driver</td>
              <td class="px-5 py-4 text-lg font-bold">{{ inr(fares()[c]) }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <p class="mt-2 text-xs text-kc-muted">{{ note }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FareTableComponent {
  readonly fares = input.required<CarPrices>();
  readonly caption = input('Fares by car type');
  readonly priceLabel = input('One way fare');

  protected readonly cars = CAR_TYPES;
  protected readonly seats = SITE.fares.seats;
  protected readonly note = SITE.fares.extrasNote;
  protected readonly inr = inr;
}
