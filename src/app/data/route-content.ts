import { SITE } from '../core/config/site.config';
import { FaqItem } from '../core/seo/schema';
import { inr, lowestFare, travelTime } from '../core/utils/fare';
import { SeoRoute } from '../models/catalog.model';
import { PLACE_BY_KEY } from './places';
import { reverseOf } from './seo-routes';

/** Text for a route page, built from the route's real numbers and the places' own content. */
export interface RouteContent {
  title: string;
  description: string;
  h1: string;
  intro: string;
  about: string[];
  faqs: FaqItem[];
}

const isAirport = (key: string) => /airport/i.test(key);

export function routeContent(r: SeoRoute): RouteContent {
  const from = PLACE_BY_KEY.get(r.from);
  const to = PLACE_BY_KEY.get(r.to);
  const time = travelTime(r.km);
  const low = inr(lowestFare(r.fares));
  const { Hatchback: h, Sedan: s, SUV: suv } = r.fares;
  const airportTrip = isAirport(r.from) || isAirport(r.to);
  const reverse = reverseOf(r);
  const advance = SITE.fares.advancePercent;

  const title = `${r.fromName} to ${r.toName} Taxi Fare ${low} One Way | KiteCab`;
  const description =
    `Book a ${r.fromName} to ${r.toName} cab from ${low}. ${r.km} km, about ${time}. ` +
    `Hatchback ${inr(h)}, Sedan ${inr(s)}, SUV ${inr(suv)} — one way fare, no return charge.`;

  const intro =
    `Book a one way taxi from ${r.fromName} to ${r.toName} with KiteCab. The trip is ${r.km} km and takes about ${time}. ` +
    `Fares start at ${low} for a Hatchback, ${inr(s)} for a Sedan and ${inr(suv)} for an SUV, and you pay only for the one way drop — no return fare.`;

  const about: string[] = [];
  if (airportTrip) {
    about.push(
      isAirport(r.from)
        ? `Your driver meets you at Swami Vivekananda Airport, Raipur, and takes you straight to ${r.toName}. Share your flight number when you book and we track the arrival time.`
        : `We plan the pickup in ${r.fromName} around your flight time so you reach Swami Vivekananda Airport, Raipur, with time to check in.`,
    );
  }
  if (from) about.push(from.blurb);
  if (to) about.push(to.blurb);
  about.push(
    `Pickup is from your home, hotel, office or the railway station in ${r.fromName}, and the car drops you at your exact address in ${r.toName}. ` +
      `Need the cab to wait and bring you back? Choose a round trip when you book.`,
  );

  const faqs: FaqItem[] = [
    {
      q: `What is the taxi fare from ${r.fromName} to ${r.toName}?`,
      a: `A one way cab from ${r.fromName} to ${r.toName} costs ${inr(h)} for a Hatchback, ${inr(s)} for a Sedan and ${inr(suv)} for an SUV. ${SITE.fares.extrasNote}`,
    },
    {
      q: `How far is ${r.toName} from ${r.fromName} by road?`,
      a: `${r.toName} is about ${r.km} km from ${r.fromName} by road.`,
    },
    {
      q: `How long does the ${r.fromName} to ${r.toName} cab take?`,
      a: `The drive usually takes about ${time}, depending on traffic and stops on the way.`,
    },
    {
      q: `Do I pay a return fare for a one way ${r.fromName} to ${r.toName} taxi?`,
      a: `No. The one way fare covers only your drop from ${r.fromName} to ${r.toName}. You don’t pay for the car’s return journey.`,
    },
    {
      q: `Which car should I book for ${r.fromName} to ${r.toName}?`,
      a: `A Hatchback suits up to 4 passengers with light luggage, a Sedan gives more boot space for 4, and an SUV seats up to 6 — best for families and groups.`,
    },
    {
      q: `How do I book and pay?`,
      a: `Enter your mobile number above and press Check price, choose a car and add your pickup details. You pay a ${advance}% advance online to confirm, and the rest to the driver at the end of the trip, by cash or UPI.`,
    },
    {
      q: `Can I cancel my ${r.fromName} to ${r.toName} booking?`,
      a: `Yes. Cancel before the driver is dispatched and your full advance is refunded. See our cancellation and refund policy for details.`,
    },
  ];
  if (reverse) {
    faqs.push({
      q: `Is the ${r.toName} to ${r.fromName} fare the same?`,
      a: `The return trip from ${r.toName} to ${r.fromName} starts at ${inr(lowestFare(reverse.fares))}. You can book it as a separate one way cab.`,
    });
  }

  return { title, description, h1: `${r.fromName} to ${r.toName} taxi`, intro, about, faqs };
}
