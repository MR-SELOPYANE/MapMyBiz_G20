/**
 * @file AI business analysis service.
 * @description Produces the paid "AI Assistance" insight on the user
 * dashboard.
 *
 * If `VITE_AI_ANALYSIS_URL` is configured the request is posted to that
 * endpoint (any OpenAI-compatible / custom backend). When it is not — or
 * when the call fails, which matters a lot for rural users on flaky
 * data — a deterministic on-device analysis engine takes over so the
 * subscriber always gets a useful answer.
 *
 * Access is gated by the caller's subscription: the quota is checked
 * before the analysis runs and the usage is recorded afterwards.
 */

import { getActivePlan, hasFeature, recordAiUsage, remainingAiAnalyses } from "./subscription.service.js";
import { FEATURES } from "../data/plans.js";

/** The named analysis lenses a subscriber can request. */
export const ANALYSIS_TYPES = [
  { id: "overview", label: "Overall health check", description: "A snapshot of how the business is doing." },
  { id: "revenue", label: "Revenue & pricing", description: "Where money is coming from and how to grow it." },
  { id: "customers", label: "Customer growth", description: "Getting and keeping more customers." },
  { id: "costs", label: "Costs & cash flow", description: "Trimming costs and protecting cash." },
];

/**
 * Returns the configured remote analysis endpoint, if any.
 *
 * @returns {string|null}
 */
function getEndpoint() {
  if (typeof import.meta === "undefined" || !import.meta.env) return null;
  const url = import.meta.env.VITE_AI_ANALYSIS_URL;
  return url ? String(url) : null;
}

/**
 * Round helper.
 *
 * @param {number} value - Raw value.
 * @param {number} [dp=1] - Decimal places.
 * @returns {number}
 */
function round(value, dp = 1) {
  const factor = 10 ** dp;
  return Math.round((Number(value) || 0) * factor) / factor;
}

/**
 * Local analysis engine. Scores the business out of 100 and produces
 * three insights and three actions from the numbers on record.
 *
 * @param {Object} input - Analysis input.
 * @param {Object} input.growth - Result of `computeGrowth()`.
 * @param {Object[]} input.businesses - The user's business listings.
 * @param {number} input.completedModules - Completed module count.
 * @param {number} input.totalModules - Total module count.
 * @param {number} input.certificates - Certificates earned.
 * @param {string} input.type - One of {@link ANALYSIS_TYPES}.
 * @returns {Object} `{ score, headline, insights, actions, source, focus }`
 */
export function runLocalAnalysis(input) {
  const { growth, businesses = [], completedModules = 0, totalModules = 0, certificates = 0 } = input;
  const insights = [];
  const actions = [];

  let score = 45;
  const revenueScore = growth.direction === "up" ? 20 : growth.direction === "flat" ? 12 : 4;
  const marginScore = growth.marginPct >= 20 ? 20 : growth.marginPct >= 10 ? 14 : 6;
  const dataScore = growth.months >= 3 ? 12 : growth.months > 0 ? 6 : 0;
  const listingScore = businesses.length ? 6 : 0;
  const learningScore = totalModules ? Math.round((completedModules / totalModules) * 12) : 0;
  const certScore = Math.min(certificates, 2) * 3;
  score = Math.min(
    100,
    Math.round(revenueScore + marginScore + dataScore + listingScore + learningScore + certScore)
  );

  if (!growth.hasData) {
    insights.push({
      title: "No numbers recorded yet",
      body: "The AI cannot see your revenue or costs yet. Enter this month's sales, costs and customer count on the Business Growth card and the analysis becomes specific to your business.",
      severity: "high",
    });
  } else {
    const change = growth.revenueChangePct;
    if (change == null) {
      insights.push({
        title: "One month of data recorded",
        body: "Add last month's numbers so the assistant can calculate a month-on-month change instead of guessing.",
        severity: "medium",
      });
    } else if (change >= 10) {
      insights.push({
        title: `Revenue is up ${round(change)}% month on month`,
        body: "Momentum like this is worth protecting: keep the promotion or price change that drove it running for one more cycle before you change anything else.",
        severity: "low",
      });
    } else if (change <= -10) {
      insights.push({
        title: `Revenue is down ${round(Math.abs(change))}% month on month`,
        body: "Sales usually fall for one of four reasons: fewer customers, a lower average sale, fewer selling days, or cancelled orders. Check customer count first — it is the fastest to measure.",
        severity: "high",
      });
    } else {
      insights.push({
        title: "Revenue is holding steady",
        body: "Flat revenue with steady costs means you are not growing, not shrinking. A single new sales channel is usually enough to break the pattern.",
        severity: "medium",
      });
    }

    if (growth.marginPct < 10) {
      insights.push({
        title: `Thin margin — ${round(growth.marginPct)}% left after costs`,
        body: "Under 10% leaves nothing for growth, mistakes or you. Review your top three costs and renegotiate or drop the weakest one.",
        severity: "high",
      });
    } else {
      insights.push({
        title: `Margin is ${round(growth.marginPct)}%`,
        body: "Your costs leave a workable share of every sale. Aim to lift this two points per quarter by raising price slightly or cutting one recurring cost.",
        severity: "low",
      });
    }

    if (growth.months < 3) {
      insights.push({
        title: "Only a short history so far",
        body: `${growth.months} month${growth.months === 1 ? "" : "s"} of numbers is not enough to see a pattern. Three months is the minimum for a trend worth acting on.`,
        severity: "medium",
      });
    }
  }

  if (!businesses.length) {
    insights.push({
      title: "No business listing yet",
      body: "A listing on the Map My Biz map puts you in front of visitors and funders searching your area. It takes about two minutes.",
      severity: "medium",
    });
  } else if (businesses.some((b) => b.status === "pending")) {
    insights.push({
      title: "A listing is still pending review",
      body: "Pending listings do not show on the map. Follow up with the team to get it approved — approved listings get noticeably more views.",
      severity: "low",
    });
  }

  if (certificates === 0 && totalModules > 0) {
    insights.push({
      title: "First certificate is close",
      body: "Finish the modules in a certificate track and you get a certificate with a verification code you can show funders and customers.",
      severity: "low",
    });
  }

  // --- Actions, ordered by expected impact -----------------------------
  if (!growth.hasData) {
    actions.push("Enter this month's revenue, expenses and customer count (2 minutes).");
    actions.push("Add your business to the Map My Biz map so customers can find you.");
  } else {
    if (growth.direction === "down") {
      actions.push("Call your five most recent customers and ask what would make them buy again this month.");
    } else {
      actions.push("Write down the one thing you changed this month that moved sales, and repeat it next month.");
    }
    if (growth.marginPct < 15) {
      actions.push(`Raise prices by 5% on your best-selling item — at ${round(growth.marginPct)}% margin you need the room.`);
    }
    if (growth.months < 3) {
      actions.push("Set a monthly reminder on the 1st to record revenue, costs and customers.");
    }
    if (growth.forecast?.length) {
      const next = growth.forecast[0];
      if (next > growth.revenue) {
        actions.push(`Plan for roughly R${Math.round(next).toLocaleString("en-ZA")} next month and pre-order stock now.`);
      }
    }
  }
  if (totalModules && completedModules < totalModules) {
    const nextUp = totalModules - completedModules;
    actions.push(
      `Complete ${nextUp} more module${nextUp === 1 ? "" : "s"} to unlock a certificate track.`
    );
  }

  const focusByType = {
    overview: "Overall business health",
    revenue: "Revenue and pricing",
    customers: "Customer growth",
    costs: "Costs and cash flow",
  };

  return {
    score,
    headline:
      score >= 75
        ? "Your business is in a strong position — keep the current rhythm."
        : score >= 50
          ? "Your business is stable with clear room to grow."
          : "Your business needs a few quick wins this month.",
    insights: insights.slice(0, 4),
    actions: actions.slice(0, 4),
    focus: focusByType[input.type] || focusByType.overview,
    source: "local",
  };
}

/**
 * Requests an analysis from the configured backend.
 *
 * @param {Object} payload - The analysis request body.
 * @returns {Promise<Object|null>} The parsed response, or `null` on failure.
 */
async function requestRemoteAnalysis(payload) {
  const endpoint = getEndpoint();
  if (!endpoint) return null;

  try {
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("mmb_ai_token") || ""
        : "";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    const json = await response.json();
    if (!json || typeof json !== "object") return null;
    return {
      score: Number(json.score) || 0,
      headline: json.headline || "AI business analysis",
      insights: Array.isArray(json.insights) ? json.insights : [],
      actions: Array.isArray(json.actions) ? json.actions : [],
      focus: json.focus || "Overall business health",
      source: "ai",
    };
  } catch (_) {
    return null;
  }
}

/**
 * Runs the AI business analysis for a subscriber.
 *
 * @param {Object} params - Analysis parameters.
 * @param {Object} params.subscription - The user's subscription record.
 * @param {string} [params.userId] - The user id.
 * @param {Object} params.growth - Result of `computeGrowth()`.
 * @param {Object[]} [params.businesses] - The user's listings.
 * @param {number} [params.completedModules] - Completed module count.
 * @param {number} [params.totalModules] - Total module count.
 * @param {number} [params.certificates] - Certificates earned.
 * @param {string} [params.type="overview"] - One of {@link ANALYSIS_TYPES}.
 * @param {string} [params.question] - Optional free-text question.
 * @returns {Promise<{
 *   ok: boolean, data: Object|null, error: string|null,
 *   plan: Object, remaining: number
 * }>}
 */
export async function runBusinessAnalysis(params) {
  const {
    subscription,
    userId = null,
    growth,
    businesses = [],
    completedModules = 0,
    totalModules = 0,
    certificates = 0,
    type = "overview",
    question = "",
  } = params || {};

  const plan = getActivePlan(subscription);
  const remaining = remainingAiAnalyses(subscription, userId);

  if (!hasFeature(subscription, FEATURES.AI_ANALYSIS)) {
    return {
      ok: false,
      data: null,
      error: "AI business analysis is part of the Pro plan. Upgrade to unlock it.",
      plan,
      remaining: 0,
    };
  }

  if (remaining <= 0) {
    return {
      ok: false,
      data: null,
      error: "You have used all of this month's AI analyses. They reset on the 1st, or upgrade for more.",
      plan,
      remaining: 0,
    };
  }

  const payload = {
    type,
    question,
    userId,
    plan: plan.id,
    metrics: growth,
    businesses: businesses.map((b) => ({
      name: b.name,
      category: b.category,
      status: b.status,
      created_at: b.created_at,
    })),
    learning: { completedModules, totalModules, certificates },
  };

  const remote = await requestRemoteAnalysis(payload);
  const data = remote || runLocalAnalysis({ ...payload, type, question });

  recordAiUsage(userId);

  return {
    ok: true,
    data,
    error: null,
    plan,
    remaining: remaining === Number.POSITIVE_INFINITY ? remaining : remaining - 1,
  };
}

export default {
  runBusinessAnalysis,
  runLocalAnalysis,
  ANALYSIS_TYPES,
};
