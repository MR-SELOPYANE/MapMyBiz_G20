/**
 * @file ToastContainer component.
 * @description Container that renders toasts from a simple queue, mirroring
 * the logic and CSS classes of JS/toast.js but structured as a reusable
 * DOM component built with createElement.
 */

/**
 * CSS rules for the toast system.
 * Replicates the key rules from CSS/toast.css so the component is
 * self-contained even when the stylesheet is not linked.
 *
 * @type {string}
 */
const TOAST_STYLES = `
  #toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .toast {
    min-width: 250px;
    max-width: 350px;
    padding: 16px 20px;
    border-radius: 8px;
    color: #fff;
    font-family: inherit;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .toast.show {
    opacity: 1;
    transform: translateX(0);
  }
  .toast.success { background-color: #28a745; }
  .toast.error { background-color: #dc3545; }
  .toast.warning { background-color: #ffc107; color: #333; }
  .toast.info { background-color: #17a2b8; }
  .toast-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 16px;
    cursor: pointer;
    margin-left: 10px;
  }
  .btn-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    vertical-align: middle;
    border: 0.2em solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border 0.75s linear infinite;
    margin-right: 8px;
  }
  @keyframes spinner-border {
    to { transform: rotate(360deg); }
  }
  .btn-loading {
    opacity: 0.7;
    pointer-events: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`;

/**
 * Injects toast styles into document head (idempotent).
 *
 * @returns {void}
 */
function ensureToastStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("mmp-toast-styles")) return;
  const style = document.createElement("style");
  style.id = "mmp-toast-styles";
  style.textContent = TOAST_STYLES;
  document.head.appendChild(style);
}

/**
 * Simple in-memory queue of active toast elements.
 *
 * @type {HTMLElement[]}
 */
const toastQueue = [];

/**
 * Creates a toast container element. When appended to the document (or
 * when {@link renderToast} auto-creates one on body), it receives all
 * rendered toasts.
 *
 * @returns {HTMLElement} A div#toast-container element.
 */
export function ToastContainer() {
  ensureToastStyles();
  const container = document.createElement("div");
  container.id = "toast-container";
  container.className = "toast-container";
  return container;
}

/**
 * Ensures a toast container exists on document.body.
 * Returns the existing container if one is already present.
 *
 * @returns {HTMLElement} The toast container element.
 */
function ensureToastContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = ToastContainer();
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Removes a toast from the DOM and the queue.
 *
 * @param {HTMLElement} toast - The toast element to dismiss.
 * @returns {void}
 */
function dismissToast(toast) {
  const idx = toastQueue.indexOf(toast);
  if (idx > -1) toastQueue.splice(idx, 1);
  toast.classList.remove("show");
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 300);
}

/**
 * Valid toast type values.
 *
 * @typedef {"success"|"error"|"warning"|"info"} ToastType
 */

/**
 * Renders a toast notification and appends it to the toast container.
 *
 * Follows the same logic and CSS classes as JS/toast.js (same classes:
 * `.toast`, `.toast-close`, type modifiers like `.toast.success`/`.toast.error`)
 * but adds a configurable duration and a simple in-memory queue.
 *
 * @param {string} message - The toast message text.
 * @param {ToastType} [type="success"] - Toast type (controls colour).
 * @param {number} [duration=4000] - Auto-dismiss delay in ms.
 *   Pass 0 to keep the toast visible until the user clicks close.
 * @returns {HTMLElement} The created toast element.
 *
 * @example
 * renderToast("Business saved!", "success");
 * renderToast("Something went wrong.", "error", 6000);
 */
export function renderToast(message, type = "success", duration = 4000) {
  const container = ensureToastContainer();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const textNode = document.createElement("span");
  textNode.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.addEventListener("click", () => dismissToast(toast));

  toast.appendChild(textNode);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  toastQueue.push(toast);

  // Trigger CSS transition (reflow)
  toast.offsetHeight;
  toast.classList.add("show");

  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }

  return toast;
}

/**
 * Returns the number of toasts currently in the queue.
 *
 * @returns {number}
 */
export function getToastCount() {
  return toastQueue.length;
}

/**
 * Toggles a loading state on a button element — same logic as
 * JS/toast.js's `setButtonLoading`.
 *
 * @param {HTMLElement} btn - The button element.
 * @param {boolean} isLoading - Whether to show the loading state.
 * @param {string} [text=""] - Optional label shown alongside the spinner.
 * @returns {void}
 */
export function setButtonLoading(btn, isLoading, text = "") {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="btn-spinner"></span>${text || "Loading..."}`;
    btn.classList.add("btn-loading");
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.classList.remove("btn-loading");
    btn.disabled = false;
  }
}

export default { ToastContainer, renderToast, setButtonLoading, getToastCount };
