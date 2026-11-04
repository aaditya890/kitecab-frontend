import { SITE } from '../core/config/site.config';
import { FaqItem } from '../core/seo/schema';
import { inr, lowestFare, rentalDisplay, roundTripFares } from '../core/utils/fare';
import { RentalPackage, RoundTripRate } from '../models/catalog.model';
import { BookingType } from '../models/common.model';
import rentalsJson from './rentals.json';
import roundTripJson from './round-trip.json';
import { SEO_ROUTE_BY_SLUG, SEO_ROUTES } from './seo-routes';

export const RENTALS = rentalsJson as RentalPackage[];
export const ROUND_TRIP_RATES = roundTripJson as RoundTripRate[];

export interface ServicePage {
  path: string;
  type: BookingType;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  steps: string[];
  faqs: FaqItem[];
}

const cheapestRoute = Math.min(...SEO_ROUTES.map((r) => lowestFare(r.fares)));
const exampleRate = ROUND_TRIP_RATES.find((r) => r.slot === '1 day') ?? ROUND_TRIP_RATES[0];
const exampleKm = 250;
const example = roundTripFares(exampleRate, exampleKm);
const advance = SITE.fares.advancePercent;
const raipurBilaspur = SEO_ROUTE_BY_SLUG.get('raipur-to-bilaspur');

export const SERVICES: Record<'one-way' | 'round-trip' | 'local-rental', ServicePage> = {
  'one-way': {
    path: '/one-way-taxi',
    type: 'oneway',
    title: `One Way Taxi in Chhattisgarh – Drop Fare from ${inr(cheapestRoute)} | KiteCab`,
    description: `One way cab across Chhattisgarh and to Nagpur. Pay only for your drop — no return fare. Raipur, Bilaspur, Durg, Bhilai, Korba, Raigarh from ${inr(cheapestRoute)}.`,
    h1: 'One way taxi in Chhattisgarh',
    intro: [
      'Going one way? With a KiteCab one way taxi you pay only for your drop, not for the car’s empty return. It is the cheapest way to travel between cities in Chhattisgarh when you don’t need the car to come back with you.',
      `We cover more than a thousand one way routes across the state — Raipur to Bilaspur, Bilaspur to Korba, Raipur Airport to Bhilai and Durg, Raipur to Jagdalpur, Raigarh and Nagpur — with fixed fares for Hatchback, Sedan and SUV.`,
    ],
    steps: ['Enter pickup, drop and your mobile number', 'See fares for Hatchback, Sedan and SUV', `Confirm with a ${advance}% advance; pay the rest to the driver`],
    faqs: [
      { q: 'What is a one way taxi?', a: 'A one way taxi drops you at your destination and you pay only for that trip. You are not charged for the car’s return journey.' },
      { q: 'How much does a one way cab cost in Chhattisgarh?', a: `Fares depend on the route and car. Our one way fares start at ${inr(cheapestRoute)}` + (raipurBilaspur ? `; for example Raipur to Bilaspur is ${inr(raipurBilaspur.fares.Hatchback)} in a Hatchback.` : '.') },
      { q: 'Can I stop on the way?', a: 'Short stops for food or rest are fine. Tell us about extra pickups or detours when you book so the fare can be confirmed.' },
      { q: 'Do you go outside Chhattisgarh?', a: 'Yes. Nagpur is a regular route, and we also drop to other cities near the border on request.' },
      { q: 'How do I pay?', a: `Pay a ${advance}% advance online to confirm the booking, and the balance to the driver in cash or by UPI at the end of the trip.` },
    ],
  },
  'round-trip': {
    path: '/round-trip-cab',
    type: 'round-trip',
    title: 'Round Trip Cab in Chhattisgarh – Outstation Taxi | KiteCab',
    description: `Round trip outstation cab from Raipur, Bilaspur, Durg and Bhilai. The car waits and brings you back. Rates by km and waiting time, Hatchback, Sedan and SUV.`,
    h1: 'Round trip cab in Chhattisgarh',
    intro: [
      'Book a round trip cab when you need the car to wait — for a meeting, a temple visit, a wedding or a day of sightseeing — and bring you home again.',
      'The fare is simple: a rate per kilometre for the total distance up and down, plus a fixed amount for the waiting time you choose, from a few hours to three days.',
    ],
    steps: ['Choose pickup, destination and waiting time', 'Enter the total kilometres up and down', 'See the fare for each car and book'],
    faqs: [
      { q: 'How is the round trip fare calculated?', a: `Fare = rate per km × total km + a fixed amount for the waiting time. For example, ${exampleKm} km with a 1 day wait costs ${inr(example.Hatchback)} in a Hatchback, ${inr(example.Sedan)} in a Sedan and ${inr(example.SUV)} in an SUV.` },
      { q: 'What does waiting time mean?', a: 'It is how long the car stays with you at your destination before the return drive — 1–3 hours, 3–6 hours, 6–9 hours, or 1, 2 or 3 days.' },
      { q: 'Is round trip cheaper than two one way cabs?', a: 'For same-day trips with short waits, a round trip is usually better value and you keep the same car and driver. For trips of several days, compare both in the booking form.' },
      { q: 'Are the driver’s food and stay included?', a: 'Tell us your plan when you book and we will confirm what is included for multi-day trips.' },
      { q: 'Can I visit more than one place?', a: 'Yes. Add all your stops to the total kilometres, and mention them when you book.' },
    ],
  },
  'local-rental': {
    path: '/local-taxi-rental',
    type: 'local-rental',
    title: `Local Taxi Rental – Hourly Cab from ${inr(RENTALS[0]?.hatchback ?? 0)} | KiteCab`,
    description: `Hire a cab by the hour in Raipur, Bilaspur, Durg, Bhilai and across Chhattisgarh. ${RENTALS.map((r) => `${r.hours} hr ${r.km} km`).join(', ')} packages.`,
    h1: 'Local taxi rental by the hour',
    intro: [
      'Need a car for a few hours in the city? A local rental gives you a cab with a driver for a fixed number of hours and kilometres — for office visits, shopping, hospital trips or meeting family.',
      `Packages start at ${RENTALS[0] ? `${rentalDisplay(RENTALS[0])} for ${inr(RENTALS[0].hatchback)}` : 'a few hours'}, in Raipur, Bilaspur, Durg, Bhilai and every city we serve.`,
    ],
    steps: ['Choose your city and a package', 'See prices for Hatchback, Sedan and SUV', 'Book — the car stays with you for the package time'],
    faqs: [
      { q: 'What local rental packages do you have?', a: RENTALS.map((r) => `${rentalDisplay(r)}: ${inr(r.hatchback)} (Hatchback), ${inr(r.sedan)} (Sedan), ${inr(r.suv)} (SUV)`).join('. ') + '.' },
      { q: 'What if I use more hours or kilometres?', a: 'Extra hours and kilometres are charged at the rates told to you when you book.' },
      { q: 'Can I go outside the city on a rental?', a: 'Local rentals are for travel within and around the city. For trips to another city, book a one way or round trip cab.' },
      { q: 'Is a driver included?', a: 'Yes, every rental comes with a driver. Self-drive cars are not offered.' },
    ],
  },
};
