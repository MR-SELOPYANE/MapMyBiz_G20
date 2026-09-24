/**
 * @file Mentor profiles.
 * @description A small, locally-stored catalogue of mentor profiles.
 * No complex matching algorithm — entrepreneurs browse and request
 * mentorship directly via WhatsApp or the in-app request form.
 */

export const MENTORS = [
  {
    id: 1,
    name: "Nandi Dlamini",
    expertise: "Business Finance & Tax",
    experience: "12 years",
    location: "Durban, KwaZulu-Natal",
    bio: "Chartered accountant who helps rural entrepreneurs set up bookkeeping, manage cash flow, and stay SARS-compliant.",
    available: true,
    whatsapp: "+27712345678",
    email: "nandi@mentor.co.za",
    languages: ["English", "Zulu"],
  },
  {
    id: 2,
    name: "Thabo Mokoena",
    expertise: "Digital Marketing & E-commerce",
    experience: "9 years",
    location: "Johannesburg, Gauteng",
    bio: "Runs a small agency teaching rural businesses how to sell on WhatsApp, social media, and online marketplaces.",
    available: true,
    whatsapp: "+27823456789",
    email: "thabo@mentor.co.za",
    languages: ["English", "Sepedi", "Zulu"],
  },
  {
    id: 3,
    name: "Lerato Khumalo",
    expertise: "Agri-Business & Cooperatives",
    experience: "15 years",
    location: "Bloemfontein, Free State",
    bio: "Works with farming cooperatives on production planning, supply chains, and accessing formal markets.",
    available: true,
    whatsapp: "+27734567890",
    email: "lerato@mentor.co.za",
    languages: ["English", "Sotho", "Tswana"],
  },
  {
    id: 4,
    name: "Sipho Nkosi",
    expertise: "Leadership & Team Management",
    experience: "11 years",
    location: "Nelspruit, Mpumalanga",
    bio: "Former HR director who coaches small business owners on hiring, training, and keeping good staff.",
    available: false,
    whatsapp: "+27745678901",
    email: "sipho@mentor.co.za",
    languages: ["English", "Swati", "Zulu"],
  },
  {
    id: 5,
    name: "Aisha Patel",
    expertise: "Product Design & Craft Exports",
    experience: "8 years",
    location: "Port Elizabeth, Eastern Cape",
    bio: "Helps craftspeople and artisans design products, price them properly, and export to international buyers.",
    available: true,
    whatsapp: "+27756789012",
    email: "aisha@mentor.co.za",
    languages: ["English", "Gujarati", "Zulu"],
  },
  {
    id: 6,
    name: "Johan van der Merwe",
    expertise: "Tourism & Hospitality",
    experience: "14 years",
    location: "Stellenbosch, Western Cape",
    bio: "Guides rural guesthouses, tour operators, and cultural experiences onto booking platforms and into the tourism value chain.",
    available: true,
    whatsapp: "+27767890123",
    email: "johan@mentor.co.za",
    languages: ["English", "Afrikaans"],
  },
];

/**
 * Returns a mentor by ID.
 *
 * @param {string|number} id - The mentor identifier.
 * @returns {Object|null} The mentor record, or `null`.
 */
export function getMentorById(id) {
  return MENTORS.find((m) => String(m.id) === String(id)) || null;
}

/**
 * Returns mentors filtered by availability and/or expertise keyword.
 *
 * @param {Object} [options]
 * @param {boolean} [options.availableOnly] - Only return available mentors.
 * @param {string} [options.keyword] - Search term across name, expertise, and bio.
 * @returns {Object[]} Filtered mentor records.
 */
export function filterMentors({ availableOnly = false, keyword = "" } = {}) {
  const term = (keyword || "").trim().toLowerCase();
  return MENTORS.filter((m) => {
    const matchesAvailable = !availableOnly || m.available;
    const matchesKeyword =
      !term ||
      m.name.toLowerCase().includes(term) ||
      m.expertise.toLowerCase().includes(term) ||
      m.bio.toLowerCase().includes(term);
    return matchesAvailable && matchesKeyword;
  });
}