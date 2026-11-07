/**
 * Hand-written content about the places we serve. This is what makes each city and
 * route page unique for Google, so keep it factual and local.
 *
 * `key` must match the location name in the fare data exactly (e.g. 'Nagpur (MH)').
 * Places with `hub` get their own city page at /taxi-service/<slug>.
 */
export interface Place {
  key: string;
  name: string;
  slug: string;
  /** One or two sentences, used on route pages that start or end here. */
  blurb: string;
  hub?: CityHub;
}

export interface CityHub {
  /** Page heading keyword, e.g. "Taxi service in Raipur". */
  heading: string;
  /** Opening paragraphs of the city page. */
  intro: string[];
  /** Well-known places people travel to or from in this city. */
  landmarks: string[];
  /** Railway stations / airport for pickup text. */
  stations: string[];
}

export const PLACES: Place[] = [
  {
    key: 'Raipur',
    name: 'Raipur',
    slug: 'raipur',
    blurb:
      'Raipur is the capital of Chhattisgarh and the state’s main travel hub, with Raipur Junction railway station and Swami Vivekananda Airport.',
    hub: {
      heading: 'Taxi service in Raipur',
      intro: [
        'KiteCab is based in Raipur, so this is where most of our trips start. We run one way drops, round trips, airport transfers and local rental cabs from every part of the city — Telibandha, Shankar Nagar, Pandri, Tatibandh, Kamal Vihar, Mowa and Naya Raipur.',
        'From Raipur we cover every district of Chhattisgarh and drive to Nagpur. Popular trips are Raipur to Bilaspur, Raipur to Jagdalpur, Raipur to Raigarh and Raipur to Korba, along with daily transfers between the city and Swami Vivekananda Airport.',
      ],
      landmarks: [
        'Swami Vivekananda Airport (Mana)',
        'Raipur Junction railway station',
        'Naya Raipur (Atal Nagar)',
        'Telibandha Lake (Marine Drive)',
        'Purkhauti Muktangan',
        'AIIMS Raipur',
      ],
      stations: ['Raipur Junction', 'Swami Vivekananda Airport'],
    },
  },
  {
    key: 'Raipur Airport',
    name: 'Raipur Airport',
    slug: 'raipur-airport',
    blurb:
      'Swami Vivekananda Airport at Mana is Raipur’s airport and the main airport for Chhattisgarh, about 15 km from central Raipur.',
    hub: {
      heading: 'Raipur Airport taxi',
      intro: [
        'Book a cab to or from Swami Vivekananda Airport, Raipur, at a fixed fare. Our driver waits at the arrivals area for your flight, and for drops we plan the pickup time around your flight so you reach the airport with time to spare.',
        'Most of our airport trips connect Raipur Airport with Bilaspur, Bhilai, Durg, Korba, Raigarh and Rajnandgaon — no need to change from a city cab to an outstation taxi.',
      ],
      landmarks: ['Arrivals and departures, Swami Vivekananda Airport', 'Mana Camp', 'Naya Raipur', 'Raipur city'],
      stations: ['Swami Vivekananda Airport, Mana'],
    },
  },
  {
    key: 'Bilaspur',
    name: 'Bilaspur',
    slug: 'bilaspur',
    blurb:
      'Bilaspur is Chhattisgarh’s second-largest city, home to the Chhattisgarh High Court, SECL headquarters and the South East Central Railway zone.',
    hub: {
      heading: 'Taxi service in Bilaspur',
      intro: [
        'Book a KiteCab taxi in Bilaspur for trips to Raipur and Raipur Airport, Korba, Raigarh, Ambikapur and every town in between. Bilaspur to Raipur is one of our busiest routes, with cabs running at all hours.',
        'We pick up from homes, hotels, Bilaspur railway station, Uslapur station and the High Court area, and offer local rental cabs for full-day use in the city.',
      ],
      landmarks: [
        'Bilaspur railway station',
        'Chhattisgarh High Court',
        'SECL headquarters',
        'Uslapur station',
        'Mahamaya Temple, Ratanpur',
        'Achanakmar Tiger Reserve',
      ],
      stations: ['Bilaspur Junction', 'Uslapur', 'Bilasa Devi Kevat Airport'],
    },
  },
  {
    key: 'Durg',
    name: 'Durg',
    slug: 'durg',
    blurb: 'Durg is a district headquarters and twin city of Bhilai, about 40 km west of Raipur on NH-53.',
    hub: {
      heading: 'Taxi service in Durg',
      intro: [
        'KiteCab runs cabs from Durg to Raipur Airport, Raipur, Bilaspur, Rajnandgaon and across Chhattisgarh. Airport transfers between Durg and Raipur Airport are among our most booked trips.',
        'We pick up from Durg railway station and all Durg localities, and the same car can take you anywhere in the Durg–Bhilai area for a local rental.',
      ],
      landmarks: ['Durg Junction railway station', 'Durg–Bhilai twin city area', 'Raipur Airport transfers'],
      stations: ['Durg Junction'],
    },
  },
  {
    key: 'Bhilai',
    name: 'Bhilai',
    slug: 'bhilai',
    blurb: 'Bhilai is home to the Bhilai Steel Plant and IIT Bhilai, and forms a twin city with Durg.',
    hub: {
      heading: 'Taxi service in Bhilai',
      intro: [
        'Book a taxi in Bhilai for airport transfers, one way drops and round trips. Bhilai to Raipur Airport and Bhilai to Bilaspur are two of our most popular routes.',
        'We pick up from Bhilai Nagar, Supela, Smriti Nagar, Nehru Nagar, the steel plant township and Bhilai Power House station.',
      ],
      landmarks: ['Bhilai Steel Plant', 'IIT Bhilai', 'Maitri Bagh', 'Bhilai Power House station'],
      stations: ['Bhilai Power House', 'Durg Junction'],
    },
  },
  {
    key: 'Raigarh',
    name: 'Raigarh',
    slug: 'raigarh',
    blurb:
      'Raigarh is an industrial city on the Kelo river, known for its steel and power plants and the Raigarh gharana of Kathak.',
    hub: {
      heading: 'Taxi service in Raigarh',
      intro: [
        'KiteCab connects Raigarh with Bilaspur, Raipur and Raipur Airport, Korba and nearby industrial towns. Business travellers and families use our cabs for plant visits, station pickups and airport trips.',
        'Pick up from Raigarh railway station or anywhere in town, with Hatchback, Sedan and SUV cars available.',
      ],
      landmarks: ['Raigarh railway station', 'Kelo river', 'Industrial areas around Raigarh'],
      stations: ['Raigarh railway station'],
    },
  },
  {
    key: 'Korba',
    name: 'Korba',
    slug: 'korba',
    blurb:
      'Korba is the power capital of Chhattisgarh, with NTPC Korba and some of India’s largest coal mines at Gevra and Kusmunda.',
    hub: {
      heading: 'Taxi service in Korba',
      intro: [
        'Book a cab from Korba to Bilaspur, Raipur, Raipur Airport and Champa at fixed fares. We serve the power plant townships, mine areas and the city centre.',
        'Bilaspur to Korba is one of our busiest routes, and we also run direct cabs from Korba to Raipur Airport.',
      ],
      landmarks: ['NTPC Korba', 'Gevra and Kusmunda mines', 'Korba railway station', 'Hasdeo Bango dam'],
      stations: ['Korba railway station'],
    },
  },
  {
    key: 'Ambikapur',
    name: 'Ambikapur',
    slug: 'ambikapur',
    blurb:
      'Ambikapur is the headquarters of Surguja district and the gateway to Mainpat, the hill station called the Shimla of Chhattisgarh.',
    hub: {
      heading: 'Taxi service in Ambikapur',
      intro: [
        'KiteCab runs long-distance cabs between Ambikapur and Raipur, Raipur Airport and Bilaspur — a comfortable alternative to the long bus journey across north Chhattisgarh.',
        'Book an SUV for family trips to Mainpat or a Sedan for business travel, with pickup from anywhere in Ambikapur.',
      ],
      landmarks: ['Mainpat', 'Ambikapur town', 'Surguja region'],
      stations: ['Ambikapur railway station'],
    },
  },
  {
    key: 'Jagdalpur',
    name: 'Jagdalpur',
    slug: 'jagdalpur',
    blurb: 'Jagdalpur is the main city of Bastar, close to Chitrakote Falls and famous for the 75-day Bastar Dussehra.',
    hub: {
      heading: 'Taxi service in Jagdalpur',
      intro: [
        'Book a taxi between Jagdalpur and Raipur or Raipur Airport through Kanker and Kondagaon, or plan a trip to Chitrakote and Tirathgarh falls.',
        'Our drivers know the Bastar roads well, and round trips with waiting time are available for sightseeing.',
      ],
      landmarks: ['Chitrakote Falls', 'Tirathgarh Falls', 'Bastar Palace', 'Kanger Valley National Park'],
      stations: ['Jagdalpur railway station', 'Jagdalpur airport'],
    },
  },
  {
    key: 'Rajnandgaon',
    name: 'Rajnandgaon',
    slug: 'rajnandgaon',
    blurb:
      'Rajnandgaon lies on NH-53 west of Durg, on the road to Nagpur, near the Maa Bamleshwari temple at Dongargarh.',
    hub: {
      heading: 'Taxi service in Rajnandgaon',
      intro: [
        'KiteCab connects Rajnandgaon with Raipur, Raipur Airport, Durg and Bhilai, and runs trips to Dongargarh and Nagpur.',
        'Pick up from Rajnandgaon railway station or anywhere in the city.',
      ],
      landmarks: ['Rajnandgaon railway station', 'Maa Bamleshwari temple, Dongargarh', 'NH-53 to Nagpur'],
      stations: ['Rajnandgaon railway station'],
    },
  },
  {
    key: 'Nagpur (MH)',
    name: 'Nagpur',
    slug: 'nagpur',
    blurb:
      'Nagpur in Maharashtra is about 290 km from Raipur along NH-53, with Dr. Babasaheb Ambedkar International Airport.',
    hub: {
      heading: 'Raipur to Nagpur taxi',
      intro: [
        'Nagpur is the one city outside Chhattisgarh we cover as a regular route. Book a one way cab between Nagpur and Raipur, Durg, Bhilai or Rajnandgaon along NH-53.',
        'The drive takes around six hours with a break on the way, and you can be picked up from home, a hotel or the railway station.',
      ],
      landmarks: ['Nagpur railway station', 'Dr. Babasaheb Ambedkar International Airport', 'NH-53 via Rajnandgaon'],
      stations: ['Nagpur Junction', 'Nagpur airport'],
    },
  },

  // ---- towns (route pages only) -------------------------------------------
  {
    key: 'Naya Raipur',
    name: 'Naya Raipur',
    slug: 'naya-raipur',
    blurb: 'Naya Raipur (Atal Nagar) is the planned capital city with the state government offices at Mantralaya.',
  },
  {
    key: 'Bhatapara',
    name: 'Bhatapara',
    slug: 'bhatapara',
    blurb: 'Bhatapara is a railway town in Baloda Bazar district, known for its rice mills.',
  },
  {
    key: 'Baloda Bazar',
    name: 'Baloda Bazar',
    slug: 'baloda-bazar',
    blurb: 'Baloda Bazar is a district headquarters north-east of Raipur, near the cement plants of the region.',
  },
  {
    key: 'Kondagaon',
    name: 'Kondagaon',
    slug: 'kondagaon',
    blurb:
      'Kondagaon in the Bastar region is known for its Dhokra bell-metal craft and lies on the Raipur–Jagdalpur highway.',
  },
  {
    key: 'Kanker',
    name: 'Kanker',
    slug: 'kanker',
    blurb: 'Kanker is a district headquarters on NH-30, the first major town of the Bastar region coming from Raipur.',
  },
  {
    key: 'Dhamtari',
    name: 'Dhamtari',
    slug: 'dhamtari',
    blurb: 'Dhamtari is a district headquarters south of Raipur, close to the Gangrel dam on the Mahanadi.',
  },
  {
    key: 'Kawardha',
    name: 'Kawardha',
    slug: 'kawardha',
    blurb: 'Kawardha is the headquarters of Kabirdham district, near the Bhoramdeo temple.',
  },
  {
    key: 'Champa',
    name: 'Champa',
    slug: 'champa',
    blurb: 'Champa in Janjgir-Champa district is known for its kosa silk weaving.',
  },
  {
    key: 'Janjgir Naila',
    name: 'Janjgir Naila',
    slug: 'janjgir-naila',
    blurb: 'Janjgir is the headquarters of Janjgir-Champa district, served by Naila railway station.',
  },
  {
    key: 'Akaltara',
    name: 'Akaltara',
    slug: 'akaltara',
    blurb: 'Akaltara is a town in Janjgir-Champa district on the Bilaspur–Raigarh rail line.',
  },
  {
    key: 'Pendra Road',
    name: 'Pendra Road',
    slug: 'pendra-road',
    blurb: 'Pendra Road is the railway gateway to Amarkantak, the source of the Narmada river.',
  },
  {
    key: 'Uslapur',
    name: 'Uslapur',
    slug: 'uslapur',
    blurb: 'Uslapur is Bilaspur’s second railway station, used by many long-distance trains.',
  },
];

export const PLACE_BY_KEY = new Map(PLACES.map((p) => [p.key, p]));
export const HUBS = PLACES.filter((p): p is Place & { hub: CityHub } => !!p.hub);
export const HUB_BY_SLUG = new Map(HUBS.map((p) => [p.slug, p]));

/** Path of a city page. Raipur Airport has its own keyword URL. */
export function cityPath(slug: string): string {
  return slug === 'raipur-airport' ? '/raipur-airport-taxi' : `/taxi-service/${slug}`;
}
