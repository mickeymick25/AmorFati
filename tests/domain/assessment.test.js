import { describe, it, expect } from "vitest";
import {
  DEFAULT_DATA,
  createAssessment,
  isValidAssessment,
  filterValidAssessments,
  validateAppData,
} from "../../src/domain/assessment.js";

// ─── DEFAULT_DATA ───

describe("DEFAULT_DATA", () => {
  it("has null priority", () => {
    expect(DEFAULT_DATA.priority).toBeNull();
  });

  it("has empty assessments array", () => {
    expect(DEFAULT_DATA.assessments).toEqual([]);
  });

  it("has settings with null lastAssessment", () => {
    expect(DEFAULT_DATA.settings).toEqual({ lastAssessment: null });
  });

  it("is a frozen-like structure (immutable by convention)", () => {
    const cloned = structuredClone(DEFAULT_DATA);
    cloned.priority = "creation";
    expect(DEFAULT_DATA.priority).toBeNull();
    expect(cloned.priority).toBe("creation");
  });
});

// ─── createAssessment ───

describe("createAssessment", () => {
  it("creates an assessment with all fields", () => {
    const a = createAssessment({
      date: "2024-01-01",
      totalScore: 25,
      dimensionScores: { Authenticité: 6 },
      answers: { q1: 3 },
      context: "Test note",
      priority: "creation",
    });

    expect(a.date).toBe("2024-01-01");
    expect(a.totalScore).toBe(25);
    expect(a.dimensionScores).toEqual({ Authenticité: 6 });
    expect(a.answers).toEqual({ q1: 3 });
    expect(a.context).toBe("Test note");
    expect(a.priority).toBe("creation");
  });

  it("defaults context to empty string", () => {
    const a = createAssessment({
      date: "2024-01-01",
      totalScore: 10,
      dimensionScores: {},
      answers: {},
    });
    expect(a.context).toBe("");
  });

  it("defaults priority to null", () => {
    const a = createAssessment({
      date: "2024-01-01",
      totalScore: 10,
      dimensionScores: {},
      answers: {},
    });
    expect(a.priority).toBeNull();
  });

  it("allows overriding defaults", () => {
    const a = createAssessment({
      date: "2024-06-15",
      totalScore: 30,
      dimensionScores: { Authenticité: 7 },
      answers: { q5: 4 },
      context: "Mon contexte",
      priority: "authenticite",
    });
    expect(a.context).toBe("Mon contexte");
    expect(a.priority).toBe("authenticite");
  });
});

// ─── isValidAssessment ───

describe("isValidAssessment", () => {
  const validAssessment = {
    date: "2024-01-01",
    totalScore: 25,
    dimensionScores: { Authenticité: 6 },
    answers: { q1: 3 },
  };

  it("returns true for a valid assessment", () => {
    expect(isValidAssessment(validAssessment)).toBe(true);
  });

  it("returns true for assessment with extra fields", () => {
    const a = { ...validAssessment, context: "note", priority: "creation" };
    expect(isValidAssessment(a)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isValidAssessment(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidAssessment(undefined)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isValidAssessment("not an object")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isValidAssessment(42)).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isValidAssessment([1, 2, 3])).toBe(false);
  });

  it("returns false when date is missing", () => {
    const a = { totalScore: 25, dimensionScores: {}, answers: {} };
    expect(isValidAssessment(a)).toBe(false);
  });

  it("returns false when date is not a string", () => {
    const a = { ...validAssessment, date: 20240101 };
    expect(isValidAssessment(a)).toBe(false);
  });

  it("returns false when totalScore is missing", () => {
    const a = { date: "2024-01-01", dimensionScores: {}, answers: {} };
    expect(isValidAssessment(a)).toBe(false);
  });

  it("returns false when totalScore is not a number", () => {
    const a = { ...validAssessment, totalScore: "25" };
    expect(isValidAssessment(a)).toBe(false);
  });

  it("returns false when dimensionScores is missing", () => {
    const a = { date: "2024-01-01", totalScore: 25, answers: {} };
    expect(isValidAssessment(a)).toBe(false);
  });

  it("returns false when dimensionScores is an array", () => {
    const a = { ...validAssessment, dimensionScores: [1, 2, 3] };
    expect(isValidAssessment(a)).toBe(false);
  });

  it("returns false when dimensionScores is null", () => {
    const a = { ...validAssessment, dimensionScores: null };
    expect(isValidAssessment(a)).toBe(false);
  });

  it("returns true for assessment with empty dimensionScores object", () => {
    const a = { ...validAssessment, dimensionScores: {} };
    expect(isValidAssessment(a)).toBe(true);
  });
});

// ─── filterValidAssessments ───

describe("filterValidAssessments", () => {
  const validAssessment = {
    date: "2024-01-01",
    totalScore: 25,
    dimensionScores: { Authenticité: 6 },
    answers: {},
  };

  it("filters out invalid assessments", () => {
    const mixed = [
      validAssessment,
      null,
      { date: "2024-01-02" }, // missing totalScore and dimensionScores
      validAssessment,
    ];
    const result = filterValidAssessments(mixed);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for all invalid inputs", () => {
    const allInvalid = [null, undefined, "string", 42, []];
    const result = filterValidAssessments(allInvalid);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for empty input array", () => {
    expect(filterValidAssessments([])).toEqual([]);
  });

  it("returns empty array when input is not an array", () => {
    expect(filterValidAssessments(null)).toEqual([]);
    expect(filterValidAssessments(undefined)).toEqual([]);
    expect(filterValidAssessments("string")).toEqual([]);
    expect(filterValidAssessments(42)).toEqual([]);
  });

  it("preserves all valid assessments", () => {
    const assessments = [
      { date: "2024-01-01", totalScore: 10, dimensionScores: {}, answers: {} },
      {
        date: "2024-02-01",
        totalScore: 20,
        dimensionScores: { Authenticité: 5 },
        answers: {},
      },
      {
        date: "2024-03-01",
        totalScore: 30,
        dimensionScores: { Création: 7 },
        answers: {},
      },
    ];
    const result = filterValidAssessments(assessments);
    expect(result).toHaveLength(3);
  });
});

// ─── validateAppData ───

describe("validateAppData", () => {
  it("returns DEFAULT_DATA clone for null input", () => {
    const result = validateAppData(null);
    expect(result).toEqual(DEFAULT_DATA);
    expect(result).not.toBe(DEFAULT_DATA); // must be a clone
  });

  it("returns DEFAULT_DATA clone for undefined input", () => {
    const result = validateAppData(undefined);
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("returns DEFAULT_DATA clone for array input", () => {
    const result = validateAppData([1, 2, 3]);
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("returns DEFAULT_DATA clone for string input", () => {
    const result = validateAppData("string");
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("returns DEFAULT_DATA clone when assessments is not an array", () => {
    const result = validateAppData({ assessments: "not array" });
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("returns DEFAULT_DATA clone when assessments is missing", () => {
    const result = validateAppData({ priority: "creation" });
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("returns DEFAULT_DATA clone when priority is invalid type", () => {
    const result = validateAppData({
      priority: 123,
      assessments: [],
      settings: { lastAssessment: null },
    });
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("returns DEFAULT_DATA clone when settings is null", () => {
    const result = validateAppData({
      priority: null,
      assessments: [],
      settings: null,
    });
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("returns DEFAULT_DATA clone when settings is an array", () => {
    const result = validateAppData({
      priority: null,
      assessments: [],
      settings: [],
    });
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("returns DEFAULT_DATA clone when settings.lastAssessment is invalid type", () => {
    const result = validateAppData({
      priority: null,
      assessments: [],
      settings: { lastAssessment: 123 },
    });
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("accepts valid data with null priority and null lastAssessment", () => {
    const data = {
      priority: null,
      assessments: [],
      settings: { lastAssessment: null },
    };
    const result = validateAppData(data);
    expect(result).toEqual(data);
  });

  it("accepts valid data with string priority and string lastAssessment", () => {
    const data = {
      priority: "creation",
      assessments: [],
      settings: { lastAssessment: "2024-01-01" },
    };
    const result = validateAppData(data);
    expect(result).toEqual(data);
  });

  it("filters out invalid assessments from valid data", () => {
    const data = {
      priority: null,
      assessments: [
        {
          date: "2024-01-01",
          totalScore: 25,
          dimensionScores: {},
          answers: {},
        },
        null, // invalid
        {
          date: "2024-02-01",
          totalScore: 15,
          dimensionScores: {},
          answers: {},
        },
      ],
      settings: { lastAssessment: null },
    };
    const result = validateAppData(data);
    expect(result.assessments).toHaveLength(2);
  });

  it("returns a new object (not a reference to input)", () => {
    const data = {
      priority: null,
      assessments: [],
      settings: { lastAssessment: null },
    };
    const result = validateAppData(data);
    result.priority = "modified";
    expect(data.priority).toBeNull();
  });
});
