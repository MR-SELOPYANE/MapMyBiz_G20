/**
 * @file Saved content service.
 * @description Manages offline bookmarks for courses, jobs, and businesses.
 * Stored in `localStorage` under the `mmb_saved` key. Works 100% offline and
 * requires no server, so it is safe to use on basic phones with no data.
 */

/** Storage key used for the offline bookmark store. */
const SAVED_KEY = "mmb_saved";

/** Valid bookmark types. */
export const SAVED_TYPES = {
  COURSE: "course",
  JOB: "job",
  BUSINESS: "business",
};

/**
 * Reads the full bookmark store from localStorage.
 *
 * @returns {Object} A map of `type:id` -> bookmark record.
 */
function readStore() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

/**
 * Persists the bookmark store to localStorage.
 *
 * @param {Object} store - The store object to write.
 * @returns {void}
 */
function writeStore(store) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(store));
  } catch (_) {
    /* ignore storage errors */
  }
}

/**
 * Builds the composite key used for a bookmark.
 *
 * @param {string} type - One of SAVED_TYPES values.
 * @param {string|number} id - The item identifier.
 * @returns {string} Composite key like `course:1`.
 */
function makeKey(type, id) {
  return `${type}:${String(id)}`;
}

/**
 * Returns whether an item is currently bookmarked.
 *
 * @param {string} type - One of SAVED_TYPES values.
 * @param {string|number} id - The item identifier.
 * @returns {boolean}
 */
export function isSaved(type, id) {
  if (!type || id == null) return false;
  return makeKey(type, id) in readStore();
}

/**
 * Adds a bookmark for an item.
 *
 * @param {string} type - One of SAVED_TYPES values.
 * @param {Object} item - The item to bookmark.
 * @param {string|number} [item.id] - The item identifier.
 * @returns {{ saved: boolean, error: Error|null }}
 */
export function addSaved(type, item = {}) {
  if (!type || item?.id == null) {
    return { saved: false, error: new Error("Type and item id are required.") };
  }

  const store = readStore();
  const key = makeKey(type, item.id);
  store[key] = {
    type,
    id: String(item.id),
    title: item.title || item.name || item.company || "Untitled",
    savedAt: new Date().toISOString(),
  };
  writeStore(store);
  return { saved: true, error: null };
}

/**
 * Removes a bookmark for an item.
 *
 * @param {string} type - One of SAVED_TYPES values.
 * @param {string|number} id - The item identifier.
 * @returns {{ removed: boolean, error: Error|null }}
 */
export function removeSaved(type, id) {
  if (!type || id == null) {
    return { removed: false, error: new Error("Type and id are required.") };
  }

  const store = readStore();
  const key = makeKey(type, id);
  if (!(key in store)) {
    return { removed: false, error: null };
  }
  delete store[key];
  writeStore(store);
  return { removed: true, error: null };
}

/**
 * Toggles a bookmark. Returns the new saved state.
 *
 * @param {string} type - One of SAVED_TYPES values.
 * @param {Object} item - The item to toggle.
 * @returns {{ saved: boolean, error: Error|null }}
 */
export function toggleSaved(type, item = {}) {
  if (isSaved(type, item?.id)) {
    removeSaved(type, item.id);
    return { saved: false, error: null };
  }
  return addSaved(type, item);
}

/**
 * Lists all bookmarks, optionally filtered by type.
 *
 * @param {string} [type] - Optional type filter.
 * @returns {Object[]} Array of bookmark records.
 */
export function listSaved(type) {
  const store = readStore();
  const records = Object.values(store);
  if (type) {
    return records.filter((r) => r.type === type);
  }
  return records;
}

/**
 * Returns the count of saved items of a given type.
 *
 * @param {string} type - One of SAVED_TYPES values.
 * @returns {number}
 */
export function countSaved(type) {
  return listSaved(type).length;
}