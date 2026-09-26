/**
 * @file TourismCard component.
 * @description Renders a bookable rural experience: photo, verified badge,
 * rating, review snippet, price, duration, group size, what is included,
 * safety and logistics notes, plus save, share, WhatsApp and booking actions.
 * Built with vanilla DOM createElement — no framework dependencies.
 */

import { BookmarkButton } from "./BookmarkButton.jsx";
import { ShareButton } from "./ShareButton.jsx";
import { SAVED_TYPES } from "../services/saved.service.js";
import { waChatLink, tourismShareMessage, bookingRequestMessage } from "../utils/wa-share.js";
import { formatZar, formatDuration, TOURISM_ACTIVITIES } from "../data/tourism.js";

/** Truncates text and appends an ellipsis when it overflows.
 *
 * @param {string} text - Text to shorten.
 * @param {number} [maxLength] - Maximum character count.
 * @returns {string}
 */
function truncate(text, maxLength = 140) {
  if (!text) return "";
  const str = String(text);
  return str.length <= maxLength ? str : `${str.slice(0, maxLength).trim()}…`;
}

/**
 * Returns the emoji and label for an experience activity.
 *
 * @param {string} activity - Activity value.
 * @returns {{ emoji: string, label: string }}
 */
function activityMeta(activity) {
  const match = TOURISM_ACTIVITIES.find((item) => item.value === activity);
  return match || { emoji: "📍", label: activity || "Experience" };
}

/**
 * Renders a filled/unfilled star row for a rating.
 *
 * @param {number} rating - Rating out of 5.
 * @returns {HTMLElement} The rating element.
 */
function ratingRow(rating, reviewsCount) {
  const wrap = document.createElement("div");
  wrap.className = "mmp-tourism-card__rating";

  const rounded = Math.round(Number(rating) || 0);
  const stars = document.createElement("span");
  stars.className = "mmp-tourism-stars";
  stars.setAttribute("aria-label", `Rated ${Number(rating || 0).toFixed(1)} out of 5`);
  stars.textContent = "★★★★★".slice(0, rounded) + "☆☆☆☆☆".slice(0, 5 - rounded);
  wrap.appendChild(stars);

  const value = document.createElement("strong");
  value.textContent = (Number(rating) || 0).toFixed(1);
  wrap.appendChild(value);

  if (reviewsCount) {
    const count = document.createElement("span");
    count.className = "mmp-tourism-card__review-count";
    count.textContent = `(${reviewsCount} reviews)`;
    wrap.appendChild(count);
  }

  return wrap;
}

/**
 * Creates a detail row with an icon, label and value.
 *
 * @param {string} emoji - Leading emoji.
 * @param {string} label - Detail label.
 * @param {string} value - Detail value.
 * @returns {HTMLElement} The detail row.
 */
function detailRow(emoji, label, value) {
  if (!value) return null;
  const row = document.createElement("div");
  row.className = "mmp-tourism-card__detail";

  const icon = document.createElement("span");
  icon.className = "mmp-tourism-card__detail-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = emoji;

  const text = document.createElement("span");
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  text.appendChild(strong);
  text.appendChild(document.createTextNode(value));

  row.appendChild(icon);
  row.appendChild(text);
  return row;
}

/**
 * Creates a tourism experience card.
 *
 * @param {Object} experience - Normalised experience from `src/data/tourism.js`.
 * @returns {HTMLElement} The card element.
 */
export function TourismCard(experience = {}) {
  const {
    id,
    name = "Rural experience",
    host = "",
    province = "",
    town = "",
    activity = "",
    price = 0,
    priceUnit = "per person",
    durationHours = 0,
    groupSizeMax = 0,
    rating = 0,
    reviewsCount = 0,
    reviewSnippet = "",
    reviewAuthor = "",
    verified = false,
    image = "",
    included = [],
    availability = "",
    transport = "",
    cellCoverage = "",
    safety = "",
    whatsapp = "",
    phone = "",
  } = experience;

  const meta = activityMeta(activity);
  const digits = String(whatsapp || phone || "").replace(/[^\d]/g, "");

  const card = document.createElement("article");
  card.className = "mmp-tourism-card";

  // --- Photo with price overlay and save control ---
  const media = document.createElement("div");
  media.className = "mmp-tourism-card__media";

  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.alt = name;
    img.loading = "lazy";
    media.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "mmp-tourism-card__media-placeholder";
    placeholder.textContent = meta.emoji;
    media.appendChild(placeholder);
  }

  const priceTag = document.createElement("span");
  priceTag.className = "mmp-tourism-card__price";
  priceTag.textContent = formatZar(price);
  media.appendChild(priceTag);

  const saveWrap = document.createElement("div");
  saveWrap.className = "mmp-tourism-card__save";
  saveWrap.appendChild(
    BookmarkButton({
      type: SAVED_TYPES.EXPERIENCE,
      item: { id, name },
      label: "Save this experience to your trip",
      compact: true,
    }),
  );
  media.appendChild(saveWrap);

  card.appendChild(media);

  // --- Body ---
  const body = document.createElement("div");
  body.className = "mmp-tourism-card__body";

  const heading = document.createElement("h3");
  heading.className = "mmp-tourism-card__name";
  heading.textContent = name;
  body.appendChild(heading);

  const byline = document.createElement("p");
  byline.className = "mmp-tourism-card__host";
  byline.textContent = host ? `Hosted by ${host}` : "Hosted by a local host";
  body.appendChild(byline);

  const tags = document.createElement("div");
  tags.className = "mmp-tourism-card__tags";
  const activityTag = document.createElement("span");
  activityTag.className = "mmp-tourism-card__tag";
  activityTag.textContent = `${meta.emoji} ${meta.label}`;
  tags.appendChild(activityTag);

  if (province) {
    const provinceTag = document.createElement("span");
    provinceTag.className = "mmp-tourism-card__tag";
    provinceTag.textContent = `📍 ${town ? `${town}, ` : ""}${province}`;
    tags.appendChild(provinceTag);
  }

  if (verified) {
    const verifiedTag = document.createElement("span");
    verifiedTag.className = "mmp-tourism-card__tag mmp-tourism-card__tag--verified";
    verifiedTag.title = "Host ID and business registration confirmed";
    verifiedTag.textContent = "✔ Verified host";
    tags.appendChild(verifiedTag);
  }

  body.appendChild(tags);

  if (Number(rating) > 0) body.appendChild(ratingRow(rating, reviewsCount));

  const facts = document.createElement("div");
  facts.className = "mmp-tourism-card__facts";
  [
    ["⏱️", "Duration", formatDuration(durationHours)],
    ["👥", "Group size", groupSizeMax ? `Up to ${groupSizeMax}` : "Ask the host"],
    ["💵", "Price", price ? `${formatZar(price)} ${priceUnit}` : "Ask the host"],
    ["🗓️", "Availability", availability],
    ["🚌", "Getting there", transport],
    ["📶", "Cell coverage", cellCoverage],
    ["🛡️", "Safety", safety],
  ].forEach(([emoji, label, value]) => {
    const row = detailRow(emoji, label, value);
    if (row) facts.appendChild(row);
  });
  body.appendChild(facts);

  if (included.length) {
    const includedList = document.createElement("ul");
    includedList.className = "mmp-tourism-card__included";
    const includedHeading = document.createElement("li");
    includedHeading.className = "mmp-tourism-card__included-heading";
    includedHeading.textContent = "What's included";
    includedList.appendChild(includedHeading);
    included.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      includedList.appendChild(li);
    });
    body.appendChild(includedList);
  }

  if (reviewSnippet) {
    const review = document.createElement("figure");
    review.className = "mmp-tourism-card__review";
    const quote = document.createElement("blockquote");
    quote.textContent = `“${truncate(reviewSnippet, 160)}”`;
    const caption = document.createElement("figcaption");
    caption.textContent = reviewAuthor || "Verified traveller";
    review.appendChild(quote);
    review.appendChild(caption);
    body.appendChild(review);
  }

  // --- Actions ---
  const actions = document.createElement("div");
  actions.className = "mmp-tourism-card__actions";

  const bookBtn = document.createElement("button");
  bookBtn.type = "button";
  bookBtn.className = "mmp-tourism-btn mmp-tourism-btn--primary";
  bookBtn.textContent = "Book now";
  bookBtn.addEventListener("click", () => {
    const date = window.prompt(
      `Which date would you like to book "${name}" for? (e.g. 14 December 2026)`,
      "",
    );
    if (date === null) return;
    const guests = window.prompt("How many guests?", "2");
    if (guests === null) return;
    const message = bookingRequestMessage(experience, {
      date: date.trim(),
      guests: guests.trim(),
    });
    if (digits) {
      window.open(waChatLink(digits, message), "_blank", "noopener,noreferrer");
    } else {
      window.alert("This host has not added a WhatsApp number yet. Please try again shortly.");
    }
  });
  actions.appendChild(bookBtn);

  if (digits) {
    const waBtn = document.createElement("a");
    waBtn.className = "mmp-tourism-btn mmp-tourism-btn--whatsapp";
    waBtn.href = waChatLink(digits, `Hi ${host || "there"}, I would like to ask about "${name}".`);
    waBtn.target = "_blank";
    waBtn.rel = "noopener noreferrer";
    waBtn.textContent = "💬 WhatsApp host";
    actions.appendChild(waBtn);
  }

  actions.appendChild(
    ShareButton({
      message: tourismShareMessage(experience),
      imageUrl: image,
      label: "Share",
      ariaLabel: `Share ${name} on WhatsApp`,
    }),
  );

  body.appendChild(actions);
  card.appendChild(body);

  return card;
}

export default TourismCard;
