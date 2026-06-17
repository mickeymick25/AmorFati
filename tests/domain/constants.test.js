import { describe, it, expect } from "vitest";
import {
  STORAGE_KEY,
  PRIORITY_LABELS,
  PRIORITY_LABELS_FULL,
  INTERPRETATIONS,
  PRIORITY_RECOMMENDATIONS,
} from "../../src/domain/constants.js";

describe("STORAGE_KEY", () => {
  it('is "amorFatiData"', () => {
    expect(STORAGE_KEY).toBe("amorFatiData");
  });
});

describe("PRIORITY_LABELS", () => {
  it("has 6 keys", () => {
    expect(Object.keys(PRIORITY_LABELS)).toHaveLength(6);
  });

  it("contains all expected priority keys", () => {
    expect(PRIORITY_LABELS).toHaveProperty("ressentiment");
    expect(PRIORITY_LABELS).toHaveProperty("souffrance");
    expect(PRIORITY_LABELS).toHaveProperty("authenticite");
    expect(PRIORITY_LABELS).toHaveProperty("creation");
    expect(PRIORITY_LABELS).toHaveProperty("eternel");
    expect(PRIORITY_LABELS).toHaveProperty("none");
  });
});

describe("PRIORITY_LABELS_FULL", () => {
  it("has the same keys as PRIORITY_LABELS", () => {
    expect(Object.keys(PRIORITY_LABELS_FULL)).toEqual(
      Object.keys(PRIORITY_LABELS),
    );
  });

  it("has longer descriptions than PRIORITY_LABELS", () => {
    const keys = Object.keys(PRIORITY_LABELS);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      expect(PRIORITY_LABELS_FULL[key].length).toBeGreaterThan(
        PRIORITY_LABELS[key].length,
      );
    }
  });
});

describe("INTERPRETATIONS", () => {
  it("has 5 levels", () => {
    expect(INTERPRETATIONS).toHaveLength(5);
  });

  it("covers the full range 0-40 without gaps", () => {
    const covered = new Set();
    for (let i = 0; i < INTERPRETATIONS.length; i++) {
      const interp = INTERPRETATIONS[i];
      for (let s = interp.min; s <= interp.max; s++) {
        covered.add(s);
      }
    }
    for (let s = 0; s <= 40; s++) {
      expect(covered.has(s)).toBe(true);
    }
  });

  it("each interpretation has required fields", () => {
    for (let i = 0; i < INTERPRETATIONS.length; i++) {
      const interp = INTERPRETATIONS[i];
      expect(interp).toHaveProperty("min");
      expect(interp).toHaveProperty("max");
      expect(interp).toHaveProperty("title");
      expect(interp).toHaveProperty("text");
      expect(interp.text).toHaveLength(3);
      expect(typeof interp.min).toBe("number");
      expect(typeof interp.max).toBe("number");
      expect(typeof interp.title).toBe("string");
    }
  });

  it("levels are ordered from lowest to highest score", () => {
    for (let i = 1; i < INTERPRETATIONS.length; i++) {
      expect(INTERPRETATIONS[i].min).toBe(INTERPRETATIONS[i - 1].max + 1);
    }
  });
});

describe("PRIORITY_RECOMMENDATIONS", () => {
  it("has 6 keys matching PRIORITY_LABELS", () => {
    expect(Object.keys(PRIORITY_RECOMMENDATIONS)).toHaveLength(6);
    const keys = Object.keys(PRIORITY_LABELS);
    for (let i = 0; i < keys.length; i++) {
      expect(PRIORITY_RECOMMENDATIONS).toHaveProperty(keys[i]);
    }
  });

  it("each key has an array of strings", () => {
    const entries = Object.entries(PRIORITY_RECOMMENDATIONS);
    for (let i = 0; i < entries.length; i++) {
      const recs = entries[i][1];
      expect(Array.isArray(recs)).toBe(true);
      for (let j = 0; j < recs.length; j++) {
        expect(typeof recs[j]).toBe("string");
        expect(recs[j].length).toBeGreaterThan(0);
      }
    }
  });

  it("non-none priorities have at least 3 recommendations", () => {
    const keys = Object.keys(PRIORITY_LABELS);
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === "none") continue;
      expect(PRIORITY_RECOMMENDATIONS[keys[i]].length).toBeGreaterThanOrEqual(
        3,
      );
    }
  });
});
