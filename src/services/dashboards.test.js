// @vitest-environment node
/**
 * @file Dashboard logic tests.
 * @description Covers the pure logic behind the user and admin dashboards:
 * growth maths, certificate track progress, subscription gating and the
 * on-device AI analysis engine. The DOM-heavy views are exercised through
 * these services rather than in jsdom, so no browser environment is needed.
 */

import { describe, expect, it } from "vitest";

import { computeGrowth, forecastRevenue, formatMonthLabel, shiftMonth } from "./metrics.service.js";
import { getTrackProgress } from "./certificate.service.js";
import { runLocalAnalysis } from "./ai.service.js";
import {
  freeSubscription,
  getActivePlan,
  getLimit,
  getMinimumPlanFor,
  hasFeature,
  isPaidPlan,
  normaliseSubscription,
  remainingAiAnalyses,
} from "./subscription.service.js";
import { isAdminUser } from "../utils/roles.js";
import { PLAN_IDS } from "../data/plans.js";

/** A three-month series used across the growth tests. */
const SERIES = [
  { month: "2026-06", revenue: 10000, expenses: 6000, customers: 40 },
  { month: "2026-07", revenue: 14000, expenses: 7000, customers: 52 },
  { month: "2026-08", revenue: 12000, expenses: 7500, customers: 48 },
];

describe("computeGrowth", () => {
  it("returns an empty summary when there is no data", () => {
    const growth = computeGrowth([]);
    expect(growth.hasData).toBe(false);
    expect(growth.revenue).toBe(0);
    expect(growth.forecast).toEqual([]);
  });

  it("calculates profit, margin and month-on-month change", () => {
    const growth = computeGrowth(SERIES);
    expect(growth.months).toBe(3);
    expect(growth.revenue).toBe(12000);
    expect(growth.expenses).toBe(7500);
    expect(growth.profit).toBe(4500);
    expect(growth.marginPct).toBeCloseTo(37.5, 1);
    expect(growth.revenueChangePct).toBeCloseTo(-14.29, 1);
    expect(growth.direction).toBe("down");
  });

  it("sorts unsorted input and keeps the latest month as the headline", () => {
    const growth = computeGrowth([...SERIES].reverse());
    expect(growth.latest.month).toBe("2026-08");
    expect(growth.trend).toEqual([10000, 14000, 12000]);
  });
});

describe("forecastRevenue", () => {
  it("holds a single value flat", () => {
    expect(forecastRevenue([5000], 2)).toEqual([5000, 5000]);
  });

  it("projects the average month-on-month change", () => {
    expect(forecastRevenue([1000, 2000, 3000], 2)).toEqual([4000, 5000]);
  });

  it("never projects a negative value", () => {
    expect(forecastRevenue([3000, 2000, 1000], 3)).toEqual([0, 0, 0]);
  });
});

describe("month helpers", () => {
  it("labels months for display", () => {
    expect(formatMonthLabel("2026-08")).toBe("Aug 2026");
  });

  it("steps backwards across a year boundary", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("certificate tracks", () => {
  it("marks a track complete only when every module is done", () => {
    const [basics, financials, growth] = getTrackProgress([2, 8, 15]);
    expect(basics.complete).toBe(true);
    expect(basics.pct).toBe(100);
    expect(financials.complete).toBe(false);
    expect(financials.missing.length).toBe(5);
    expect(growth.done).toBe(0);
  });

  it("tolerates the legacy 'Module 3' id format", () => {
    const [basics] = getTrackProgress(["Module 2", "module 8", " 15 "]);
    expect(basics.complete).toBe(true);
  });
});

describe("subscription gating", () => {
  const pro = normaliseSubscription({
    userId: "u1",
    planId: PLAN_IDS.PRO,
    status: "active",
    renewsAt: "2999-01-01",
  });

  it("treats free, cancelled and expired as unpaid", () => {
    expect(isPaidPlan(freeSubscription("u1"))).toBe(false);
    expect(isPaidPlan({ ...pro, status: "cancelled" })).toBe(false);
    expect(isPaidPlan({ ...pro, renewsAt: "2020-01-01" })).toBe(false);
  });

  it("gates AI analysis and certificate sharing by plan", () => {
    expect(hasFeature(freeSubscription("u1"), "ai_analysis")).toBe(false);
    expect(hasFeature(pro, "ai_analysis")).toBe(true);
    expect(hasFeature(freeSubscription("u1"), "certificate_share")).toBe(false);
    expect(hasFeature(pro, "certificate_share")).toBe(true);
  });

  it("applies per-plan growth history limits", () => {
    expect(getLimit(freeSubscription("u1"), "growthMonthsKept")).toBe(3);
    expect(getLimit(pro, "growthMonthsKept")).toBe(12);
  });

  it("gives premium an unlimited AI quota", () => {
    const premium = normaliseSubscription({
      userId: "u1",
      planId: PLAN_IDS.PREMIUM,
      status: "active",
      renewsAt: "2999-01-01",
    });
    expect(remainingAiAnalyses(premium, "u1")).toBe(Number.POSITIVE_INFINITY);
  });

  it("falls back to the free plan for unknown plan ids", () => {
    const bogus = normaliseSubscription({ planId: "platinum" });
    expect(getActivePlan(bogus).id).toBe(PLAN_IDS.FREE);
  });

  it("knows the cheapest plan that unlocks a feature", () => {
    expect(getMinimumPlanFor("ai_analysis").id).toBe(PLAN_IDS.PRO);
    expect(getMinimumPlanFor("advisor").id).toBe(PLAN_IDS.PREMIUM);
  });
});

describe("local AI analysis", () => {
  it("flags missing data and still returns actions", () => {
    const result = runLocalAnalysis({ growth: computeGrowth([]), type: "overview" });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.source).toBe("local");
  });

  it("warns when revenue is falling", () => {
    const result = runLocalAnalysis({ growth: computeGrowth(SERIES), type: "overview" });
    const titles = result.insights.map((i) => i.title).join(" | ");
    expect(titles).toMatch(/down/i);
  });

  it("rewards a completed track and a healthy margin with a higher score", () => {
    const weak = runLocalAnalysis({ growth: computeGrowth(SERIES) });
    const strong = runLocalAnalysis({
      growth: computeGrowth([
        { month: "2026-07", revenue: 10000, expenses: 3000, customers: 40 },
        { month: "2026-08", revenue: 16000, expenses: 4000, customers: 70 },
        { month: "2026-09", revenue: 20000, expenses: 5000, customers: 90 },
      ]),
      businesses: [{ name: "Spa", status: "approved" }],
      completedModules: 15,
      totalModules: 15,
      certificates: 3,
    });
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.score).toBeLessThanOrEqual(100);
  });
});

describe("admin role check", () => {
  it("matches the configured admin email regardless of case", () => {
    expect(isAdminUser({ email: "ADMIN@MapMyBizz.co.za" })).toBe(true);
  });

  it("rejects everyone else", () => {
    expect(isAdminUser({ email: "someone@example.com" })).toBe(false);
    expect(isAdminUser(null)).toBe(false);
  });

  it("honours a server-side admin role in user metadata", () => {
    expect(isAdminUser({ email: "anyone@example.com", role: "admin" })).toBe(true);
  });
});
