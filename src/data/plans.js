/**
 * @file Subscription plan catalogue.
 * @description Single source of truth for the pricing model. The user
 * dashboard, the pricing page and the admin dashboard all read their
 * feature gating and limits from this file, so changing a price or a
 * limit here updates every screen.
 */

/**
 * Canonical plan identifiers.
 *
 * @type {Object<string, string>}
 */
export const PLAN_IDS = {
  FREE: "free",
  PRO: "pro",
  PREMIUM: "premium",
};

/**
 * Every gated capability the platform can gate on.
 * A plan unlocks a capability by listing its key in `features`.
 *
 * @type {Object<string, string>}
 */
export const FEATURES = {
  PROGRESS: "progress",           // Learning progress + streak
  LISTING: "listing",             // Business listing on the map
  GROWTH_BASIC: "growth_basic",   // Manual monthly revenue entries
  GROWTH_ADVANCED: "growth_advanced", // Forecast, margins, benchmarking
  AI_ANALYSIS: "ai_analysis",     // AI business analysis assistant
  CERTIFICATES: "certificates",   // Earnable certificates
  CERTIFICATE_SHARE: "certificate_share", // Verification code + download
  REPORTS: "reports",             // Exportable monthly report
  PROMOTIONS: "promotions",       // Eligible for platform promotion campaigns
  MENTOR: "mentor",               // Booked mentor sessions
  ADVISOR: "advisor",             // Dedicated growth advisor
};

/**
 * Rank per plan, used for upgrade/downgrade comparisons.
 *
 * @type {Object<string, number>}
 */
export const PLAN_RANK = {
  [PLAN_IDS.FREE]: 0,
  [PLAN_IDS.PRO]: 1,
  [PLAN_IDS.PREMIUM]: 2,
};

/**
 * The plan catalogue.
 *
 * @type {Array<{
 *   id: string, name: string, price: number, priceLabel: string,
 *   interval: string, tagline: string, accent: string, popular: boolean,
 *   features: string[], limits: Object, highlights: string[]
 * }>}
 */
export const PLANS = [
  {
    id: PLAN_IDS.FREE,
    name: "Free Explorer",
    price: 0,
    priceLabel: "R0",
    interval: "forever",
    tagline: "Start learning and get your business on the map.",
    accent: "#64748b",
    popular: false,
    highlights: ["All 15 learning modules", "Progress tracking", "Business map listing"],
    features: [FEATURES.PROGRESS, FEATURES.LISTING, FEATURES.GROWTH_BASIC, FEATURES.CERTIFICATES],
    limits: {
      aiAnalysesPerMonth: 0,
      growthMonthsKept: 3,
      certificates: true,
      reportExports: 0,
      mentorSessionsPerMonth: 0,
    },
  },
  {
    id: PLAN_IDS.PRO,
    name: "Pro Growth",
    price: 149,
    priceLabel: "R149",
    interval: "per month",
    tagline: "AI guidance, growth numbers and certificates you can share.",
    accent: "#0A8791",
    popular: true,
    highlights: [
      "10 AI business analyses / month",
      "12 months of growth history",
      "Shareable certificates",
    ],
    features: [
      FEATURES.PROGRESS,
      FEATURES.LISTING,
      FEATURES.GROWTH_BASIC,
      FEATURES.GROWTH_ADVANCED,
      FEATURES.AI_ANALYSIS,
      FEATURES.CERTIFICATES,
      FEATURES.CERTIFICATE_SHARE,
    ],
    limits: {
      aiAnalysesPerMonth: 10,
      growthMonthsKept: 12,
      certificates: true,
      reportExports: 1,
      mentorSessionsPerMonth: 0,
    },
  },
  {
    id: PLAN_IDS.PREMIUM,
    name: "Premium Partner",
    price: 399,
    priceLabel: "R399",
    interval: "per month",
    tagline: "Everything unlocked, plus a human advisor in your corner.",
    accent: "#d4af37",
    popular: false,
    highlights: [
      "Unlimited AI analyses",
      "Monthly advisor session",
      "Priority promotion campaigns",
    ],
    features: [
      FEATURES.PROGRESS,
      FEATURES.LISTING,
      FEATURES.GROWTH_BASIC,
      FEATURES.GROWTH_ADVANCED,
      FEATURES.AI_ANALYSIS,
      FEATURES.CERTIFICATES,
      FEATURES.CERTIFICATE_SHARE,
      FEATURES.REPORTS,
      FEATURES.PROMOTIONS,
      FEATURES.MENTOR,
      FEATURES.ADVISOR,
    ],
    limits: {
      aiAnalysesPerMonth: Number.POSITIVE_INFINITY,
      growthMonthsKept: 60,
      certificates: true,
      reportExports: 12,
      mentorSessionsPerMonth: 4,
    },
  },
];

/**
 * Valid subscription lifecycle states.
 *
 * @type {Object<string, string>}
 */
export const SUB_STATUS = {
  NONE: "none",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

/**
 * Looks up a plan definition by id.
 *
 * @param {string} planId - The plan identifier.
 * @returns {Object|null} The plan definition, or `null` when unknown.
 */
export function getPlanById(planId) {
  return PLANS.find((plan) => plan.id === planId) || null;
}

/**
 * Returns the plan definition for a rank (e.g. rank 1 → Pro Growth).
 *
 * @param {number} rank - A {@link PLAN_RANK} value.
 * @returns {Object|null}
 */
export function getPlanByRank(rank) {
  return PLANS.find((plan) => PLAN_RANK[plan.id] === rank) || null;
}

/**
 * Convenience helper returning the free plan definition.
 *
 * @returns {Object}
 */
export function getFreePlan() {
  return getPlanById(PLAN_IDS.FREE);
}

/**
 * Formats a plan limit for display, collapsing "unlimited" to a word.
 *
 * @param {number} value - The raw limit.
 * @returns {string}
 */
export function formatLimit(value) {
  return value === Number.POSITIVE_INFINITY ? "Unlimited" : String(value);
}

export default {
  PLANS,
  PLAN_IDS,
  PLAN_RANK,
  FEATURES,
  SUB_STATUS,
  getPlanById,
  getPlanByRank,
  getFreePlan,
  formatLimit,
};
