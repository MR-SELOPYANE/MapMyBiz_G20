/**
 * @file ModuleCard component.
 * @description Displays a learning module with title, description, progress
 * indicator, and a completed/not-completed badge. Built with vanilla DOM
 * createElement — no framework dependencies.
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
 * CSS rules for the module card component.
 * Uses a `cmp-` prefix on root and child selectors to avoid clashing
 * with the existing `.module-card` rules in CSS/style.css and CSS/lg.css.
 *
 * @type {string}
 */
const MODULE_CARD_STYLES = `
  .cmp-module-card {
    background: #ffffff;
    border: 2px solid #B8D8D8;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.3s ease;
    max-width: 320px;
  }
  .cmp-module-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    border-color: #0A8791;
  }
  .cmp-module-card--completed {
    border-color: #16a34a;
  }
  .cmp-module-card--completed .cmp-module-card__badge {
    background: #16a34a;
    color: #fff;
  }
  .cmp-module-card--not-completed {
    border-color: #f59e0b;
  }
  .cmp-module-card--not-completed .cmp-module-card__badge {
    background: #f59e0b;
    color: #fff;
  }
  .cmp-module-card__img {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 8px;
  }
  .cmp-module-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .cmp-module-card__title {
    font-size: 1.15rem;
    font-weight: 700;
    color: #1a3b5d;
    margin: 0;
  }
  .cmp-module-card__description {
    font-size: 0.875rem;
    color: #555;
    line-height: 1.5;
    margin: 0;
  }
  .cmp-module-card__progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #555;
    margin: 0;
  }
  .cmp-module-card__progress-track {
    width: 100%;
    height: 8px;
    background-color: #e0e7ed;
    border-radius: 6px;
    overflow: hidden;
  }
  .cmp-module-card__progress-fill {
    height: 100%;
    background-color: #2ec4b6;
    border-radius: 6px;
    width: 0%;
    transition: width 0.4s ease;
  }
  .cmp-module-card__badge {
    align-self: flex-start;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 999px;
  }
`;

/**
 * Injects module card styles (idempotent).
 *
 * @returns {void}
 */
function ensureModuleCardStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cmp-module-card-styles")) return;
  const style = document.createElement("style");
  style.id = "cmp-module-card-styles";
  style.textContent = MODULE_CARD_STYLES;
  document.head.appendChild(style);
}

/**
 * Module data with progress options.
 *
 * @typedef {Object} ModuleCardModule
 * @property {string} [title] - Module title.
 * @property {string} [description=""] - Module description.
 * @property {string} [id] - Module ID (e.g. "Module 1").
 * @property {string} [path] - Route path for navigation.
 */

/**
 * Options for {@link ModuleCard}.
 *
 * @typedef {Object} ModuleCardOptions
 * @property {boolean} [completed=false] - Whether the module is completed.
 * @property {number} [progress=0] - Progress percentage (0–100).
 * @property {string} [imageUrl=""] - Optional module image URL.
 */

/**
 * Creates a ModuleCard DOM element.
 *
 * @param {ModuleCardModule} [module={}] - The learning module data.
 * @param {ModuleCardOptions} [opts={}] - Additional display options.
 * @returns {HTMLElement} The module card element.
 *
 * @example
 * const card = ModuleCard(
 *   { title: "Introduction to Business", id: "Module 1" },
 *   { completed: true, progress: 100 },
 * );
 * container.appendChild(card);
 */
export function ModuleCard(module = {}, opts = {}) {
  ensureModuleCardStyles();

  const { title = "Untitled Module", description = "", id: moduleId = "", path = "" } = module;
  const { completed = false, progress = 0, imageUrl = "" } = opts;

  const card = document.createElement("div");
  card.className = `cmp-module-card cmp-module-card--${completed ? "completed" : "not-completed"}`;

  if (moduleId) {
    card.dataset.moduleId = escapeHtml(moduleId);
  }
  if (path) {
    card.dataset.path = escapeHtml(path);
  }

  const header = document.createElement("div");
  header.className = "cmp-module-card__header";

  const headerLeft = document.createElement("div");
  headerLeft.style.display = "flex";
  headerLeft.style.flexDirection = "column";
  headerLeft.style.gap = "4px";

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = `${title} icon`;
    img.className = "cmp-module-card__img";
    headerLeft.appendChild(img);
  }

  const titleEl = document.createElement("h3");
  titleEl.className = "cmp-module-card__title";
  titleEl.textContent = title;
  headerLeft.appendChild(titleEl);

  const badge = document.createElement("span");
  badge.className = "cmp-module-card__badge";
  badge.textContent = completed ? "Completed" : "Not Completed";
  header.appendChild(headerLeft);
  header.appendChild(badge);

  card.appendChild(header);

  // --- Description ---
  if (description) {
    const descEl = document.createElement("p");
    descEl.className = "cmp-module-card__description";
    descEl.textContent = description;
    card.appendChild(descEl);
  }

  // --- Progress indicator ---
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const progressLabel = document.createElement("p");
  progressLabel.className = "cmp-module-card__progress-label";
  progressLabel.textContent = `Progress: ${Math.round(clampedProgress)}%`;
  card.appendChild(progressLabel);

  const progressTrack = document.createElement("div");
  progressTrack.className = "cmp-module-card__progress-track";

  const progressFill = document.createElement("div");
  progressFill.className = "cmp-module-card__progress-fill";
  progressFill.style.width = `${clampedProgress}%`;
  progressTrack.appendChild(progressFill);
  card.appendChild(progressTrack);

  return card;
}

export default ModuleCard;
