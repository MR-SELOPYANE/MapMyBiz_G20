/**
 * @file Tourism service.
 * @description Reads bookable rural experiences from Supabase and falls back
 * to the seed data in `src/data/tourism.js` plus any tourism businesses
 * already registered on the map, so the tourism page always has something to
 * show. Also handles the weekly digest signup for travellers.
 */

import supabase from "./supabase.js";
import { getAllBusinesses } from "./business.service.js";
import {
  SAMPLE_EXPERIENCES,
  experiencesFromBusinesses,
  isTourismBusiness,
  normaliseExperience,
} from "../data/tourism.js";

/** Local fallback key for digest signups made while offline. */
const DIGEST_KEY = "mmb_tourism_digest";

/**
 * Returns whether a row from `tourism_experiences` is publicly bookable.
 * Only approved and verified listings are shown to travellers.
 *
 * @param {Object} row - Raw database row.
 * @returns {boolean}
 */
function isPublishable(row) {
  if (!row) return false;
  if (row.status) return row.status === "approved" || row.status === "published";
  return true;
}

/**
 * Removes sample listings whose place is already covered by a real listing
 * from the database, so hosts do not appear twice.
 *
 * @param {Object[]} realExperiences - Experiences loaded from the database.
 * @param {Object[]} seedExperiences - Seed experiences.
 * @returns {Object[]} Seed experiences with duplicates removed.
 */
function dedupeAgainstReal(realExperiences, seedExperiences) {
  const realKeys = new Set(
    realExperiences
      .filter((experience) => experience.businessId != null)
      .map((experience) => `biz-${experience.businessId}`),
  );
  return seedExperiences.filter(
    (experience) => experience.businessId == null || !realKeys.has(experience.id),
  );
}

/**
 * Loads every bookable tourism experience.
 *
 * Resolution order:
 *  1. rows in `tourism_experiences` (requires the `sql/tourism.sql` migration),
 *  2. tourism businesses already in the `businesses` table,
 *  3. the bundled seed listings.
 *
 * @returns {Promise<{ data: Object[], source: string, error: Object|null }>}
 */
export async function getTourismExperiences() {
  let realExperiences = [];
  let error = null;

  try {
    const { data, error: queryError } = await supabase
      .from("tourism_experiences")
      .select("*")
      .order("rating", { ascending: false });
    if (queryError) {
      error = queryError;
    } else {
      realExperiences = (data || []).filter(isPublishable).map(normaliseExperience);
    }
  } catch (err) {
    // Table not created yet — treated the same as a failed query.
    error = err;
  }

  if (realExperiences.length) {
    return { data: realExperiences, source: "database", error: null };
  }

  let businesses = [];
  try {
    const { data } = await getAllBusinesses();
    businesses = (data || []).filter(isTourismBusiness);
  } catch {
    businesses = [];
  }

  const fromBusinesses = experiencesFromBusinesses(businesses);
  const seeds = dedupeAgainstReal(fromBusinesses, SAMPLE_EXPERIENCES);
  const merged = [...fromBusinesses, ...seeds];

  return { data: merged, source: businesses.length ? "businesses" : "seed", error };
}

/**
 * Reads digest signups stored locally (used when Supabase is unavailable).
 *
 * @returns {string[]} List of email addresses.
 */
function readLocalDigest() {
  try {
    const raw = localStorage.getItem(DIGEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Adds an email address to the weekly rural experiences digest.
 * Falls back to local storage so the signup is never lost.
 *
 * @param {string} email - The traveller's email address.
 * @returns {Promise<{ saved: boolean, offline: boolean, error: Object|null }>}
 */
export async function subscribeToTourismDigest(email) {
  const address = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    return { saved: false, offline: false, error: new Error("Enter a valid email address.") };
  }

  const existing = readLocalDigest();
  if (!existing.includes(address)) {
    existing.push(address);
    try {
      localStorage.setItem(DIGEST_KEY, JSON.stringify(existing));
    } catch {
      /* ignore storage errors */
    }
  }

  try {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: address, source: "tourism_page" });
    if (!error) return { saved: true, offline: false, error: null };
    return { saved: true, offline: true, error: null };
  } catch {
    return { saved: true, offline: true, error: null };
  }
}

/**
 * Returns whether an email address is already on the local digest list.
 *
 * @param {string} email - Email address to check.
 * @returns {boolean}
 */
export function isOnTourismDigest(email) {
  const address = String(email || "").trim().toLowerCase();
  return address ? readLocalDigest().includes(address) : false;
}

export default {
  getTourismExperiences,
  subscribeToTourismDigest,
  isOnTourismDigest,
};
