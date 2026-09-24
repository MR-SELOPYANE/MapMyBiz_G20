/**
 * @file Display formatters.
 * @description Utility functions for formatting phone numbers, currency,
 * dates, and text for presentation in the UI.
 */

/**
 * Formats a South African phone number into a readable display string.
 * Converts `+27618557707` → `+27 61 855 7707`.
 *
 * @param {string} phone - Raw phone number.
 * @returns {string} The formatted number, or an empty string if invalid.
 */
export function formatPhone(phone) {
  if (!phone) return "";

  let digits = String(phone).replace(/[\s.\-()]/g, "");
  if (/^0\d{9}$/.test(digits)) {
    digits = "+27" + digits.slice(1);
  }

  if (!/^\+27\d{9}$/.test(digits)) return phone;

  const d = digits.slice(3);
  const parts = [
    "+27",
    d.slice(0, 2),
    d.slice(2, 5),
    d.slice(5, 8),
    d.slice(8, 12),
  ].filter(Boolean);

  return parts.join(" ");
}

/**
 * Formats a number as ZAR currency.
 *
 * @param {number|string} amount - The amount to format.
 * @param {Object} [options] - Intl.NumberFormat options.
 * @param {string} [options.locale="en-ZA"] - Locale identifier.
 * @returns {string} The formatted currency string (e.g. "R 1,234.56").
 */
export function formatCurrency(amount, options = {}) {
  const { locale = "en-ZA" } = options;
  const num = typeof amount === "number" ? amount : parseFloat(amount);

  if (isNaN(num)) return "R 0.00";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats an ISO date string into a human-readable, locale-aware date.
 *
 * @param {string|Date} date - The date to format.
 * @param {Object} [options] - Intl.DateTimeFormat options.
 * @param {string} [options.locale="en-ZA"] - Locale identifier.
 * @param {string} [options.fallback="—"] - Value returned when the date is invalid.
 * @returns {string} The formatted date string.
 */
export function formatDate(date, options = {}) {
  const { locale = "en-ZA", fallback = "—" } = options;
  const d = new Date(date);

  if (isNaN(d.getTime())) return fallback;

  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

/**
 * Truncates text to a maximum length, appending an ellipsis when truncated.
 *
 * @param {string} text - The text to truncate.
 * @param {number} [maxLength=100] - Maximum length of the output (excluding ellipsis).
 * @param {string} [ellipsis="…"] - The ellipsis string.
 * @returns {string} The truncated text.
 */
export function truncateText(text, maxLength = 100, ellipsis = "…") {
  if (!text) return "";
  const str = String(text);
  if (str.length <= maxLength) return str;
  return str.slice(0, Math.max(0, maxLength)).trim() + ellipsis;
}

/**
 * Converts a string into a URL-safe slug.
 * `My Cool Business!` → `my-cool-business`.
 *
 * @param {string} text - The text to slugify.
 * @returns {string} The slugified string.
 */
export function slugify(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default {
  formatPhone,
  formatCurrency,
  formatDate,
  truncateText,
  slugify,
};
