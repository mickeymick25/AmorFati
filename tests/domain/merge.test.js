import { describe, it, expect } from "vitest";
import { mergeAssessments } from "../../src/domain/merge.js";

describe("mergeAssessments", () => {
  const assessmentA = {
    date: "2025-01-10T10:00:00.000Z",
    totalScore: 20,
    dimensionScores: { "Passé & Ressentiment": 4 },
    answers: {},
  };
  const assessmentB = {
    date: "2025-02-15T14:00:00.000Z",
    totalScore: 25,
    dimensionScores: { "Passé & Ressentiment": 5 },
    answers: {},
  };
  const assessmentC = {
    date: "2025-03-20T08:00:00.000Z",
    totalScore: 30,
    dimensionScores: { "Passé & Ressentiment": 6 },
    answers: {},
  };

  it("merges two non-overlapping arrays", () => {
    const existing = [assessmentA];
    const incoming = [assessmentB];
    const result = mergeAssessments(existing, incoming);

    expect(result).toHaveLength(2);
  });

  it("deduplicates assessments with same date and totalScore (keeps existing)", () => {
    const duplicate = {
      date: "2025-01-10T10:00:00.000Z",
      totalScore: 20,
      dimensionScores: { "Passé & Ressentiment": 99 },
      answers: { q1: 1 },
    };
    const existing = [assessmentA];
    const incoming = [duplicate];
    const result = mergeAssessments(existing, incoming);

    expect(result).toHaveLength(1);
    expect(result[0].dimensionScores).toEqual(assessmentA.dimensionScores);
  });

  it("does not deduplicate assessments with same date but different totalScore", () => {
    const sameDateDifferentScore = {
      date: "2025-01-10T10:00:00.000Z",
      totalScore: 21,
      dimensionScores: { "Passé & Ressentiment": 5 },
      answers: {},
    };
    const existing = [assessmentA];
    const incoming = [sameDateDifferentScore];
    const result = mergeAssessments(existing, incoming);

    expect(result).toHaveLength(2);
  });

  it("merges with empty existing array", () => {
    const result = mergeAssessments([], [assessmentA, assessmentB]);

    expect(result).toHaveLength(2);
  });

  it("merges with empty incoming array", () => {
    const result = mergeAssessments([assessmentA, assessmentB], []);

    expect(result).toHaveLength(2);
  });

  it("sorts by date (most recent first)", () => {
    const result = mergeAssessments([assessmentA], [assessmentC, assessmentB]);

    expect(result[0].date).toBe("2025-03-20T08:00:00.000Z");
    expect(result[1].date).toBe("2025-02-15T14:00:00.000Z");
    expect(result[2].date).toBe("2025-01-10T10:00:00.000Z");
  });

  it("does not mutate the existing array", () => {
    const existing = [assessmentA];
    const copy = JSON.parse(JSON.stringify(existing));
    mergeAssessments(existing, [assessmentB]);

    expect(existing).toEqual(copy);
  });

  it("does not mutate the incoming array", () => {
    const incoming = [assessmentB];
    const copy = JSON.parse(JSON.stringify(incoming));
    mergeAssessments([assessmentA], incoming);

    expect(incoming).toEqual(copy);
  });

  it("defaults existing to empty array when null", () => {
    const result = mergeAssessments(null, [assessmentA]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(assessmentA);
  });

  it("defaults existing to empty array when undefined", () => {
    const result = mergeAssessments(undefined, [assessmentA]);
    expect(result).toHaveLength(1);
  });

  it("defaults incoming to empty array when null", () => {
    const result = mergeAssessments([assessmentA], null);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(assessmentA);
  });

  it("defaults incoming to empty array when undefined", () => {
    const result = mergeAssessments([assessmentA], undefined);
    expect(result).toHaveLength(1);
  });

  it("defaults both to empty arrays when null", () => {
    const result = mergeAssessments(null, null);
    expect(result).toEqual([]);
  });
});
