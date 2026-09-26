/**
 * @file Tourism data and filter helpers.
 * @description Seed listings for the rural tourism marketplace, curated
 * itinerary packages, safety and logistics notes, and the pure filter /
 * sort / link-building helpers used by the tourism view and the smart map.
 *
 * Every listing is normalised to the same shape so the card, the map sidebar
 * and the itinerary builder can all read the same fields.
 */

/** Experience categories offered by rural hosts. */
export const TOURISM_ACTIVITIES = [
  { value: "culture", label: "Culture & Heritage", emoji: "🪘" },
  { value: "wildlife", label: "Wildlife & Safaris", emoji: "🦁" },
  { value: "adventure", label: "Adventure & Hiking", emoji: "🥾" },
  { value: "food", label: "Food & Cooking", emoji: "🍲" },
  { value: "craft", label: "Crafts & Workshops", emoji: "🧶" },
  { value: "wellness", label: "Wellness & Retreats", emoji: "🧖" },
  { value: "stay", label: "Stays & Lodges", emoji: "🏡" },
];

/** Duration buckets used by the filter bar. */
export const DURATION_BUCKETS = [
  { value: "half", label: "Up to half day", maxHours: 4 },
  { value: "full", label: "Half to full day", maxHours: 10 },
  { value: "multi", label: "Full day or longer", maxHours: Infinity },
];

/** Sort options used by the filter bar. */
export const TOURISM_SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "duration", label: "Shortest first" },
];

/** Upper bound of the budget slider, in rand. */
export const MAX_BUDGET = 2000;

/**
 * Sample rural tourism experiences. Used until the `tourism_experiences`
 * table has rows, and as the offline fallback so the page never renders empty.
 *
 * @type {Array<Object>}
 */
export const SAMPLE_EXPERIENCES = [
  {
    id: "exp-1",
    businessId: "s4",
    name: "Kruger Star Lodges & Bush Walk",
    host: "Lesedi Cultural Trust",
    province: "Mpumalanga",
    town: "Kruger Park",
    location: "Hazyview, Mpumalanga",
    category: "tourism",
    activity: "wildlife",
    price: 650,
    priceUnit: "per person",
    durationHours: 8,
    groupSizeMax: 8,
    rating: 4.9,
    reviewsCount: 128,
    reviewSnippet:
      "Our guide read the tracks perfectly and the evening braai under the stars was worth the drive on its own.",
    reviewAuthor: "Thandi M., Johannesburg",
    verified: true,
    youthOwned: true,
    image: "/assets/images/Lesedi-entrance.jpg",
    images: [
      "/assets/images/Lesedi-entrance.jpg",
      "/assets/images/istockphoto-93225298-612x612.jpg",
      "/assets/images/collage.png",
    ],
    included: [
      "Guided 4-hour bush walk with a SANParks-trained guide",
      "Traditional dinner and bush braai",
      "Pick-up from Hazyview and drop-off at the lodge",
    ],
    availability: "Daily, 06:00 and 15:00 departures",
    transport: "2h 10m from Pretoria · 1h from Mbombela",
    cellCoverage: "Vodacom, MTN and Cell C at the lodge",
    safety: "Registered guide, first-aid kit, and radio check-in at every stop",
    lat: -24.0167,
    lng: 31.4858,
    phone: "+27 71 234 5678",
    whatsapp: "+27 71 234 5678",
    email: "bookings@leseditrust.co.za",
  },
  {
    id: "exp-2",
    businessId: null,
    name: "Village Craft & Beadmaking Morning",
    host: "Mma Ramaphosa Women's Co-op",
    province: "Limpopo",
    town: "Tzaneen",
    location: "Tzaneen, Limpopo",
    category: "tourism",
    activity: "craft",
    price: 220,
    priceUnit: "per person",
    durationHours: 4,
    groupSizeMax: 12,
    rating: 4.8,
    reviewsCount: 64,
    reviewSnippet:
      "We made a beaded bracelet and ate real vhembu. Nothing touristy about it, in the best way.",
    reviewAuthor: "Lerato K., Cape Town",
    verified: true,
    youthOwned: true,
    image: "/assets/images/Village-Tourism.jpg",
    images: [
      "/assets/images/Village-Tourism.jpg",
      "/assets/images/Handcrafts.jpg",
      "/assets/images/collage.png",
    ],
    included: [
      "Workshop with two master beadmakers",
      "All materials and your finished piece to take home",
      "Traditional lunch and tea",
    ],
    availability: "Mon to Sat, 09:00 and 13:00",
    transport: "1h 40m from Polokwane · 45m from Tzaneen town",
    cellCoverage: "Vodacom and MTN in the village",
    safety: "Licensed co-op host, shaded workshop, group size capped at 12",
    lat: -23.7877,
    lng: 30.4641,
    phone: "+27 82 555 0193",
    whatsapp: "+27 82 555 0193",
    email: "hello@mmaam.coop",
  },
  {
    id: "exp-3",
    businessId: null,
    name: "Rural Tourism Heritage Tour",
    host: "Mampuru Community Trust",
    province: "Limpopo",
    town: "Mampuru",
    location: "Mampuru, Limpopo",
    category: "tourism",
    activity: "culture",
    price: 480,
    priceUnit: "per person",
    durationHours: 9,
    groupSizeMax: 15,
    rating: 4.7,
    reviewsCount: 41,
    reviewSnippet:
      "The history of the mission station and the sorghum fields was far more interesting than I expected.",
    reviewAuthor: "Pieter v.d. Berg, Durban",
    verified: true,
    youthOwned: false,
    image: "/assets/images/Turismo-rural-foto-1.png",
    images: [
      "/assets/images/Turismo-rural-foto-1.png",
      "/assets/images/Cultural-Festivals-and-Events-Celebrating-Diversity-in-African-Travel.png",
      "/assets/images/collage.png",
    ],
    included: [
      "Full-day guided heritage and history walk",
      "Traditional dance performance and lunch",
      "Local craft market browse",
    ],
    availability: "Wed to Sun, 08:00 start",
    transport: "1h from Polokwane, 25m off the R71",
    cellCoverage: "Vodacom and MTN at the visitor centre",
    safety: "Community guide, museum first-aid trained, 15-person cap",
    lat: -23.5667,
    lng: 30.4833,
    phone: "+27 72 330 8841",
    whatsapp: "+27 72 330 8841",
    email: "book@mampuru.org",
  },
  {
    id: "exp-4",
    businessId: null,
    name: "Home-Cooked Cape Malay Feast in the Winelands",
    host: "Cape Kitchen Collective",
    province: "Western Cape",
    town: "Stellenbosch",
    location: "Stellenbosch, Western Cape",
    category: "tourism",
    activity: "food",
    price: 350,
    priceUnit: "per person",
    durationHours: 5,
    groupSizeMax: 10,
    rating: 4.9,
    reviewsCount: 96,
    reviewSnippet:
      "Booked on a Tuesday, ate on a Wednesday, and every dish came with the story of the family who made it.",
    reviewAuthor: "Nadia H., Amsterdam",
    verified: true,
    youthOwned: true,
    image: "/assets/images/sa-foods.jpg",
    images: [
      "/assets/images/sa-foods.jpg",
      "/assets/images/sa1.jpeg",
      "/assets/images/images.jpeg",
    ],
    included: [
      "Five-course Cape Malay and Khoisan-inspired menu",
      "Wine pairing from three local estates",
      "Recipe booklet and market tour afterwards",
    ],
    availability: "Tue to Sat, 12:00 and 18:30 seatings",
    transport: "35m from Cape Town, 15m from Stellenbosch",
    cellCoverage: "Full coverage in the town, strong in the valley",
    safety: "Licensed kitchen, insured host, paired wine service",
    lat: -33.9344,
    lng: 18.8602,
    phone: "+27 76 118 4402",
    whatsapp: "+27 76 118 4402",
    email: "tables@capekitchen.co.za",
  },
  {
    id: "exp-5",
    businessId: null,
    name: "Riverrafting and Koppie Hike Combo",
    host: "Free State Adventure Guides",
    province: "Free State",
    town: "Clarens",
    location: "Clarens, Free State",
    category: "tourism",
    activity: "adventure",
    price: 780,
    priceUnit: "per person",
    durationHours: 8,
    groupSizeMax: 6,
    rating: 4.6,
    reviewsCount: 52,
    reviewSnippet:
      "Adrenaline from the first rapid, then a quiet lunch on top of the koppie. My kids still talk about it.",
    reviewAuthor: "Sipho D., Bloemfontein",
    verified: true,
    youthOwned: true,
    image: "/assets/images/GettyImages-520890970-59b8ecef6f53ba0011ba2fc8.jpg",
    images: [
      "/assets/images/GettyImages-520890970-59b8ecef6f53ba0011ba2fc8.jpg",
      "/assets/images/images (1).jpeg",
      "/assets/images/images (2).jpeg",
    ],
    included: [
      "Grade 2–3 river rafting with all equipment",
      "Guided koppie hike and packed lunch",
      "Shuttle back to your car",
    ],
    availability: "Wed to Sun, weather dependent",
    transport: "2h from Bloemfontein, 45m from Harrismith",
    cellCoverage: "Vodacom only in the valley",
    safety: "AMM recognised guide, PFDs, helmet and rescue kit on every trip",
    lat: -28.4736,
    lng: 28.4653,
    phone: "+27 79 400 7712",
    whatsapp: "+27 79 400 7712",
    email: "book@fsadventure.co.za",
  },
  {
    id: "exp-6",
    businessId: null,
    name: "Shepherd's Hut Weekend with Yoga Deck",
    host: "Karoo Slow Stay",
    province: "Eastern Cape",
    town: "Graaff-Reinet",
    location: "Graaff-Reinet, Eastern Cape",
    category: "tourism",
    activity: "wellness",
    price: 1250,
    priceUnit: "per couple",
    durationHours: 48,
    groupSizeMax: 4,
    rating: 4.8,
    reviewsCount: 37,
    reviewSnippet:
      "No wifi, no pressure, two slow mornings. The clearest my head has been in a year.",
    reviewAuthor: "Anna-Maria S., Port Elizabeth",
    verified: true,
    youthOwned: false,
    image: "/assets/images/nav.jpg",
    images: [
      "/assets/images/nav.jpg",
      "/assets/images/main.jpg",
      "/assets/images/collage.png",
    ],
    included: [
      "One night in a private shepherd's hut",
      "Sunrise yoga and evening braai",
      "Farm-to-table dinner and breakfast",
    ],
    availability: "Friday and Saturday arrivals, 6 huts",
    transport: "1h 20m from Gqeberha, 1h from Graaff-Reinet",
    cellCoverage: "Vodacom and MTN at the farm, none in the huts",
    safety: "Host on site, first-aid trained, solar lighting, no lone walking",
    lat: -32.2561,
    lng: 24.1817,
    phone: "+27 84 512 6600",
    whatsapp: "+27 84 512 6600",
    email: "stay@karooslow.co.za",
  },
];

/**
 * Curated itinerary packages built from the listings above. These turn a
 * directory into a bookable product.
 *
 * @type {Array<{ id: string, title: string, duration: string, province: string,
 *   priceFrom: number, image: string, summary: string,
 *   stops: Array<{ experienceId: string, day: string, activity: string }> }>}
 */
export const ITINERARIES = [
  {
    id: "itin-1",
    title: "Limpopo in Three Days",
    duration: "3 days / 2 nights",
    province: "Limpopo",
    priceFrom: 1450,
    image: "/assets/images/Turismo-rural-foto-1.png",
    summary:
      "Beadmaking, heritage and an overnight in the village — the full Mampuru and Tzaneen loop with a community guide throughout.",
    stops: [
      { experienceId: "exp-2", day: "Day 1", activity: "Beadmaking workshop and village lunch" },
      { experienceId: "exp-3", day: "Day 2", activity: "Heritage tour and traditional dance" },
      { experienceId: "exp-2", day: "Day 3", activity: "Market morning and craft shopping" },
    ],
  },
  {
    id: "itin-2",
    title: "Lowveld Weekend Escape",
    duration: "2 days / 1 night",
    province: "Mpumalanga",
    priceFrom: 1780,
    image: "/assets/images/Lesedi-entrance.jpg",
    summary:
      "Bush walk, star lodge and a slow sunrise morning in the Lowveld. Everything within 90 minutes of each other.",
    stops: [
      { experienceId: "exp-1", day: "Day 1", activity: "Bush walk and bush braai" },
      { experienceId: "exp-1", day: "Day 2", activity: "Dawn drive and breakfast at the lodge" },
    ],
  },
  {
    id: "itin-3",
    title: "Cape Flavours Day Trip",
    duration: "1 day",
    province: "Western Cape",
    priceFrom: 720,
    image: "/assets/images/sa-foods.jpg",
    summary:
      "A five-course home-cooked feast, three Winelands estates and a guided market walk. Best between November and April.",
    stops: [
      { experienceId: "exp-4", day: "Day 1", activity: "Feast, wine pairing and market tour" },
    ],
  },
];

/**
 * Safety and logistics notes shown next to every listing — the questions
 * travellers filter out before they ever book.
 *
 * @type {Array<{ title: string, body: string, emoji: string }>}
 */
export const SAFETY_TIPS = [
  {
    emoji: "📶",
    title: "Check cell coverage first",
    body: "Rural signal is patchy. Every listing shows which operators work on site, and hosts can share offline coordinates before you travel.",
  },
  {
    emoji: "🚌",
    title: "Get transport costs upfront",
    body: "Ask the host whether transfers are included. Listings show drive times from the nearest town so you can budget fuel and overnight stops.",
  },
  {
    emoji: "🧭",
    title: "Offline maps and check-ins",
    body: "Rural roads are poorly signed. Download the route, share your ETA with someone at home, and expect long gaps between fuel stations.",
  },
  {
    emoji: "🧪",
    title: "Health and water",
    body: "Carry your own drinking water and any regular medication. Private medical facilities are rare outside the major towns.",
  },
  {
    emoji: "🧾",
    title: "Verified means checked",
    body: "A Verified badge means the host's ID, business registration and bank details have been confirmed by our team before the listing went live.",
  },
  {
    emoji: "🌧️",
    title: "Season and weather",
    body: "Summer thunderstorms close dirt roads in the Lowveld and Limpopo. Ask your host which days are weather-safe before you commit.",
  },
];

/** Reasons the tourism page exists, shown near the top. */
export const TOURISM_VALUE_PROPS = [
  {
    emoji: "💰",
    title: "Spend that stays in the village",
    body: "Up to 85% of a booked rural experience is paid to the host, guide and community suppliers before it reaches us.",
  },
  {
    emoji: "🛡️",
    title: "Verified hosts only",
    body: "Every host is ID-checked and business-registered before they can take a booking. No anonymous listings, ever.",
  },
  {
    emoji: "📲",
    title: "Book on WhatsApp",
    body: "No apps to install and no card needed. Confirm your booking in a chat with the host, in the language you both speak.",
  },
  {
    emoji: "🌱",
    title: "Small groups, real capacity",
    body: "Group sizes are capped so villages are not overrun and every visitor gets the host's full attention.",
  },
];

/**
 * Formats a rand amount for display.
 *
 * @param {number|string|null|undefined} value - Amount in rand.
 * @returns {string} e.g. `R 650`.
 */
export function formatZar(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Ask the host";
  return `R ${amount.toLocaleString("en-ZA")}`;
}

/**
 * Formats a duration in hours as a friendly label.
 *
 * @param {number|string|null|undefined} hours - Duration in hours.
 * @returns {string} e.g. `Half day` or `2 days`.
 */
export function formatDuration(hours) {
  const value = Number(hours);
  if (!Number.isFinite(value) || value <= 0) return "Flexible";
  if (value < 4) return `${value} hrs`;
  if (value < 24) return value === 12 ? "Full day" : `${value} hrs`;
  const days = Math.round((value / 24) * 10) / 10;
  return days % 1 === 0 ? `${days} day${days === 1 ? "" : "s"}` : `${days} days`;
}

/**
 * Normalises a raw database row into the experience shape used across the
 * tourism views, tolerating both camelCase and snake_case columns.
 *
 * @param {Object} row - Raw row from `tourism_experiences`.
 * @returns {Object} Normalised experience.
 */
export function normaliseExperience(row = {}) {
  const lat = row.latitude ?? row.lat ?? null;
  const lng = row.longitude ?? row.lng ?? null;
  return {
    id: row.id,
    businessId: row.business_id ?? row.businessId ?? null,
    name: row.name || "Rural experience",
    host: row.host || row.host_name || row.hostName || "Local host",
    province: row.province || "South Africa",
    town: row.town || row.location || "",
    location: row.location || row.town || "",
    category: row.category || "tourism",
    activity: row.activity || "culture",
    price: Number(row.price) || 0,
    priceUnit: row.price_unit || row.priceUnit || "per person",
    durationHours: Number(row.duration_hours ?? row.durationHours) || 0,
    groupSizeMax: Number(row.group_size_max ?? row.groupSizeMax) || 0,
    rating: Number(row.rating) || 0,
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount) || 0,
    reviewSnippet: row.review_snippet || row.reviewSnippet || "",
    reviewAuthor: row.review_author || row.reviewAuthor || "",
    verified: Boolean(row.verified ?? row.is_verified ?? true),
    youthOwned: Boolean(row.is_youth_owned ?? row.youthOwned ?? false),
    image: row.image || row.image_url || row.imageUrl || "/assets/images/collage.png",
    images: row.images || row.image_url || row.imageUrl
      ? Array.isArray(row.images)
        ? row.images
        : [row.image_url || row.imageUrl || row.image]
      : [],
    included: Array.isArray(row.included)
      ? row.included
      : String(row.included || "")
          .split("|")
          .map((item) => item.trim())
          .filter(Boolean),
    availability: row.availability || "Contact the host for available dates",
    transport: row.transport || "Ask the host about transport",
    cellCoverage: row.cell_coverage || row.cellCoverage || "Ask the host about signal",
    safety: row.safety || "Guided experience with a local host",
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
    phone: row.phone || "",
    whatsapp: row.whatsapp || row.phone || "",
    email: row.email || "",
  };
}

/**
 * Maps tourism businesses from the generic `businesses` table onto the
 * experience shape, so operators who already registered as tourism
 * businesses automatically appear as bookable listings.
 *
 * @param {Object[]} businesses - Rows from `getAllBusinesses()`.
 * @returns {Object[]} Normalised experiences.
 */
export function experiencesFromBusinesses(businesses = []) {
  return businesses
    .filter((business) => isTourismBusiness(business))
    .map((business) =>
      normaliseExperience({
        id: `biz-${business.id}`,
        business_id: business.id,
        name: business.name || business.business_name || "Rural experience",
        host: business.name || business.business_name || "Local host",
        province: business.province || "South Africa",
        town: business.location || "",
        location: business.location || "",
        category: "tourism",
        activity: business.activity || "culture",
        price: business.price,
        price_unit: business.price_unit,
        duration_hours: business.duration_hours,
        group_size_max: business.group_size_max,
        rating: business.rating,
        reviews_count: business.reviews_count,
        review_snippet: business.review_snippet,
        review_author: business.review_author,
        verified: business.status === "approved",
        is_youth_owned: business.is_youth_owned ?? business.isYouthOwned,
        image_url: business.image_url || business.imageUrl,
        included: business.included,
        availability: business.availability,
        transport: business.transport,
        cell_coverage: business.cell_coverage,
        safety: business.safety,
        latitude: business.lat,
        longitude: business.lng,
        phone: business.phone,
        whatsapp: business.whatsapp,
        email: business.email,
      }),
    );
}

/**
 * Returns whether a business row should be treated as a tourism listing.
 *
 * @param {Object} business - A business row.
 * @returns {boolean}
 */
export function isTourismBusiness(business = {}) {
  const category = String(business.category || "").toLowerCase();
  return (
    category === "tourism" ||
    category.includes("tourism") ||
    category.includes("hospitality") ||
    category.includes("experience")
  );
}

/**
 * Applies the tourism filter state to a list of experiences and sorts the
 * result. Pure so it can be unit tested and reused by the map deep link.
 *
 * @param {Object[]} experiences - Normalised experiences.
 * @param {Object} [filters={}] - Filter state.
 * @param {string} [filters.search] - Free-text search across name, host, town and province.
 * @param {string} [filters.province] - Province name, or empty for all.
 * @param {string} [filters.activity] - Activity value, or empty for all.
 * @param {string} [filters.duration] - One of {@link DURATION_BUCKETS} values.
 * @param {number} [filters.maxPrice] - Maximum price in rand.
 * @param {number} [filters.groupSize] - Minimum group size the host can take.
 * @param {string} [filters.sort] - One of {@link TOURISM_SORTS} values.
 * @returns {Object[]} Filtered and sorted experiences.
 */
export function filterExperiences(experiences = [], filters = {}) {
  const {
    search = "",
    province = "",
    activity = "",
    duration = "",
    maxPrice = 0,
    groupSize = 0,
    sort = "recommended",
  } = filters;

  const term = String(search).trim().toLowerCase();
  const bucket = DURATION_BUCKETS.find((b) => b.value === duration);

  const filtered = experiences.filter((experience) => {
    if (province && experience.province !== province) return false;
    if (activity && experience.activity !== activity) return false;
    if (bucket && experience.durationHours > bucket.maxHours) return false;
    if (Number(maxPrice) > 0 && experience.price > Number(maxPrice)) return false;
    if (Number(groupSize) > 0 && experience.groupSizeMax && experience.groupSizeMax < Number(groupSize)) {
      return false;
    }
    if (term) {
      const haystack = [
        experience.name,
        experience.host,
        experience.town,
        experience.province,
        experience.location,
        experience.activity,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  return sortExperiences(filtered, sort);
}

/**
 * Sorts experiences by the requested sort option. Returns a new array.
 *
 * @param {Object[]} experiences - Experiences to sort.
 * @param {string} [sort] - One of {@link TOURISM_SORTS} values.
 * @returns {Object[]} Sorted copy.
 */
export function sortExperiences(experiences = [], sort = "recommended") {
  const copy = [...experiences];
  switch (sort) {
    case "rating":
      return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "price-asc":
      return copy.sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
    case "price-desc":
      return copy.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "duration":
      return copy.sort((a, b) => (a.durationHours || Infinity) - (b.durationHours || Infinity));
    default:
      return copy.sort((a, b) => {
        const byRating = (b.rating || 0) - (a.rating || 0);
        if (byRating !== 0) return byRating;
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      });
  }
}

/**
 * Builds the smart-map deep link for the current filter state, so a tourist
 * can move from the grid to the map without losing their search.
 *
 * @param {Object} [filters={}] - Filter state.
 * @returns {string} Hash route including the query string.
 */
export function buildMapLink(filters = {}) {
  const params = new URLSearchParams();
  params.set("category", "tourism");
  if (filters.province) params.set("province", filters.province);
  if (filters.activity) params.set("activity", filters.activity);
  if (filters.search) params.set("q", filters.search);
  return `#/map?${params.toString()}`;
}

/**
 * Reads filter state out of a map query string so the map can start from a
 * tourist's search.
 *
 * @param {Object} [query={}] - Parsed query params.
 * @returns {Object} Filter state understood by {@link filterExperiences}.
 */
export function filtersFromQuery(query = {}) {
  return {
    search: query.q || "",
    province: query.province || "",
    activity: query.activity || "",
  };
}

export default {
  TOURISM_ACTIVITIES,
  DURATION_BUCKETS,
  TOURISM_SORTS,
  MAX_BUDGET,
  SAMPLE_EXPERIENCES,
  ITINERARIES,
  SAFETY_TIPS,
  TOURISM_VALUE_PROPS,
  formatZar,
  formatDuration,
  normaliseExperience,
  experiencesFromBusinesses,
  isTourismBusiness,
  filterExperiences,
  sortExperiences,
  buildMapLink,
  filtersFromQuery,
};
