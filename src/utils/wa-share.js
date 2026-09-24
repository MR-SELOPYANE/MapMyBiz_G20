/**
 * @file WhatsApp share helpers.
 * @description Builds `https://wa.me/` share links with optional text and
 * image URLs. Zero API cost, works on basic phones via the WhatsApp app or
 * web client.
 */

/**
 * Strips every non-digit character from a phone/WhatsApp number.
 *
 * @param {string|null|undefined} value - Raw phone number.
 * @returns {string} Digits-only string, or empty string.
 */
export function sanitizePhone(value) {
  if (!value) return "";
  return String(value).replace(/[^\d]/g, "");
}

/**
 * Encodes text for use in a query string.
 *
 * @param {string} text - Raw text.
 * @returns {string} URL-encoded text.
 */
export function encodeText(text) {
  return encodeURIComponent(text || "");
}

/**
 * Builds a WhatsApp chat link for a direct chat with a number.
 *
 * @param {string} digits - Digits-only phone number (with country code).
 * @param {string} [text] - Optional pre-filled message.
 * @returns {string} The full `https://wa.me/...` URL.
 */
export function waChatLink(digits, text) {
  const phone = sanitizePhone(digits);
  if (!phone) return "";
  const base = `https://wa.me/${phone}`;
  if (text) {
    return `${base}?text=${encodeText(text)}`;
  }
  return base;
}

/**
 * Builds a WhatsApp share link that lets a user forward content to their
 * contacts. No phone number is required — WhatsApp opens the share sheet.
 *
 * @param {string} text - The message to share.
 * @param {string} [imageUrl] - Optional image URL to attach.
 * @returns {string} The full `https://wa.me/?text=...` URL.
 */
export function waShareLink(text, imageUrl) {
  const params = new URLSearchParams();
  if (text) params.set("text", text);
  if (imageUrl) params.set("image", imageUrl);
  const query = params.toString();
  return query ? `https://wa.me/?${query}` : "https://wa.me/";
}

/**
 * Opens a WhatsApp share link in a new tab.
 *
 * @param {string} text - The message to share.
 * @param {string} [imageUrl] - Optional image URL to attach.
 * @returns {void}
 */
export function shareOnWhatsApp(text, imageUrl) {
  const url = waShareLink(text, imageUrl);
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Builds a share message for a business listing.
 *
 * @param {Object} business - The business to share.
 * @returns {string}
 */
export function businessShareMessage(business = {}) {
  const name = business.name || business.business_name || "a local business";
  const location = business.location ? ` in ${business.location}` : "";
  return `Check out ${name}${location} on Map My Biz — a great local business you can support.`;
}

/**
 * Builds a share message for a course card.
 *
 * @param {Object} course - The course to share.
 * @returns {string}
 */
export function courseShareMessage(course = {}) {
  const title = course.title || "a new course";
  return `I'm learning "${title}" on Map My Biz — great for rural entrepreneurs. You should try it too.`;
}

/**
 * Builds a share message for a job posting.
 *
 * @param {Object} job - The job to share.
 * @returns {string}
 */
export function jobShareMessage(job = {}) {
  const title = job.title || "a new opportunity";
  const company = job.company ? ` at ${job.company}` : "";
  return `New opportunity: "${title}"${company} on Map My Biz — worth applying or sharing with someone who needs it.`;
}