/**
 * @file Role helpers.
 * @description Decides whether the signed-in user may open the admin
 * dashboard. Admins are identified by email address, configured through
 * `VITE_ADMIN_EMAILS` (comma separated) with a hard-coded fallback list
 * so the dashboard is testable without any environment setup.
 */

/**
 * Fallback admin emails, used when `VITE_ADMIN_EMAILS` is not set.
 *
 * @type {string[]}
 */
export const DEFAULT_ADMIN_EMAILS = ["admin@mapmybizz.co.za"];

/**
 * Normalises a list of emails to lowercase, trimmed values.
 *
 * @param {string|string[]|null|undefined} value - Comma separated string or array.
 * @returns {string[]}
 */
function normaliseEmailList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : String(value).split(",");
  return list
    .map((entry) => String(entry).trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

/**
 * The configured admin email allow-list.
 *
 * @type {string[]}
 */
export const ADMIN_EMAILS = (() => {
  const fromEnv =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_ADMIN_EMAILS
      : null;
  const list = normaliseEmailList(fromEnv);
  return list.length ? list : normaliseEmailList(DEFAULT_ADMIN_EMAILS);
})();

/**
 * Returns whether the given user object is an admin.
 *
 * An account is an admin when its Supabase `user_metadata.role` is
 * `admin` (set once from the Supabase dashboard) or when its email is in
 * the configured allow-list.
 *
 * @param {{ email?: string, role?: string }|null|undefined} user - The authenticated user.
 * @returns {boolean}
 */
export function isAdminUser(user) {
  if (String(user?.role || "").toLowerCase() === "admin") return true;
  const email = String(user?.email || "")
    .trim()
    .toLowerCase();
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

export default { ADMIN_EMAILS, DEFAULT_ADMIN_EMAILS, isAdminUser };
