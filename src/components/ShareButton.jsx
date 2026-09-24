/**
 * @file ShareButton component.
 * @description A WhatsApp share button that opens the WhatsApp share sheet
 * with a pre-filled message. Zero API cost, works on basic phones.
 */

const SHARE_STYLES = `
  .mmp-share-btn {
    background: #25D366;
    color: #fff;
    border: none;
    border-radius: 25px;
    padding: 8px 16px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    text-decoration: none;
  }
  .mmp-share-btn:hover {
    background: #128c7e;
    transform: translateY(-1px);
  }
  .mmp-share-btn:focus-visible {
    outline: 2px solid #0A8791;
    outline-offset: 2px;
  }
`;

let stylesInjected = false;

function ensureStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.id = "mmp-share-styles";
  style.textContent = SHARE_STYLES;
  document.head.appendChild(style);
}

/**
 * Creates a WhatsApp share button.
 *
 * @param {Object} options
 * @param {string} options.message - The pre-filled share message.
 * @param {string} [options.imageUrl] - Optional image URL.
 * @param {string} [options.label] - Visible label text.
 * @param {string} [options.ariaLabel] - Accessible label.
 * @returns {HTMLElement} The share button element.
 */
export function ShareButton({ message, imageUrl, label = "Share", ariaLabel = "Share on WhatsApp" } = {}) {
  ensureStyles();

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "mmp-share-btn";
  btn.setAttribute("aria-label", ariaLabel);
  btn.title = ariaLabel;

  const icon = document.createElement("span");
  icon.textContent = "📤";

  const text = document.createElement("span");
  text.textContent = label;

  btn.appendChild(icon);
  btn.appendChild(text);

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const params = new URLSearchParams();
    if (message) params.set("text", message);
    if (imageUrl) params.set("image", imageUrl);
    const query = params.toString();
    const url = query ? `https://wa.me/?${query}` : "https://wa.me/";
    window.open(url, "_blank", "noopener,noreferrer");
  });

  return btn;
}

export default ShareButton;