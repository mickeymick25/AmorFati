import { describe, it, expect } from "vitest";
import {
  migrateData,
  CURRENT_SCHEMA_VERSION,
} from "../../src/domain/migration.js";
import { DEFAULT_DATA } from "../../src/domain/assessment.js";

// ─── CURRENT_SCHEMA_VERSION ───

describe("CURRENT_SCHEMA_VERSION", () => {
  it("equals 1", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });
});

// ─── DEFAULT_DATA version ───

describe("DEFAULT_DATA version", () => {
  it("has version field equal to CURRENT_SCHEMA_VERSION", () => {
    expect(DEFAULT_DATA.version).toBe(CURRENT_SCHEMA_VERSION);
  });
});

// ─── migrateData ───

describe("migrateData", () => {
  it("adds version to legacy data (no version field)", () => {
    const legacy = {
      priority: null,
      assessments: [],
      settings: { lastAssessment: null },
    };
    const result = migrateData(legacy);
    expect(result.version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("preserves existing fields when migrating legacy data", () => {
    const legacy = {
      priority: "creation",
      assessments: [
        {
          date: "2024-01-01",
          totalScore: 10,
          dimensionScores: {},
          answers: {},
        },
      ],
      settings: { lastAssessment: "2024-01-01" },
    };
    const result = migrateData(legacy);
    expect(result.priority).toBe("creation");
    expect(result.assessments).toHaveLength(1);
    expect(result.settings.lastAssessment).toBe("2024-01-01");
  });

  it("passes through current version data unchanged", () => {
    const current = {
      version: CURRENT_SCHEMA_VERSION,
      priority: null,
      assessments: [],
      settings: { lastAssessment: null },
    };
    const result = migrateData(current);
    expect(result).toEqual(current);
  });

  it("handles future version gracefully by returning DEFAULT_DATA clone", () => {
    const future = {
      version: CURRENT_SCHEMA_VERSION + 1,
      priority: "creation",
      assessments: [],
      settings: { lastAssessment: null },
    };
    const result = migrateData(future);
    expect(result).toEqual(DEFAULT_DATA);
    expect(result).not.toBe(DEFAULT_DATA); // must be a clone
  });

  it("adds settings to legacy data missing settings", () => {
    const legacy = {
      priority: null,
      assessments: [],
    };
    const result = migrateData(legacy);
    expect(result.settings).toEqual({ lastAssessment: null });
    expect(result.version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("returns DEFAULT_DATA clone for null input", () => {
    const result = migrateData(null);
    expect(result).toEqual(DEFAULT_DATA);
    expect(result).not.toBe(DEFAULT_DATA);
  });

  it("returns DEFAULT_DATA clone for non-object input", () => {
    const result = migrateData("not an object");
    expect(result).toEqual(DEFAULT_DATA);
  });

  it("returns DEFAULT_DATA clone for array input", () => {
    const result = migrateData([1, 2, 3]);
    expect(result).toEqual(DEFAULT_DATA);
  });
});
