/**
 * @file TourismFilters component.
 * @description The traveller-facing filter bar: free-text search, province,
 * activity type, duration, budget, group size and sort. Changes are pushed
 * out through a single `onChange` callback, and "Show on map" deep-links to
 * the smart map with the current filters applied.
 */

import { el } from "../utils/dom.js";
import { SA_PROVINCES } from "../utils/constants.js";
import { navigate } from "../router/index.js";
import {
  TOURISM_ACTIVITIES,
  DURATION_BUCKETS,
  TOURISM_SORTS,
  MAX_BUDGET,
  buildMapLink,
} from "../data/tourism.js";

/** Default, empty filter state. */
export const EMPTY_TOURISM_FILTERS = {
  search: "",
  province: "",
  activity: "",
  duration: "",
  maxPrice: 0,
  groupSize: 0,
  sort: "recommended",
};

/**
 * Builds a labelled select control.
 *
 * @param {string} labelText - Visible label.
 * @param {string} name - Field name in the filter state.
 * @param {Array<{value: string, label: string}>} options - Select options.
 * @param {string} current - Current value.
 * @param {Function} onChange - Change handler receiving the new value.
 * @returns {HTMLElement} The form group.
 */
function selectGroup(labelText, name, options, current, onChange) {
  const group = el("div", "mmp-tourism-filter");
  const label = document.createElement("label");
  label.setAttribute("for", `tourism-filter-${name}`);
  label.textContent = labelText;
  group.appendChild(label);

  const select = document.createElement("select");
  select.id = `tourism-filter-${name}`;
  options.forEach((option) => {
    const optionEl = document.createElement("option");
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    if (String(option.value) === String(current)) optionEl.selected = true;
    select.appendChild(optionEl);
  });
  select.addEventListener("change", () => onChange(name, select.value));
  group.appendChild(select);
  return group;
}

/**
 * Builds a labelled range slider.
 *
 * @param {string} labelText - Visible label.
 * @param {string} name - Field name in the filter state.
 * @param {number} max - Maximum value.
 * @param {number} current - Current value.
 * @param {Function} formatValue - Formats the current value for display.
 * @param {Function} onChange - Change handler receiving the numeric value.
 * @returns {HTMLElement} The form group.
 */
function rangeGroup(labelText, name, max, current, formatValue, onChange) {
  const group = el("div", "mmp-tourism-filter");

  const labelRow = document.createElement("div");
  labelRow.className = "mmp-tourism-filter__label-row";
  const label = document.createElement("label");
  label.setAttribute("for", `tourism-filter-${name}`);
  label.textContent = labelText;
  const value = document.createElement("span");
  value.className = "mmp-tourism-filter__value";
  value.textContent = formatValue(current);
  labelRow.appendChild(label);
  labelRow.appendChild(value);
  group.appendChild(labelRow);

  const input = document.createElement("input");
  input.id = `tourism-filter-${name}`;
  input.type = "range";
  input.min = "0";
  input.max = String(max);
  input.step = "50";
  input.value = String(current || 0);
  input.addEventListener("input", () => {
    value.textContent = formatValue(Number(input.value));
  });
  input.addEventListener("change", () => onChange(name, Number(input.value)));
  group.appendChild(input);

  return group;
}

/**
 * Creates the tourism filter bar.
 *
 * @param {Object} [options={}] - Component options.
 * @param {Object} [options.filters] - Current filter state.
 * @param {Function} [options.onChange] - Called with the full new filter state.
 * @param {number} [options.resultCount] - Number of matching experiences, shown as a summary.
 * @returns {HTMLElement} The filter bar element.
 */
export function TourismFilters({ filters = {}, onChange, resultCount = 0 } = {}) {
  const state = { ...EMPTY_TOURISM_FILTERS, ...filters };

  const root = el("form", "mmp-tourism-filters");
  root.setAttribute("role", "search");
  root.addEventListener("submit", (e) => e.preventDefault());

  const update = (key, value) => {
    const next = { ...state, [key]: value };
    if (typeof onChange === "function") onChange(next);
  };

  // --- Search ---
  const searchGroup = el("div", "mmp-tourism-filter mmp-tourism-filter--search");
  const searchLabel = document.createElement("label");
  searchLabel.setAttribute("for", "tourism-filter-search");
  searchLabel.textContent = "Search experiences";
  searchGroup.appendChild(searchLabel);

  const searchInput = document.createElement("input");
  searchInput.id = "tourism-filter-search";
  searchInput.type = "search";
  searchInput.placeholder = "Safari, beadmaking, Limpopo…";
  searchInput.value = state.search;
  searchInput.addEventListener("input", () => update("search", searchInput.value));
  searchGroup.appendChild(searchInput);
  root.appendChild(searchGroup);

  root.appendChild(
    selectGroup(
      "Province",
      "province",
      [{ value: "", label: "All provinces" }, ...SA_PROVINCES.map((p) => ({ value: p.name, label: p.name }))],
      state.province,
      update,
    ),
  );

  root.appendChild(
    selectGroup(
      "Experience type",
      "activity",
      [{ value: "", label: "All types" }, ...TOURISM_ACTIVITIES.map((a) => ({ value: a.value, label: `${a.emoji} ${a.label}` }))],
      state.activity,
      update,
    ),
  );

  root.appendChild(
    selectGroup(
      "Duration",
      "duration",
      [{ value: "", label: "Any length" }, ...DURATION_BUCKETS.map((d) => ({ value: d.value, label: d.label }))],
      state.duration,
      update,
    ),
  );

  root.appendChild(
    rangeGroup(
      "Max budget per person",
      "maxPrice",
      MAX_BUDGET,
      state.maxPrice,
      (value) => (Number(value) > 0 ? `R ${Number(value).toLocaleString("en-ZA")}` : "Any price"),
      update,
    ),
  );

  root.appendChild(
    rangeGroup(
      "Minimum group size",
      "groupSize",
      20,
      Number(state.groupSize) || 0,
      (value) => (Number(value) > 0 ? `${value} guests` : "Any"),
      update,
    ),
  );

  root.appendChild(
    selectGroup("Sort by", "sort", TOURISM_SORTS, state.sort, update),
  );

  // --- Summary + actions ---
  const footer = el("div", "mmp-tourism-filters__footer");

  const summary = el(
    "p",
    "mmp-tourism-filters__summary",
    resultCount === 1 ? "1 experience matches" : `${resultCount} experiences match your filters`,
  );
  footer.appendChild(summary);

  const actions = el("div", "mmp-tourism-filters__actions");

  const mapBtn = el("button", "mmp-tourism-btn mmp-tourism-btn--primary", "🗺️ Show on map");
  mapBtn.type = "button";
  mapBtn.addEventListener("click", () => navigate(buildMapLink(state).replace(/^#/, "")));
  actions.appendChild(mapBtn);

  const resetBtn = el("button", "mmp-tourism-btn mmp-tourism-btn--ghost", "Clear filters");
  resetBtn.type = "button";
  resetBtn.addEventListener("click", () => {
    if (typeof onChange === "function") onChange({ ...EMPTY_TOURISM_FILTERS });
  });
  actions.appendChild(resetBtn);

  footer.appendChild(actions);
  root.appendChild(footer);

  return root;
}

export default TourismFilters;
