/**
 * @file BookmarkButton component.
 * @description A heart/bookmark toggle that saves an item to the offline
 * bookmark store (localStorage). Renders as a filled heart when saved and an
 * outline heart when not. Works 100% offline.
 */

import { isSaved, toggleSaved } from "../services/saved.service.js";
import { SAVED_TYPES } from "../services/saved.service.js";

const BOOKMARK_STYLES = `
  .mmp-bookmark-btn {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #B8D8D8;
    border-radius: 50%;
    width: 38px;
    height: 38px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0,0,0,0.12);
    flex-shrink: 0;
  }
  .mmp-bookmark-btn:hover {
    transform: scale(1.1);
    border-color: #0A8791;
  }
  .mmp-bookmark-btn.saved {
    background: #e11d48;
    border-color: #e11d48;
    color: #fff;
  }
  .mmp-bookmark-btn:focus-visible {
    outline: 2px solid #0A8791;
    outline-offset: 2px;
  }
`;

let stylesInjected = false;

function ensureStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.id = "mmp-bookmark-styles";
  style.textContent = BOOKMARK_STYLES;
  document.head.appendChild(style);
}

/**
 * Creates a bookmark toggle button for an item.
 *
 * @param {Object} options
 * @param {string} options.type - One of SAVED_TYPES values.
 * @param {Object} options.item - The item to bookmark (must have `id`).
 * @param {string} [options.label] - Optional accessible label.
 * @param {boolean} [options.compact] - When true, hides the visible label.
 * @returns {HTMLElement} The bookmark button element.
 */
export function BookmarkButton({ type, item, label = "Save for later", compact = false } = {}) {
  ensureStyles();

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mmp-bookmark-btn";
  btn.setAttribute("aria-label", label);
  btn.setAttribute("aria-pressed", isSaved(type, item?.id) ? "true" : "false");
  btn.title = label;

  const icon = document.createElement("span");
  icon.textContent = isSaved(type, item?.id) ? "❤️" : "🤍";
  btn.appendChild(icon);

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const result = toggleSaved(type, item);
    const nowSaved = result.saved;
    icon.textContent = nowSaved ? "❤️" : "🤍";
    btn.classList.toggle("saved", nowSaved);
    btn.setAttribute("aria-pressed", nowSaved ? "true" : "false");
    btn.setAttribute("title", nowSaved ? "Saved — click to remove" : "Save for later");
  });

  return btn;
}

export default BookmarkButton;