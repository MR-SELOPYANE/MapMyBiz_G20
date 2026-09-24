/**
 * @file LoadingSpinner component.
 * @description A lightweight, reusable loading spinner built with vanilla
 * DOM createElement — no framework dependencies. Injects its own styles
 * so it works in any context.
 */

/**
 * CSS rules for the spinner component.
 * Uses a unique prefix to avoid clashing with existing project styles.
 *
 * @type {string}
 */
const SPINNER_STYLES = `
  .mmp-spinner {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: inherit;
  }
  .mmp-spinner .spinner-track {
    width: 2rem;
    height: 2rem;
    border: 3px solid rgba(46, 196, 182, 0.15);
    border-top-color: #2ec4b6;
    border-right-color: #2ec4b6;
    border-radius: 50%;
    animation: mmp-spinner-rotate 0.8s linear infinite;
  }
  .mmp-spinner .spinner-track--sm {
    width: 1rem;
    height: 1rem;
    border-width: 2px;
  }
  .mmp-spinner .spinner-track--lg {
    width: 3rem;
    height: 3rem;
  }
  .mmp-spinner .spinner-label {
    font-size: 0.875rem;
    color: #64748b;
  }
  @keyframes mmp-spinner-rotate {
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * Injects spinner styles into document head (idempotent).
 *
 * @returns {void}
 */
function ensureSpinnerStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("mmp-spinner-styles")) return;
  const style = document.createElement("style");
  style.id = "mmp-spinner-styles";
  style.textContent = SPINNER_STYLES;
  document.head.appendChild(style);
}

/**
 * Options accepted by {@link LoadingSpinner}.
 *
 * @typedef {Object} LoadingSpinnerOptions
 * @property {"small"|"medium"|"large"} [size="medium"] - Visual size of the spinner.
 * @property {string} [label="Loading..."] - Accessible label shown beneath the spinner.
 * @property {string} [className=""] - Additional CSS classes to append.
 * @property {string} [color="#2ec4b6"] - Track accent colour (teal by default).
 */

/**
 * Creates a LoadingSpinner DOM element.
 *
 * @param {LoadingSpinnerOptions} [opts={}] - Spinner options.
 * @returns {HTMLElement} A div containing the animated spinner track and label.
 *
 * @example
 * const spinner = LoadingSpinner({ label: "Fetching data…", size: "large" });
 * document.body.appendChild(spinner);
 */
export function LoadingSpinner(opts = {}) {
  const { size = "medium", label = "Loading...", className = "", color = "#2ec4b6" } = opts;
  ensureSpinnerStyles();

  const el = document.createElement("div");
  el.className = `mmp-spinner ${className}`.trim();
  el.setAttribute("role", "status");
  el.setAttribute("aria-label", label || "Loading");

  const track = document.createElement("div");
  if (size === "small") {
    track.className = "spinner-track spinner-track--sm";
  } else if (size === "large") {
    track.className = "spinner-track spinner-track--lg";
  } else {
    track.className = "spinner-track";
  }
  track.style.borderTopColor = color;
  track.style.borderRightColor = color;

  const text = document.createElement("span");
  text.className = "spinner-label";
  text.textContent = label;

  el.appendChild(track);
  el.appendChild(text);

  return el;
}

export default LoadingSpinner;
