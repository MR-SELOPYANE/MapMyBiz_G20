// @vitest-environment node
/**
 * @file Tourism view render smoke test.
 * @description Renders TourismView against a minimal DOM stub and asserts the
 * page builds every section without throwing. The repo's jsdom environment is
 * not installed, so the stub stands in for the pieces the view touches.
 */

import { describe, it, expect, beforeAll } from "vitest";

function makeElement(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    className: "",
    id: "",
    textContent: "",
    value: "",
    src: "",
    href: "",
    alt: "",
    type: "",
    placeholder: "",
    children: [],
    style: {},
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains: () => false,
    },
    appendChild(child) {
      el.children.push(child);
      return child;
    },
    insertBefore(child) {
      el.children.push(child);
      return child;
    },
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    focus() {},
    get offsetHeight() {
      return 1;
    },
  };
  Object.defineProperty(el, "innerHTML", {
    get: () => "",
    set: () => {
      el.children = [];
    },
  });
  return el;
}

beforeAll(() => {
  globalThis.document = {
    createElement: makeElement,
    createTextNode: (text) => ({ nodeType: 3, textContent: String(text) }),
    createComment: (text) => ({ nodeType: 8, textContent: text }),
    getElementById: () => null,
    querySelector: () => null,
    head: makeElement("head"),
    body: makeElement("body"),
  };
  globalThis.localStorage = {
    store: {},
    getItem(key) {
      return key in this.store ? this.store[key] : null;
    },
    setItem(key, value) {
      this.store[key] = String(value);
    },
    removeItem(key) {
      delete this.store[key];
    },
  };
  globalThis.window = {
    location: { hash: "#/tourism" },
    open: () => {},
    alert: () => {},
    prompt: () => "",
    scrollTo: () => {},
    addEventListener: () => {},
  };
});

describe("TourismView smoke test", () => {
  it("renders every section", async () => {
    const { TourismView } = await import("./TourismView.jsx");
    const view = TourismView({ query: {} });
    expect(view.className).toBe("mmp-tourism");
    // hero, value, listings, marker, itineraries, safety, host, digest
    expect(view.children.length).toBeGreaterThanOrEqual(8);
  });
});
