/**
 * @file Business growth / metrics service.
 * @description Stores the monthly numbers an entrepreneur types in
 * (revenue, expenses, customers) and turns them into the growth figures
 * shown on the user dashboard: month-on-month change, profit, margin and
 * a simple forecast.
 *
 * Supabase `business_metrics` is the source of truth; `localStorage`
 * mirrors each write so the dashboard still works offline.
 */

import supabase from "./supabase.js";
import { getLimit } from "./subscription.service.js";

/** localStorage key prefix for the mirrored metrics cache. */
const STORAGE_PREFIX = "mmb_metrics_";

/** Hard ceiling used when no subscription is supplied. */
const DEFAULT_MONTHS_KEPT = 3;

/**
 * Returns the current month key in `YYYY-MM` form.
 *
 * @returns {string}
 */
export function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Converts a month key into a short human label, e.g. "Mar 2026".
 *
 * @param {string} monthKey - A `YYYY-MM` string.
 * @returns {string}
 */
export function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-");
  if (!year || !month) return String(monthKey || "");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return String(monthKey);
  return date.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}

/**
 * Steps a `YYYY-MM` key backwards by a number of months.
 *
 * @param {string} monthKey - A `YYYY-MM` string.
 * @param {number} offset - How many months to move (negative goes back).
 * @returns {string}
 */
export function shiftMonth(monthKey, offset) {
  const [year, month] = String(monthKey).split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Coerces any value to a finite number, defaulting to `0`.
 *
 * @param {number|string|null|undefined} value - Raw value.
 * @returns {number}
 */
function num(value) {
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Normalises a metric record.
 *
 * @param {Object} [raw={}] - Partial metric data.
 * @returns {Object} `{ userId, businessId, month, revenue, expenses, customers, note, updatedAt }`
 */
export function normaliseMetric(raw = {}) {
  const month = /^\d{4}-\d{2}$/.test(raw.month || "") ? raw.month : currentMonthKey();
  return {
    userId: raw.userId || null,
    businessId: raw.businessId || null,
    month,
    revenue: num(raw.revenue),
    expenses: num(raw.expenses),
    customers: num(raw.customers),
    note: raw.note || null,
    updatedAt: raw.updatedAt || null,
  };
}

/**
 * Reads the local metrics cache for a user.
 *
 * @param {string|null} userId - The user id.
 * @returns {Object[]} Metric records sorted oldest → newest.
 */
function readCache(userId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId || "anon"}`);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normaliseMetric({ ...entry, userId }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch (_) {
    return [];
  }
}

/**
 * Writes the local metrics cache for a user, trimming to the plan limit.
 *
 * @param {Object[]} metrics - Metric records.
 * @param {string|null} userId - The user id.
 * @param {number} [monthsKept] - Maximum number of months to retain.
 * @returns {void}
 */
function writeCache(metrics, userId, monthsKept) {
  try {
    const limit = Number.isFinite(monthsKept) ? monthsKept : DEFAULT_MONTHS_KEPT;
    const trimmed = [...metrics].sort((a, b) => a.month.localeCompare(b.month)).slice(-limit);
    localStorage.setItem(`${STORAGE_PREFIX}${userId || "anon"}`, JSON.stringify(trimmed));
  } catch (_) {
    /* best-effort only */
  }
}

/**
 * Converts a Supabase row into a metric record.
 *
 * @param {Object} row - Raw database row.
 * @returns {Object}
 */
function fromRow(row) {
  return normaliseMetric({
    userId: row.user_id,
    businessId: row.business_id,
    month: row.month,
    revenue: row.revenue,
    expenses: row.expenses,
    customers: row.customers,
    note: row.note,
    updatedAt: row.updated_at,
  });
}

/**
 * Fetches every monthly metric for a user, oldest month first.
 *
 * @param {string|null} userId - The user id.
 * @param {Object} [options={}] - Options.
 * @param {Object|null} [options.subscription] - Used to cap history length.
 * @returns {Promise<{ data: Object[], error: Object|null }>}
 */
export async function getMetrics(userId, options = {}) {
  const monthsKept = options.subscription
    ? getLimit(options.subscription, "growthMonthsKept", DEFAULT_MONTHS_KEPT)
    : DEFAULT_MONTHS_KEPT;

  if (!userId) {
    return { data: readCache(null), error: null };
  }

  try {
    const { data, error } = await supabase
      .from("business_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("month", { ascending: true });
    if (error) throw error;
    const records = (data || []).map(fromRow);
    if (!records.length) return { data: readCache(userId), error: null };
    return { data: records.slice(-monthsKept), error: null };
  } catch (err) {
    return { data: readCache(userId), error: err };
  }
}

/**
 * Saves (upserts) the numbers for one month.
 *
 * @param {Object} input - The metric to save.
 * @param {string|null} input.userId - The user id.
 * @param {string} [input.businessId] - Optional business the numbers belong to.
 * @param {string} [input.month] - `YYYY-MM`; defaults to this month.
 * @param {number} [input.revenue] - Total sales for the month.
 * @param {number} [input.expenses] - Total costs for the month.
 * @param {number} [input.customers] - Number of customers served.
 * @param {string} [input.note] - Optional note.
 * @param {Object} [options={}] - Options.
 * @param {Object|null} [options.subscription] - Caps the stored history.
 * @returns {Promise<{ data: Object, error: Object|null, capped: boolean }>}
 */
export async function saveMetric(input, options = {}) {
  const record = normaliseMetric(input);
  if (!record.userId) {
    return { data: null, error: new Error("Sign in to track your business growth."), capped: false };
  }

  const monthsKept = options.subscription
    ? getLimit(options.subscription, "growthMonthsKept", DEFAULT_MONTHS_KEPT)
    : DEFAULT_MONTHS_KEPT;

  const existing = readCache(record.userId).filter((m) => m.month !== record.month);
  const merged = [...existing, record].sort((a, b) => a.month.localeCompare(b.month));
  const capped = monthsKept !== Number.POSITIVE_INFINITY && merged.length > monthsKept;
  writeCache(merged, record.userId, monthsKept);
  const stored = readCache(record.userId).find((m) => m.month === record.month) || record;

  try {
    const { error } = await supabase
      .from("business_metrics")
      .upsert(
        {
          user_id: record.userId,
          business_id: record.businessId,
          month: record.month,
          revenue: record.revenue,
          expenses: record.expenses,
          customers: record.customers,
          note: record.note,
          updated_at: new Date().toISOString(),
        },
        { onConflict: ["user_id", "month"] }
      );
    if (error) return { data: stored, error, capped };
    return { data: stored, error: null, capped };
  } catch (err) {
    return { data: stored, error: err, capped };
  }
}

/**
 * Removes a single month of data.
 *
 * @param {string|null} userId - The user id.
 * @param {string} month - The `YYYY-MM` key to remove.
 * @returns {Promise<{ removed: boolean, error: Object|null }>}
 */
export async function deleteMetric(userId, month) {
  const remaining = readCache(userId).filter((m) => m.month !== month);
  writeCache(remaining, userId, Number.POSITIVE_INFINITY);
  try {
    const { error } = await supabase
      .from("business_metrics")
      .delete()
      .eq("user_id", userId)
      .eq("month", month);
    return { removed: true, error };
  } catch (err) {
    return { removed: true, error: err };
  }
}

/**
 * Computes the growth summary shown on the dashboard.
 *
 * @param {Object[]} metrics - Metric records, oldest month first.
 * @param {Object} [options={}] - Options.
 * @param {number} [options.forecastMonths=3] - Straight-line forecast length.
 * @returns {{
 *   hasData: boolean, months: number, latest: Object|null,
 *   revenue: number, expenses: number, profit: number, marginPct: number,
 *   customers: number, revenueChangePct: number|null,
 *   expenseChangePct: number|null, profitChangePct: number|null,
 *   customerChangePct: number|null, trend: number[], forecast: number[],
 *   direction: "up"|"flat"|"down"
 * }}
 */
export function computeGrowth(metrics = [], options = {}) {
  const forecastMonths = Number.isFinite(options.forecastMonths) ? options.forecastMonths : 3;
  const list = [...metrics]
    .map((m) => normaliseMetric(m))
    .sort((a, b) => a.month.localeCompare(b.month));

  if (!list.length) {
    return {
      hasData: false,
      months: 0,
      latest: null,
      revenue: 0,
      expenses: 0,
      profit: 0,
      marginPct: 0,
      customers: 0,
      revenueChangePct: null,
      expenseChangePct: null,
      profitChangePct: null,
      customerChangePct: null,
      trend: [],
      forecast: [],
      direction: "flat",
    };
  }

  const latest = list[list.length - 1];
  const previous = list.length > 1 ? list[list.length - 2] : null;
  const totalRevenue = list.reduce((sum, m) => sum + m.revenue, 0);
  const profit = latest.revenue - latest.expenses;

  const pctChange = (current, prior) => {
    if (prior == null) return null;
    if (prior === 0) return current === 0 ? 0 : 100;
    return ((current - prior) / Math.abs(prior)) * 100;
  };

  const revenueChangePct = previous ? pctChange(latest.revenue, previous.revenue) : null;
  const expenseChangePct = previous ? pctChange(latest.expenses, previous.expenses) : null;
  const customerChangePct = previous ? pctChange(latest.customers, previous.customers) : null;
  const profitChangePct = previous
    ? pctChange(profit, previous.revenue - previous.expenses)
    : null;

  const trend = list.map((m) => m.revenue);
  const forecast = forecastRevenue(trend, forecastMonths);

  return {
    hasData: true,
    months: list.length,
    latest,
    revenue: latest.revenue,
    expenses: latest.expenses,
    profit,
    marginPct: latest.revenue > 0 ? (profit / latest.revenue) * 100 : 0,
    customers: latest.customers,
    totalRevenue,
    revenueChangePct,
    expenseChangePct,
    profitChangePct,
    customerChangePct,
    trend,
    forecast,
    direction:
      revenueChangePct == null || Math.abs(revenueChangePct) < 1
        ? "flat"
        : revenueChangePct > 0
          ? "up"
          : "down",
  };
}

/**
 * Straight-line forecast based on the average month-on-month change of
 * the revenue series. Deliberately simple so it is explainable to the
 * business owner rather than a black box.
 *
 * @param {number[]} series - Revenue values, oldest first.
 * @param {number} months - How many months to project.
 * @returns {number[]}
 */
export function forecastRevenue(series, months = 3) {
  const values = (series || []).filter((n) => Number.isFinite(n));
  if (!values.length || months <= 0) return [];

  if (values.length === 1) return Array.from({ length: months }, () => Math.max(0, values[0]));

  const deltas = [];
  for (let i = 1; i < values.length; i += 1) deltas.push(values[i] - values[i - 1]);
  const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;

  const out = [];
  let running = values[values.length - 1];
  for (let i = 0; i < months; i += 1) {
    running = Math.max(0, running + avgDelta);
    out.push(Math.round(running));
  }
  return out;
}

export default {
  getMetrics,
  saveMetric,
  deleteMetric,
  computeGrowth,
  forecastRevenue,
  currentMonthKey,
  formatMonthLabel,
  shiftMonth,
  normaliseMetric,
};
