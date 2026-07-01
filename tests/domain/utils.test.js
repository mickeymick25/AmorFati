import { describe, it, expect } from "vitest";
import { escapeHtml, shuffle } from "../../src/domain/utils.js";

describe("escapeHtml", () => {
  it("escapes < and >", () => {
    expect(escapeHtml("<div>test</div>")).toBe("&lt;div&gt;test&lt;/div&gt;");
  });

  it("returns empty string for non-string inputs", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(42)).toBe("");
  });
});

describe("shuffle", () => {
  it("returns an array of the same length", () => {
    const input = [0, 1, 2, 3, 4];
    expect(shuffle(input)).toHaveLength(5);
  });

  it("preserves the same elements (multiset)", () => {
    const input = [0, 1, 2, 3, 4];
    const shuffled = shuffle(input);
    expect([...shuffled].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it("does not mutate the input array", () => {
    const input = [0, 1, 2, 3, 4];
    const snapshot = [...input];
    shuffle(input);
    expect(input).toEqual(snapshot);
  });

  it("returns a new array (not the same reference)", () => {
    const input = [0, 1, 2, 3, 4];
    const shuffled = shuffle(input);
    expect(shuffled).not.toBe(input);
  });

  it("handles an empty array", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("handles a single-element array", () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it("produces different permutations across repeated calls (non-degenerate)", () => {
    const input = [0, 1, 2, 3, 4];
    const permutations = new Set();
    for (let i = 0; i < 100; i++) {
      permutations.add(shuffle(input).join(","));
    }
    // With 100 shuffles of 5 elements, expecting at least 2 distinct permutations
    // (probabilistically near-certain; guards against a no-op implementation).
    expect(permutations.size).toBeGreaterThan(1);
  });

  it("preserves object elements by reference", () => {
    const a = { value: 0 };
    const b = { value: 1 };
    const shuffled = shuffle([a, b]);
    expect(shuffled).toContain(a);
    expect(shuffled).toContain(b);
  });
});
