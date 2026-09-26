// @vitest-environment node
/**
 * @file Tourism data helper tests.
 * @description Covers the pure filter, sort, format and deep-link helpers that
 * power the tourism view and the smart map.
 */

import { describe, it, expect } from "vitest";
import {
  SAMPLE_EXPERIENCES,
  DURATION_BUCKETS,
  filterExperiences,
  sortExperiences,
  formatZar,
  formatDuration,
  buildMapLink,
  filtersFromQuery,
  normaliseExperience,
  experiencesFromBusinesses,
  isTourismBusiness,
} from "../data/tourism.js";

describe("formatZar", () => {
  it("formats a rand amount", () => {
    expect(formatZar(650)).toBe("R 650");
  });

  it("asks the host when there is no price", () => {
    expect(formatZar(0)).toBe("Ask the host");
    expect(formatZar(null)).toBe("Ask the host");
  });
});

describe("formatDuration", () => {
  it("renders short durations in hours", () => {
    expect(formatDuration(3)).toBe("3 hrs");
  });

  it("renders a twelve hour duration as a full day", () => {
    expect(formatDuration(12)).toBe("Full day");
  });

  it("renders long durations in days", () => {
    expect(formatDuration(48)).toBe("2 days");
  });
});

describe("filterExperiences", () => {
  it("returns everything when no filters are set", () => {
    expect(filterExperiences(SAMPLE_EXPERIENCES)).toHaveLength(SAMPLE_EXPERIENCES.length);
  });

  it("filters by province", () => {
    const results = filterExperiences(SAMPLE_EXPERIENCES, { province: "Limpopo" });
    expect(results).toHaveLength(2);
    expect(results.every((item) => item.province === "Limpopo")).toBe(true);
  });

  it("filters by activity type", () => {
    const results = filterExperiences(SAMPLE_EXPERIENCES, { activity: "food" });
    expect(results).toHaveLength(1);
    expect(results[0].name).toContain("Feast");
  });

  it("filters by budget", () => {
    const results = filterExperiences(SAMPLE_EXPERIENCES, { maxPrice: 400 });
    expect(results.every((item) => item.price <= 400)).toBe(true);
  });

  it("filters by duration bucket", () => {
    const halfDay = DURATION_BUCKETS.find((bucket) => bucket.value === "half");
    const results = filterExperiences(SAMPLE_EXPERIENCES, { duration: halfDay.value });
    expect(results.every((item) => item.durationHours <= halfDay.maxHours)).toBe(true);
  });

  it("drops hosts that cannot take the requested group size", () => {
    const results = filterExperiences(SAMPLE_EXPERIENCES, { groupSize: 12 });
    expect(results.every((item) => item.groupSizeMax >= 12)).toBe(true);
  });

  it("searches across name, host and location", () => {
    const results = filterExperiences(SAMPLE_EXPERIENCES, { search: "beadmaking" });
    expect(results).toHaveLength(1);
    expect(results[0].activity).toBe("craft");
  });

  it("returns nothing when filters conflict", () => {
    const results = filterExperiences(SAMPLE_EXPERIENCES, {
      province: "Western Cape",
      maxPrice: 100,
    });
    expect(results).toHaveLength(0);
  });
});

describe("sortExperiences", () => {
  it("sorts by ascending price", () => {
    const sorted = sortExperiences(SAMPLE_EXPERIENCES, "price-asc");
    expect(sorted[0].price).toBe(220);
    expect(sorted[sorted.length - 1].price).toBe(1250);
  });

  it("sorts by rating by default", () => {
    const sorted = sortExperiences(SAMPLE_EXPERIENCES);
    expect(sorted[0].rating).toBeGreaterThanOrEqual(sorted[1].rating);
  });
});

describe("buildMapLink", () => {
  it("always targets the tourism category", () => {
    expect(buildMapLink()).toBe("#/map?category=tourism");
  });

  it("carries the active filters across to the map", () => {
    const link = buildMapLink({ province: "Limpopo", activity: "craft", search: "beads" });
    expect(link).toContain("category=tourism");
    expect(link).toContain("province=Limpopo");
    expect(link).toContain("activity=craft");
    expect(link).toContain("q=beads");
  });
});

describe("filtersFromQuery", () => {
  it("maps query params back into filter state", () => {
    expect(filtersFromQuery({ q: "safari", province: "Mpumalanga" })).toEqual({
      search: "safari",
      province: "Mpumalanga",
      activity: "",
    });
  });
});

describe("normaliseExperience", () => {
  it("accepts snake_case database rows", () => {
    const experience = normaliseExperience({
      id: 1,
      name: "Test experience",
      duration_hours: 6,
      group_size_max: 8,
      is_youth_owned: true,
      latitude: -30.1,
      longitude: 24.2,
      included: "Lunch|Guide",
    });

    expect(experience.durationHours).toBe(6);
    expect(experience.groupSizeMax).toBe(8);
    expect(experience.youthOwned).toBe(true);
    expect(experience.lat).toBeCloseTo(-30.1);
    expect(experience.included).toEqual(["Lunch", "Guide"]);
  });
});

describe("experiencesFromBusinesses", () => {
  it("only converts tourism businesses", () => {
    const businesses = [
      { id: 1, name: "Farm Lodge", category: "tourism", lat: -30, lng: 24 },
      { id: 2, name: "Corner Shop", category: "shops", lat: -30, lng: 24 },
    ];

    const experiences = experiencesFromBusinesses(businesses);
    expect(experiences).toHaveLength(1);
    expect(experiences[0].id).toBe("biz-1");
    expect(experiences[0].category).toBe("tourism");
  });

  it("detects tourism-like categories", () => {
    expect(isTourismBusiness({ category: "Tourism & Hospitality" })).toBe(true);
    expect(isTourismBusiness({ category: "food" })).toBe(false);
  });
});
