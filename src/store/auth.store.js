/**
 * @file Auth state store.
 * @description A minimal EventTarget-based store that tracks the current
 * authenticated user, emits `change` events on state transitions, and
 * persists the user to `localStorage`.
 */

/** @type {EventTarget} */
const store = new EventTarget();

/** Storage key for the persisted auth state. */
const STORAGE_KEY = "map_my_bizz_auth";

/** @type {Object|null} */
let currentUser = null;

/**
 * Loads the persisted user from localStorage, if present.
 *
 * @returns {Object|null}
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Writes the current user to localStorage.
 *
 * @param {Object|null} user - The user object to persist.
 * @returns {void}
 */
function saveToStorage(user) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (_) {
    /* ignore storage errors */
  }
}

/** Lazily hydrates the in-memory user from storage on first access. */
currentUser = loadFromStorage();

/**
 * Gets the currently authenticated user (or `null`).
 *
 * @returns {Object|null}
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Sets the current user and emits a `change` event.
 *
 * @param {Object|null} user - The user object to set.
 * @returns {void}
 */
export function setUser(user) {
  currentUser = user;
  saveToStorage(user);
  store.dispatchEvent(new Event("change"));
}

/**
 * Clears the authenticated user and emits a `change` event.
 *
 * @returns {void}
 */
export function clearUser() {
  currentUser = null;
  saveToStorage(null);
  store.dispatchEvent(new Event("change"));
}

/**
 * Returns whether a user is currently authenticated.
 *
 * @returns {boolean}
 */
export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Subscribes to auth state changes.
 *
 * @param {Function} listener - Callback invoked on every state change.
 * @returns {Function} An unsubscribe function.
 */
export function subscribe(listener) {
  store.addEventListener("change", listener);
  return () => store.removeEventListener("change", listener);
}

/**
 * One-shot event emitter for external use.
 *
 * @type {EventTarget}
 */
export { store as authStore };
