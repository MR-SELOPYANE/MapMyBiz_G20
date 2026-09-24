/**
 * @file BusinessCard component.
 * @description Displays a business with name, category, description,
 * Youth-Owned badge, WhatsApp button, Donate button, and a phone link.
 * Built with vanilla DOM createElement — no framework dependencies.
 */

/**
 * Escapes HTML special characters in a string to prevent XSS.
 *
 * @param {string|null|undefined} value - Raw string value.
 * @returns {string} HTML-safe string.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Strips all non-digit characters from a phone/WhatsApp number.
 *
 * @param {string|null|undefined} value - Raw phone number.
 * @returns {string} Digits-only string, or empty string.
 */
function sanitizePhone(value) {
  if (!value) return "";
  return String(value).replace(/[^\d]/g, "");
}

/**
 * Truncates text to a maximum length, appending an ellipsis when truncated.
 *
 * @param {string} text - Text to truncate.
 * @param {number} [maxLength=120] - Maximum character count (excludes ellipsis).
 * @returns {string} Truncated text.
 */
function truncate(text, maxLength = 120) {
  if (!text) return "";
  const str = String(text);
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + "...";
}

/**
 * CSS rules for the business card component.
 *
 * @type {string}
 */
const BUSINESS_CARD_STYLES = `
  .mmp-business-card {
    background: #ffffff;
    border: 1px solid #B8D8D8;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
    text-align: left;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: transform 0.2s ease;
  }
  .mmp-business-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }
  .mmp-business-card__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }
  .mmp-business-card__name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a3b5d;
    margin: 0;
  }
  .mmp-youth-badge {
    background: #16a34a;
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
  }
  .mmp-business-card__category {
    font-size: 0.9rem;
    color: #555;
    margin: 2px 0 4px;
  }
  .mmp-business-card__description {
    font-size: 0.9rem;
    color: #555;
    line-height: 1.5;
    margin: 0;
  }
  .mmp-business-card__location {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0;
  }
  .mmp-business-card__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .mmp-business-card__actions .mmp-btn {
    background: #0A8791;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 25px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .mmp-business-card__actions .mmp-btn:hover {
    background: #09676c;
    transform: translateY(-1px);
  }
  .mmp-business-card__actions .mmp-btn--donate {
    background: #e11d48;
  }
  .mmp-business-card__actions .mmp-btn--donate:hover {
    background: #c2410c;
  }
  .mmp-business-card__phone-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #2563eb;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
  }
  .mmp-business-card__phone-link:hover {
    text-decoration: underline;
  }
`;

/**
 * Injects business card styles (idempotent).
 *
 * @returns {void}
 */
function ensureBusinessCardStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("mmp-business-card-styles")) return;
  const style = document.createElement("style");
  style.id = "mmp-business-card-styles";
  style.textContent = BUSINESS_CARD_STYLES;
  document.head.appendChild(style);
}

/**
 * Opens a WhatsApp chat in a new tab.
 *
 * @param {string} digits - Digits-only phone number.
 * @returns {void}
 */
function handleWhatsApp(digits) {
  if (!digits) return;
  window.open(`https://wa.me/${digits}`, "_blank");
}

/**
 * Prompts for a donation amount and opens a WhatsApp chat with a pre-filled
 * donation message — mirrors the logic in JS/map.js's `handleDonate`.
 *
 * @param {string} digits - Digits-only WhatsApp number.
 * @param {string} name - Business name for the prompt message.
 * @returns {void}
 */
function handleDonate(digits, name) {
  if (!digits) return;
  const amount = window.prompt(
    `Enter donation amount in ZAR to support ${name || "this business"} (e.g. 50):`,
  );
  if (amount === null) return;
  const trimmed = amount.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed) || Number(trimmed) <= 0) {
    window.alert("Please enter a valid amount (numbers only).");
    return;
  }
  const message = encodeURIComponent(
    `Hello! I'd like to donate R${trimmed} to your business. I found you on Map My Biz.`,
  );
  window.open(`https://wa.me/${digits}?text=${message}`, "_blank");
}

/**
 * Business data accepted by {@link BusinessCard}.
 *
 * @typedef {Object} BusinessData
 * @property {string} [name] - Business name (or `business_name`).
 * @property {string} [business_name] - Fallback name from raw DB rows.
 * @property {string} [category] - Business category label.
 * @property {string} [description] - Short description.
 * @property {string} [location] - Physical address.
 * @property {string} [phone] - Phone number for `tel:` link.
 * @property {string} [whatsapp] - WhatsApp number (falls back to `phone`).
 * @property {string} [email] - Email address.
 * @property {boolean} [isYouthOwned] - Youth-owned flag (normalised form).
 * @property {boolean} [is_youth_owned] - Youth-owned flag (raw DB form).
 * @property {string} [imageUrl] - Optional image URL.
 */

/**
 * Creates a BusinessCard DOM element.
 *
 * @param {BusinessData} [business={}] - The business data object.
 * @returns {HTMLElement} The business card element.
 *
 * @example
 * const card = BusinessCard({
 *   name: "Sipho's Repairs",
 *   category: "Tech Services",
 *   description: "Mobile phone and laptop repairs…",
 *   phone: "+27 61 855 7707",
 *   isYouthOwned: true,
 * });
 * document.body.appendChild(card);
 */
export function BusinessCard(business = {}) {
  ensureBusinessCardStyles();

  const {
    name,
    business_name: businessName,
    category = "Business",
    description = "",
    location = "",
    phone = "",
    whatsapp: waNumber,
    email = "",
    isYouthOwned = false,
    is_youth_owned: rawYouthOwned = false,
    imageUrl = "",
  } = business;

  const businessNameValue = name || businessName || "Unnamed Business";
  const isYouth = isYouthOwned || rawYouthOwned;
  const phoneNumber = sanitizePhone(phone);
  const whatsappDigits = sanitizePhone(waNumber || phone);

  const card = document.createElement("div");
  card.className = "mmp-business-card";

  // --- Header: name + Youth-Owned badge ---
  const header = document.createElement("div");
  header.className = "mmp-business-card__header";

  const nameEl = document.createElement("h3");
  nameEl.className = "mmp-business-card__name";
  nameEl.textContent = businessNameValue;

  if (isYouth) {
    const badge = document.createElement("span");
    badge.className = "mmp-youth-badge";
    badge.setAttribute("title", "Youth-Owned (owner under 35 years)");
    badge.textContent = "Youth-Owned";
    header.appendChild(nameEl);
    header.appendChild(badge);
  } else {
    header.appendChild(nameEl);
  }

  card.appendChild(header);

  // --- Optional image ---
  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = businessNameValue;
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";
    card.appendChild(img);
  }

  // --- Category ---
  const categoryEl = document.createElement("div");
  categoryEl.className = "mmp-business-card__category";
  categoryEl.textContent = category;
  card.appendChild(categoryEl);

  // --- Description ---
  if (description) {
    const descEl = document.createElement("p");
    descEl.className = "mmp-business-card__description";
    descEl.textContent = truncate(description, 120);
    card.appendChild(descEl);
  }

  // --- Location ---
  if (location) {
    const locEl = document.createElement("p");
    locEl.className = "mmp-business-card__location";
    locEl.textContent = `📍 ${location}`;
    card.appendChild(locEl);
  }

  // --- Actions: phone link, WhatsApp, Donate, Email ---
  const actions = document.createElement("div");
  actions.className = "mmp-business-card__actions";

  if (phoneNumber) {
    const phoneLink = document.createElement("a");
    phoneLink.href = `tel:+${phoneNumber}`;
    phoneLink.className = "mmp-business-card__phone-link";
    phoneLink.innerHTML = "📞 <span>Call</span>";
    actions.appendChild(phoneLink);
  }

  if (whatsappDigits) {
    const waBtn = document.createElement("button");
    waBtn.type = "button";
    waBtn.className = "mmp-btn";
    waBtn.innerHTML = "💬 WhatsApp";
    waBtn.onclick = () => handleWhatsApp(whatsappDigits);
    actions.appendChild(waBtn);

    const donateBtn = document.createElement("button");
    donateBtn.type = "button";
    donateBtn.className = "mmp-btn mmp-btn--donate";
    donateBtn.innerHTML = "💝 Donate";
    donateBtn.onclick = () => handleDonate(whatsappDigits, businessNameValue);
    actions.appendChild(donateBtn);
  }

  if (email) {
    const emailLink = document.createElement("a");
    emailLink.href = `mailto:${escapeHtml(email)}`;
    emailLink.className = "mmp-business-card__phone-link";
    emailLink.innerHTML = "✉️ Email";
    actions.appendChild(emailLink);
  }

  card.appendChild(actions);

  return card;
}

export default BusinessCard;
