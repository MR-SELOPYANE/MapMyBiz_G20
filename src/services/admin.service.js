/**
 * @file Admin service.
 * @description Everything the admin dashboard needs:
 *  - platform business analytics (users, listings, MRR, churn, growth)
 *  - subscription checking (list, search, change plan, pause, resume)
 *  - promotion campaigns (create, activate, deactivate, delete)
 *  - listing approvals (approve / reject / feature a business)
 *
 * Every read prefers Supabase and falls back to a `localStorage` snapshot
 * so an admin can still work on a machine with no data connection.
 */

import supabase from "./supabase.js";
import { PLANS, PLAN_IDS, SUB_STATUS, getPlanById } from "../data/plans.js";
import { getAllBusinesses } from "./business.service.js";

/** localStorage key for the admin-side offline snapshot. */
const SNAPSHOT_KEY = "mmb_admin_snapshot";

/** Valid business listing states. */
export const BUSINESS_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  FEATURED: "featured",
};

/**
 * Reads the offline admin snapshot.
 *
 * @returns {Object}
 */
function readSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

/**
 * Merges values into the offline admin snapshot.
 *
 * @param {Object} patch - Partial snapshot.
 * @returns {void}
 */
function writeSnapshot(patch) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ ...readSnapshot(), ...patch }));
  } catch (_) {
    /* best-effort only */
  }
}

/**
 * Fetches all user profiles (used for subscriber records and counts).
 *
 * @returns {Promise<{ data: Object[], error: Object|null }>}
 */
async function fetchProfiles() {
  try {
    const { data, error } = await supabase.from("user_profiles").select("*");
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: readSnapshot().profiles || [], error: err };
  }
}

/**
 * Fetches all subscription rows.
 *
 * @returns {Promise<{ data: Object[], error: Object|null }>}
 */
async function fetchSubscriptions() {
  try {
    const { data, error } = await supabase.from("subscriptions").select("*");
    if (error) throw error;
    const rows = data || [];
    if (rows.length) writeSnapshot({ subscriptions: rows });
    return { data: rows, error: null };
  } catch (err) {
    return { data: readSnapshot().subscriptions || [], error: err };
  }
}

/**
 * Joins profiles and subscriptions into one subscriber list.
 *
 * @returns {Promise<{ data: Object[], error: Object|null }>}
 */
export async function listSubscribers() {
  const [{ data: profiles }, { data: subs }] = await Promise.all([
    fetchProfiles(),
    fetchSubscriptions(),
  ]);
  writeSnapshot({ profiles });

  const byUser = new Map(subs.map((row) => [row.user_id, row]));

  const merged = profiles.map((profile) => {
    const sub = byUser.get(profile.id) || null;
    const plan = getPlanById(sub?.plan_id) || getPlanById(PLAN_IDS.FREE);
    const status = sub?.status || SUB_STATUS.NONE;
    return {
      userId: profile.id,
      name: profile.full_name || profile.name || profile.email || "Unnamed user",
      email: profile.email || "—",
      phone: profile.phone || null,
      createdAt: profile.created_at || null,
      planId: plan.id,
      planName: plan.name,
      price: status === SUB_STATUS.ACTIVE ? plan.price : 0,
      status,
      startedAt: sub?.started_at || null,
      renewsAt: sub?.renews_at || null,
      cancelledAt: sub?.cancelled_at || null,
      paymentMethod: sub?.payment_method || null,
      reference: sub?.reference || null,
      isPaying: status === SUB_STATUS.ACTIVE && plan.id !== PLAN_IDS.FREE,
    };
  });

  // Subscriptions without a matching profile row (e.g. Clerk-only accounts).
  subs.forEach((sub) => {
    if (byUser.has(sub.user_id) && merged.some((m) => m.userId === sub.user_id)) return;
    const plan = getPlanById(sub.plan_id) || getPlanById(PLAN_IDS.FREE);
    merged.push({
      userId: sub.user_id,
      name: "Pending profile",
      email: "—",
      phone: null,
      createdAt: sub.created_at || null,
      planId: plan.id,
      planName: plan.name,
      price: sub.status === SUB_STATUS.ACTIVE ? plan.price : 0,
      status: sub.status,
      startedAt: sub.started_at,
      renewsAt: sub.renews_at,
      cancelledAt: sub.cancelled_at,
      paymentMethod: sub.payment_method,
      reference: sub.reference,
      isPaying: sub.status === SUB_STATUS.ACTIVE && plan.id !== PLAN_IDS.FREE,
    });
  });

  return { data: merged, error: null };
}

/**
 * Aggregated platform analytics for the admin overview.
 *
 * @returns {Promise<{ data: Object, error: Object|null }>}
 */
export async function getPlatformStats() {
  const [{ data: subscribers }, { data: businessesResult }] = await Promise.all([
    listSubscribers(),
    getAllBusinesses(),
  ]);

  const businesses = businessesResult || [];

  const paying = subscribers.filter((s) => s.isPaying);
  const byPlan = PLANS.map((plan) => {
    const rows = subscribers.filter((s) => s.planId === plan.id);
    const activeRows = rows.filter((s) => s.status === SUB_STATUS.ACTIVE);
    return {
      planId: plan.id,
      name: plan.name,
      price: plan.price,
      total: rows.length,
      active: activeRows.length,
      sharePct: subscribers.length
        ? Math.round((rows.length / subscribers.length) * 100)
        : 0,
    };
  });

  const mrr = paying.reduce((sum, s) => sum + s.price, 0);
  const cancelled = subscribers.filter((s) => s.status === SUB_STATUS.CANCELLED);
  const pastDue = subscribers.filter((s) => s.status === SUB_STATUS.PAST_DUE);
  const renewingSoon = paying.filter((s) => {
    if (!s.renewsAt) return false;
    const days = (new Date(s.renewsAt) - Date.now()) / 86400000;
    return days >= 0 && days <= 14;
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const newThisMonth = subscribers.filter((s) => s.createdAt && new Date(s.createdAt) >= monthStart);

  const byStatus = {
    [BUSINESS_STATUS.PENDING]: businesses.filter((b) => b.status === BUSINESS_STATUS.PENDING).length,
    [BUSINESS_STATUS.APPROVED]: businesses.filter((b) => b.status === BUSINESS_STATUS.APPROVED).length,
    [BUSINESS_STATUS.FEATURED]: businesses.filter((b) => b.status === BUSINESS_STATUS.FEATURED).length,
    [BUSINESS_STATUS.REJECTED]: businesses.filter((b) => b.status === BUSINESS_STATUS.REJECTED).length,
  };

  const youthOwned = businesses.filter((b) => b.is_youth_owned).length;

  const categoryCounts = businesses.reduce((acc, b) => {
    const key = b.category || "Uncategorised";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const activeSubscribers = subscribers.filter(
    (s) => s.isPaying || s.planId === PLAN_IDS.FREE
  ).length;
  const conversionPct = subscribers.length
    ? Math.round((paying.length / subscribers.length) * 100)
    : 0;
  const churnPct = subscribers.length
    ? Math.round((cancelled.length / subscribers.length) * 100)
    : 0;

  return {
    data: {
      totals: {
        users: subscribers.length,
        newUsersThisMonth: newThisMonth.length,
        activeUsers: activeSubscribers,
        businesses: businesses.length,
        youthOwned,
        mrr,
        payingSubscribers: paying.length,
        freeSubscribers: subscribers.filter((s) => s.planId === PLAN_IDS.FREE).length,
        conversionPct,
        churnPct,
        cancelledSubscribers: cancelled.length,
        pastDueSubscribers: pastDue.length,
        renewingSoon: renewingSoon.length,
      },
      byPlan,
      businessStatus: byStatus,
      topCategories,
    },
    error: null,
  };
}

/**
 * Approves, rejects or features a business listing.
 *
 * @param {string|number} businessId - The listing id.
 * @param {string} status - A value from {@link BUSINESS_STATUS}.
 * @returns {Promise<{ error: Object|null }>}
 */
export async function setBusinessStatus(businessId, status) {
  if (!Object.values(BUSINESS_STATUS).includes(status)) {
    return { error: new Error("Unknown listing status.") };
  }
  try {
    const { error } = await supabase
      .from("businesses")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", businessId);
    return { error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Fetches listings awaiting review, newest first.
 *
 * @returns {Promise<{ data: Object[], error: Object|null }>}
 */
export async function listPendingBusinesses() {
  const { data, error } = await getAllBusinesses();
  if (error) return { data: [], error };
  const pending = (data || [])
    .filter((b) => b.status === BUSINESS_STATUS.PENDING)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return { data: pending, error: null };
}

/**
 * Admin-initiated subscription change: set a plan, pause, or cancel.
 *
 * @param {string} userId - The subscriber's user id.
 * @param {Object} patch - Fields to change.
 * @param {string} [patch.planId] - New plan id.
 * @param {string} [patch.status] - New subscription status.
 * @param {string} [patch.note] - Optional internal note (not persisted).
 * @returns {Promise<{ error: Object|null }>}
 */
export async function updateSubscriber(userId, patch = {}) {
  if (!userId) return { error: new Error("A user id is required.") };

  const update = { updated_at: new Date().toISOString() };
  if (patch.planId) {
    const plan = getPlanById(patch.planId);
    if (!plan) return { error: new Error("Unknown plan.") };
    update.plan_id = plan.id;
    if (!update.status) {
      update.status = plan.id === PLAN_IDS.FREE ? SUB_STATUS.NONE : SUB_STATUS.ACTIVE;
    }
  }
  if (patch.status) {
    if (!Object.values(SUB_STATUS).includes(patch.status)) {
      return { error: new Error("Unknown subscription status.") };
    }
    update.status = patch.status;
    if (patch.status === SUB_STATUS.CANCELLED) update.cancelled_at = new Date().toISOString();
    if (patch.status === SUB_STATUS.ACTIVE) update.cancelled_at = null;
  }
  if (patch.renewsAt) update.renews_at = patch.renewsAt;

  try {
    const { error } = await supabase.from("subscriptions").upsert(
      { user_id: userId, ...update },
      { onConflict: ["user_id"] }
    );
    return { error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Normalises a promotion record.
 *
 * @param {Object} [raw={}] - Partial promotion.
 * @returns {Object}
 */
export function normalisePromotion(raw = {}) {
  return {
    id: raw.id || null,
    title: raw.title || "Untitled campaign",
    channel: raw.channel || "platform",
    discountPct: Number(raw.discountPct) || 0,
    code: raw.code || null,
    startsAt: raw.startsAt || null,
    endsAt: raw.endsAt || null,
    audience: raw.audience || "all",
    active: raw.active !== false,
    clicks: Number(raw.clicks) || 0,
    signups: Number(raw.signups) || 0,
    createdAt: raw.createdAt || null,
  };
}

/**
 * Fetches all promotion campaigns.
 *
 * @returns {Promise<{ data: Object[], error: Object|null }>}
 */
export async function listPromotions() {
  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const rows = (data || []).map((row) =>
      normalisePromotion({
        id: row.id,
        title: row.title,
        channel: row.channel,
        discountPct: row.discount_pct,
        code: row.code,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        audience: row.audience,
        active: row.active,
        clicks: row.clicks,
        signups: row.signups,
        createdAt: row.created_at,
      })
    );
    if (rows.length) writeSnapshot({ promotions: rows });
    return { data: rows, error: null };
  } catch (err) {
    return { data: readSnapshot().promotions || [], error: err };
  }
}

/**
 * Creates a promotion campaign.
 *
 * @param {Object} promotion - Campaign fields.
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function createPromotion(promotion) {
  if (!promotion || !String(promotion.title || "").trim()) {
    return { data: null, error: new Error("A campaign title is required.") };
  }

  const record = normalisePromotion({ ...promotion, createdAt: new Date().toISOString() });

  try {
    const { data, error } = await supabase
      .from("promotions")
      .insert({
        title: record.title,
        channel: record.channel,
        discount_pct: record.discountPct,
        code: record.code,
        starts_at: record.startsAt,
        ends_at: record.endsAt,
        audience: record.audience,
        active: record.active,
        clicks: record.clicks,
        signups: record.signups,
        created_at: record.createdAt,
      })
      .select();

    if (error) return { data: record, error };
    const created = normalisePromotion({ ...record, id: data?.[0]?.id || null });
    return { data: created, error: null };
  } catch (err) {
    return { data: record, error: err };
  }
}

/**
 * Activates or deactivates a campaign.
 *
 * @param {string|number} id - The campaign id.
 * @param {boolean} active - Desired state.
 * @returns {Promise<{ error: Object|null }>}
 */
export async function setPromotionActive(id, active) {
  try {
    const { error } = await supabase
      .from("promotions")
      .update({ active: Boolean(active) })
      .eq("id", id);
    return { error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Deletes a campaign.
 *
 * @param {string|number} id - The campaign id.
 * @returns {Promise<{ error: Object|null }>}
 */
export async function deletePromotion(id) {
  try {
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    return { error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Returns a short human summary of a subscription for the admin table.
 *
 * @param {Object} subscriber - A record from {@link listSubscribers}.
 * @returns {string}
 */
export function describeSubscription(subscriber) {
  if (!subscriber) return "—";
  const { planName, status, renewsAt } = subscriber;
  if (status === SUB_STATUS.NONE) return `${planName} · no payment`;
  if (status === SUB_STATUS.CANCELLED) return `${planName} · cancelled`;
  if (status === SUB_STATUS.PAST_DUE) return `${planName} · payment overdue`;
  if (status === SUB_STATUS.EXPIRED) return `${planName} · expired`;
  if (renewsAt) {
    return `${planName} · renews ${new Date(renewsAt).toLocaleDateString("en-ZA")}`;
  }
  return `${planName} · active`;
}

export default {
  getPlatformStats,
  listSubscribers,
  updateSubscriber,
  listPromotions,
  createPromotion,
  setPromotionActive,
  deletePromotion,
  listPendingBusinesses,
  setBusinessStatus,
  describeSubscription,
  BUSINESS_STATUS,
};
