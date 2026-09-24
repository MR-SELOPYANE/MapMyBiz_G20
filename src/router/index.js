/**
 * @file Hash-based client-side router.
 * @description A lightweight router that maps hash paths to view names and
 * dispatches change events when the route changes.
 */

/**
 * Route definitions mapping hash paths to view names.
 * Dynamic segments use the `:param` convention.
 *
 * @type {Array<{ path: string, view: string }>}
 */
export const routes = [
  { path: "/", view: "home" },
  { path: "/dashboard", view: "dashboard" },
  { path: "/map", view: "map" },
  { path: "/business", view: "business" },
  { path: "/courses", view: "courses" },
  { path: "/jobs", view: "jobs" },
  { path: "/login", view: "login" },
  { path: "/signup", view: "signup" },
  { path: "/profile", view: "profile" },
  { path: "/module/:id", view: "module" },
  { path: "/add-business", view: "add-business" },
  { path: "/my-business", view: "my-business" },
  { path: "/tourism", view: "tourism" },
  { path: "/vr", view: "vr" },
  { path: "/update-info", view: "update-info" },
  { path: "/forgot", view: "forgot" },
  { path: "/reset", view: "reset" },
];

/**
 * Converts a route path pattern (e.g. `/module/:id`) into a regular
 * expression and extracts named parameters.
 *
 * @param {string} pattern - The route path pattern.
 * @returns {{ regex: RegExp, keys: string[] }}
 */
function compileRoute(pattern) {
  const keys = [];
  const regexStr =
    "^" +
    pattern
      .replace(/\/+/g, "/")
      .replace(/\/?:\w+/g, (match) => {
        const key = match.slice(1).replace(":", "");
        keys.push(key);
        return "([^/]+)";
      })
      .replace(/\/$/g, "") +
    "$";
  return { regex: new RegExp(regexStr), keys };
}

/** Resolves the current hash into a view name and route params.
 *
 * @returns {{ view: string|null, params: Object, path: string }}
 */
export function getCurrentRoute() {
  const hash = window.location.hash || "#/";
  const path = hash.replace(/^#/, "") || "/";
  const normalized = path.startsWith("/") ? path : "/" + path;

  for (const route of routes) {
    const { regex, keys } = compileRoute(route.path);
    const match = normalized.match(regex);
    if (match) {
      const params = {};
      keys.forEach((key, index) => {
        params[key] = decodeURIComponent(match[index + 1]);
      });
      return { view: route.view, params, path: normalized };
    }
  }

  return { view: null, params: {}, path: normalized };
}

/**
 * Navigates to the given path by updating the URL hash.
 *
 * @param {string} path - The hash path to navigate to (with or without `/` prefix).
 * @returns {void}
 */
export function navigate(path) {
  const normalized = path.startsWith("/") ? path : "/" + path;
  window.location.hash = normalized;
}

/**
 * Resolves a route path by substituting dynamic params with concrete values.
 *
 * @param {string} viewKey - The route path pattern (e.g. `/module/:id`).
 * @param {Object} [params] - Param values to substitute.
 * @returns {string} The resolved hash path.
 */
export function resolveRoute(viewKey, params = {}) {
  let resolved = viewKey;
  for (const [key, value] of Object.entries(params)) {
    resolved = resolved.replace(`:${key}`, encodeURIComponent(value));
  }
  return resolved;
}

/**
 * Sets up the hashchange event listener and performs an initial render.
 *
 * @param {Function} [onRouteChange] - Optional callback invoked on every
 *   route change, receiving `{ view, params, path }`.
 * @returns {void}
 */
export function init(onRouteChange) {
  const listener = () => {
    const route = getCurrentRoute();
    if (typeof onRouteChange === "function") {
      onRouteChange(route);
    }
    window.dispatchEvent(
      new CustomEvent("route-change", { detail: route })
    );
  };

  window.addEventListener("hashchange", listener);
  listener();
}

/**
 * Removes the hashchange listener added by {@link init}.
 *
 * @returns {void}
 */
export function destroy() {
  window.removeEventListener("hashchange", getCurrentRoute);
}

export default { routes, init, navigate, getCurrentRoute, resolveRoute, destroy };
