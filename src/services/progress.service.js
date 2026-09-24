/**
 * @file Learning progress service.
 * @description Tracks which learning modules a user has completed and
 * remembers the last module they opened, using the Supabase
 * `user_progress` table and `localStorage` for offline fallback.
 */

import supabase from "./supabase.js";

/** Storage key used for the offline last-module fallback. */
const LAST_MODULE_KEY = "lastOpenedModule";

/**
 * Retrieves the list of module IDs a user has marked as completed.
 *
 * Falls back to the `completedModules` localStorage entry when the user
 * is not authenticated or the server is unreachable.
 *
 * @param {string} [userId] - The authenticated user's ID.
 * @returns {Promise<{ data: string[], error: Object|null }>}
 */
export async function getUserProgress(userId) {
  if (!userId) {
    try {
      const raw = localStorage.getItem("completedModules");
      return { data: raw ? JSON.parse(raw) : [], error: null };
    } catch (err) {
      return { data: [], error: err };
    }
  }

  const { data, error } = await supabase
    .from("user_progress")
    .select("module_id")
    .eq("user_id", userId);

  if (error) {
    return { data: [], error };
  }

  return { data: data?.map((row) => row.module_id) || [], error: null };
}

/**
 * Marks a module as completed for the given user. Uses an upsert so the
 * same module is never recorded twice.
 *
 * @param {string} userId - The authenticated user's ID.
 * @param {string|number} moduleId - The module identifier (e.g. "Module 1").
 * @returns {Promise<{ data: Object|null, error: Object|null }>}
 */
export async function markModuleCompleted(userId, moduleId) {
  if (!userId || !moduleId) {
    return { data: null, error: new Error("User ID and module ID are required.") };
  }

  const { data, error } = await supabase
    .from("user_progress")
    .upsert({
      user_id: userId,
      module_id: String(moduleId),
      completed_at: new Date().toISOString(),
    }, { onConflict: ["user_id", "module_id"] })
    .select();

  if (error) return { data: null, error };

  // Mirror to localStorage as an offline fallback
  try {
    const raw = localStorage.getItem("completedModules");
    const completed = raw ? JSON.parse(raw) : [];
    if (!completed.includes(String(moduleId))) {
      completed.push(String(moduleId));
      localStorage.setItem("completedModules", JSON.stringify(completed));
    }
  } catch (_) {
    /* best-effort cache update */
  }

  return { data: data?.[0] || null, error: null };
}

/**
 * Retrieves the last module the user opened (from localStorage).
 *
 * @returns {string|null} The last module ID, or `null` if none recorded.
 */
export function getLastModule() {
  try {
    return localStorage.getItem(LAST_MODULE_KEY);
  } catch (_) {
    return null;
  }
}

/**
 * Persists the last opened module to localStorage.
 *
 * @param {string|number} moduleId - The module identifier.
 * @returns {void}
 */
export function saveLastModule(moduleId) {
  try {
    localStorage.setItem(LAST_MODULE_KEY, String(moduleId));
  } catch (_) {
    /* ignore storage errors */
  }
}
