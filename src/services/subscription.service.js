/**
 * @file Subscription service.
 * @description Reads and writes the signed-in user's subscription plan.
 * Supabase `subscriptions` is the source of truth; `localStorage` mirrors
 * every write so the dashboard still renders a correct, plan-aware page
 * on a basic phone with no data connection.
 *
 * Every mutation emits a `subscription-change` window event so the
 * dashboard can re-render itself dynamically the moment a plan changes.
 */

import supabase from "./supabase.js";
import {
  FEATURES,
  PLAN_IDS,
  PLAN_RANK,
  SUB_STATUS,
  getPlanById,
  getFreePlan,
} from "../data/plans.js";

/** localStorage key prefix for the mirrored subscription cache. */
const STORAGE_PREFIX = "mmb_subscription_";

/** Storage key used when no user is signed in. */
const ANON_KEY = `${STORAGE_PREFIX}anon`;

/** Event name dispatched on the window when a subscription changes. */
export const SUBSCRIPTION_EVENT = "subscription-change";

/**
 * Emits a `subscription-change` event on the window.
 *
 * @param {Object|null} subscription - The subscription that changed.
 * @returns {void}
 */
function emitChange(subscription) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SUBSCRIPTION_EVENT, { detail: subscription || null })
  );
}

/**
 * Subscribes to subscription changes (e.g. after a plan upgrade).
 *
 * @param {Function} listener - Callback receiving the new subscription.
 * @returns {Function} An unsubscribe function.
 */
export function onSubscriptionChange(listener) {
  if (typeof window === "undefined") return () => {};
  const handler = (event) => listener(event.detail);
  window.addEventListener(SUBSCRIPTION_EVENT, handler);
  return () => window.removeEventListener(SUBSCRIPTION_EVENT, handler);
}

/**
 * Builds a fully-populated subscription record, filling in the free plan
 * for anonymous users and clamping any unknown values.
 *
 * @param {Object} [raw={}] - Partial subscription data.
 * @returns {Object} A normalised subscription record.
 */
export function normaliseSubscription(raw = {}) {
  const status = Object.values(SUB_STATUS).includes(raw.status)
    ? raw.status
    : raw.planId && raw.planId !== PLAN_IDS.FREE
      ? SUB_STATUS.ACTIVE
      : SUB_STATUS.NONE;

  const planId = getPlanById(raw.planId) ? raw.planId : PLAN_IDS.FREE;

  return {
    userId: raw.userId || null,
    planId,
    status,
    startedAt: raw.startedAt || null,
    renewsAt: raw.renewsAt || null,
    cancelledAt: raw.cancelledAt || null,
    paymentMethod: raw.paymentMethod || null,
    reference: raw.reference || null,
    updatedAt: raw.updatedAt || null,
  };
}

/**
 * Returns the free ("no subscription") record.
 *
 * @param {string|null} [userId=null] - Optional owner id.
 * @returns {Object}
 */
export function freeSubscription(userId = null) {
  return normaliseSubscription({ userId, planId: PLAN_IDS.FREE, status: SUB_STATUS.NONE });
}

/**
 * Returns whether a subscription currently grants paid access.
 * Cancelled, expired and past-due subscriptions fall back to free.
 *
 * @param {Object|null} subscription - A subscription record.
 * @returns {boolean}
 */
export function isPaidPlan(subscription) {
  if (!subscription) return false;
  if (subscription.planId === PLAN_IDS.FREE) return false;
  if (subscription.status === SUB_STATUS.CANCELLED) return false;
  if (subscription.status === SUB_STATUS.EXPIRED) return false;
  if (subscription.renewsAt && new Date(subscription.renewsAt) < new Date()) return false;
  return true;
}

/**
 * Resolves the plan definition a subscription currently grants.
 *
 * @param {Object|null} subscription - A subscription record.
 * @returns {Object} A plan definition (never `null`).
 */
export function getActivePlan(subscription) {
  if (!isPaidPlan(subscription)) return getFreePlan();
  return getPlanById(subscription.planId) || getFreePlan();
}

/**
 * Returns whether a subscription unlocks a given feature.
 *
 * @param {Object|null} subscription - A subscription record.
 * @param {string} feature - A key from `FEATURES`.
 * @returns {boolean}
 */
export function hasFeature(subscription, feature) {
  const plan = getActivePlan(subscription);
  return Array.isArray(plan.features) && plan.features.includes(feature);
}

/**
 * Reads a numeric limit for the active plan, with a safe default.
 *
 * @param {Object|null} subscription - A subscription record.
 * @param {string} key - A key from the plan's `limits` object.
 * @param {number} [fallback=0] - Value used when the key is unknown.
 * @returns {number}
 */
export function getLimit(subscription, key, fallback = 0) {
  const plan = getActivePlan(subscription);
  const value = plan.limits?.[key];
  return typeof value === "number" ? value : fallback;
}

/**
 * Returns the lowest plan that would unlock a feature, or `null` when no
 * paid plan does. Used to render "Upgrade to Pro" hints on locked cards.
 *
 * @param {string} feature - A key from `FEATURES`.
 * @returns {Object|null}
 */
export function getMinimumPlanFor(feature) {
  const candidates = Object.keys(PLAN_RANK)
    .filter((id) => id !== PLAN_IDS.FREE)
    .map((id) => getPlanById(id))
    .filter((plan) => plan.features.includes(feature))
    .sort((a, b) => PLAN_RANK[a.id] - PLAN_RANK[b.id]);
  return candidates[0] || null;
}

/**
 * Converts a Supabase row into a subscription record.
 *
 * @param {Object|null} row - Raw database row.
 * @returns {Object|null}
 */
function fromRow(row) {
  if (!row) return null;
  return normaliseSubscription({
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status,
    startedAt: row.started_at,
    renewsAt: row.renews_at,
    cancelledAt: row.cancelled_at,
    paymentMethod: row.payment_method,
    reference: row.reference,
    updatedAt: row.updated_at,
  });
}

/**
 * Converts a subscription record into a Supabase row.
 *
 * @param {Object} subscription - A subscription record.
 * @returns {Object}
 */
function toRow(subscription) {
  return {
    user_id: subscription.userId,
    plan_id: subscription.planId,
    status: subscription.status,
    started_at: subscription.startedAt,
    renews_at: subscription.renewsAt,
    cancelled_at: subscription.cancelledAt,
    payment_method: subscription.paymentMethod,
    reference: subscription.reference,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Reads the locally cached subscription for a user.
 *
 * @param {string|null} userId - The user id, or `null` when anonymous.
 * @returns {Object} A normalised subscription record.
 */
function readCache(userId) {
  try {
    const raw = localStorage.getItem(userId ? `${STORAGE_PREFIX}${userId}` : ANON_KEY);
    if (!raw) return freeSubscription(userId);
    return normaliseSubscription(JSON.parse(raw));
  } catch (_) {
    return freeSubscription(userId);
  }
}

/**
 * Writes the local cache for a user.
 *
 * @param {Object} subscription - A subscription record.
 * @returns {void}
 */
function writeCache(subscription) {
  try {
    const key = subscription.userId ? `${STORAGE_PREFIX}${subscription.userId}` : ANON_KEY;
    localStorage.setItem(key, JSON.stringify(subscription));
  } catch (_) {
    /* storage is best-effort only */
  }
}

/**
 * Fetches a user's subscription, preferring Supabase and falling back to
 * the local cache when the table is unreachable.
 *
 * @param {string|null} [userId] - The authenticated user's id.
 * @returns {Promise<{ data: Object, error: Object|null, source: string }>}
 */
export async function getSubscription(userId) {
  if (!userId) {
    return { data: readCache(null), error: null, source: "cache" };
  }

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // No server record yet — treat as free but keep any local upgrade.
      return { data: readCache(userId), error: null, source: "cache" };
    }

    const subscription = fromRow(data);
    writeCache(subscription);
    return { data: subscription, error: null, source: "supabase" };
  } catch (err) {
    return { data: readCache(userId), error: err, source: "cache" };
  }
}

/**
 * Activates (or changes) a user's plan.
 *
 * @param {string|null} userId - The user id.
 * @param {string} planId - A plan id from `PLAN_IDS`.
 * @param {Object} [options={}] - Optional metadata.
 * @param {string} [options.paymentMethod] - e.g. "card", "eft", "voucher".
 * @param {string} [options.reference] - Payment reference.
 * @param {number} [options.months=1] - How many months to activate for.
 * @returns {Promise<{ data: Object, error: Object|null }>}
 */
export async function activatePlan(userId, planId, options = {}) {
  const plan = getPlanById(planId);
  if (!plan) {
    return { data: null, error: new Error("Unknown subscription plan.") };
  }
  if (!userId) {
    return { data: null, error: new Error("Sign in to change your subscription.") };
  }

  const now = new Date();
  const months = Number.isFinite(options.months) && options.months > 0 ? options.months : 1;
  const renews = new Date(now);
  renews.setMonth(renews.getMonth() + months);

  const subscription = normaliseSubscription({
    userId,
    planId: plan.id,
    status: plan.id === PLAN_IDS.FREE ? SUB_STATUS.NONE : SUB_STATUS.ACTIVE,
    startedAt: now.toISOString(),
    renewsAt: plan.id === PLAN_IDS.FREE ? null : renews.toISOString(),
    cancelledAt: null,
    paymentMethod: options.paymentMethod || null,
    reference: options.reference || null,
    updatedAt: now.toISOString(),
  });

  writeCache(subscription);
  emitChange(subscription);

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(toRow(subscription), { onConflict: ["user_id"] })
      .select();
    if (error) return { data: subscription, error };
    return { data: fromRow(data?.[0]) || subscription, error: null };
  } catch (err) {
    return { data: subscription, error: err };
  }
}

/**
 * Cancels a subscription at the end of the current period. Paid access
 * continues until `renewsAt`, matching how most SA SaaS plans behave.
 *
 * @param {string|null} userId - The user id.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function cancelPlan(userId) {
  const { data: current } = await getSubscription(userId);
  if (!isPaidPlan(current)) {
    return { data: current, error: null };
  }

  const subscription = normaliseSubscription({
    ...current,
    status: SUB_STATUS.CANCELLED,
    cancelledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  writeCache(subscription);
  emitChange(subscription);

  try {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: subscription.status, cancelled_at: subscription.cancelledAt })
      .eq("user_id", userId);
    return { data: subscription, error };
  } catch (err) {
    return { data: subscription, error: err };
  }
}

/**
 * Logs how many AI analyses a user has run this month, used to enforce
 * the per-plan quota. Stored locally so the limit holds on any device.
 *
 * @param {string|null} userId - The user id.
 * @returns {{ month: string, used: number }}
 */
export function getAiUsage(userId) {
  const month = new Date().toISOString().slice(0, 7);
  try {
    const raw = localStorage.getItem(`mmb_ai_usage_${userId || "anon"}`);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && parsed.month === month) {
      return { month, used: Number(parsed.used) || 0 };
    }
  } catch (_) {
    /* fall through to zero usage */
  }
  return { month, used: 0 };
}

/**
 * Increments the AI usage counter for the current month.
 *
 * @param {string|null} userId - The user id.
 * @returns {{ month: string, used: number }}
 */
export function recordAiUsage(userId) {
  const { month, used } = getAiUsage(userId);
  const next = { month, used: used + 1 };
  try {
    localStorage.setItem(`mmb_ai_usage_${userId || "anon"}`, JSON.stringify(next));
  } catch (_) {
    /* best-effort only */
  }
  return next;
}

/**
 * Returns how many AI analyses remain this month for a subscription.
 *
 * @param {Object|null} subscription - A subscription record.
 * @param {string|null} [userId] - The user id.
 * @returns {number} Remaining allowance, `0` when exhausted.
 */
export function remainingAiAnalyses(subscription, userId) {
  const limit = getLimit(subscription, "aiAnalysesPerMonth", 0);
  if (limit === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
  const { used } = getAiUsage(userId);
  return Math.max(0, limit - used);
}

/**
 * Listens for plan changes coming from other components.
 *
 * @param {Function} callback - Invoked with the new subscription.
 * @returns {Function} Unsubscribe function.
 */
export function subscribeToSubscription(callback) {
  return onSubscriptionChange(callback);
}

export { FEATURES, PLAN_IDS, PLAN_RANK, SUB_STATUS, getPlanById, getFreePlan };

export default {
  getSubscription,
  activatePlan,
  cancelPlan,
  getActivePlan,
  hasFeature,
  getLimit,
  getMinimumPlanFor,
  isPaidPlan,
  normaliseSubscription,
  freeSubscription,
  remainingAiAnalyses,
  getAiUsage,
  recordAiUsage,
  onSubscriptionChange,
  subscribeToSubscription,
};
