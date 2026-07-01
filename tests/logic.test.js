import { describe, it, expect } from "vitest";
import {
  getInterpretation,
  getRecommendations,
  escapeHtml,
  DIMENSIONS,
  INTERPRETATIONS,
  PRIORITY_LABELS,
  PRIORITY_RECOMMENDATIONS,
} from "../src/logic.js";

// ─── getInterpretation ───

describe("getInterpretation", () => {
  it("returns nihilism for score 0", () => {
    const result = getInterpretation(0);
    expect(result).toBeDefined();
    expect(result.min).toBe(0);
    expect(result.max).toBe(8);
    expect(result.index).toBe(0);
  });

  it("returns nihilism for score 8", () => {
    const result = getInterpretation(8);
    expect(result.min).toBe(0);
    expect(result.max).toBe(8);
  });

  it("returns resignation for score 9", () => {
    const result = getInterpretation(9);
    expect(result.index).toBe(1);
    expect(result.min).toBe(9);
    expect(result.max).toBe(16);
  });

  it("returns resignation for score 16", () => {
    const result = getInterpretation(16);
    expect(result.index).toBe(1);
  });

  it("returns acceptance for score 17", () => {
    const result = getInterpretation(17);
    expect(result.index).toBe(2);
    expect(result.min).toBe(17);
    expect(result.max).toBe(24);
  });

  it("returns acceptance for score 24", () => {
    const result = getInterpretation(24);
    expect(result.index).toBe(2);
  });

  it("returns affirmation for score 25", () => {
    const result = getInterpretation(25);
    expect(result.index).toBe(3);
    expect(result.min).toBe(25);
    expect(result.max).toBe(32);
  });

  it("returns accomplished for score 33", () => {
    const result = getInterpretation(33);
    expect(result.index).toBe(4);
    expect(result.min).toBe(33);
    expect(result.max).toBe(40);
  });

  it("returns accomplished for score 40", () => {
    const result = getInterpretation(40);
    expect(result.index).toBe(4);
  });

  it("returns undefined for score below 0", () => {
    const result = getInterpretation(-1);
    expect(result).toBeUndefined();
  });

  it("returns undefined for score above 40", () => {
    const result = getInterpretation(41);
    expect(result).toBeUndefined();
  });

  it("all interpretations have an index 0-4", () => {
    for (let i = 0; i < INTERPRETATIONS.length; i++) {
      expect(INTERPRETATIONS[i].index).toBe(i);
    }
  });
});

// ─── getRecommendations ───

describe("getRecommendations", () => {
  const fullScores = {
    "Passé & Ressentiment": 6,
    "Souffrance présente": 5,
    Authenticité: 7,
    Création: 5,
    "Éternel Retour": 6,
  };

  it("returns priority-based recommendations for ressentiment", () => {
    const recs = getRecommendations(fullScores, "ressentiment");
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]).toBe("recommendation.ressentiment.0");
  });

  it("returns priority-based recommendations for souffrance", () => {
    const recs = getRecommendations(fullScores, "souffrance");
    expect(recs.length).toBeGreaterThan(0);
  });

  it("returns priority-based recommendations for authenticite", () => {
    const recs = getRecommendations(fullScores, "authenticite");
    expect(recs.length).toBeGreaterThan(0);
  });

  it("returns priority-based recommendations for creation", () => {
    const recs = getRecommendations(fullScores, "creation");
    expect(recs.length).toBeGreaterThan(0);
  });

  it("returns priority-based recommendations for eternel", () => {
    const recs = getRecommendations(fullScores, "eternel");
    expect(recs.length).toBeGreaterThan(0);
  });

  it("returns general recommendations for none priority", () => {
    const recs = getRecommendations(fullScores, "none");
    expect(recs.length).toBeGreaterThan(0);
  });

  it("adds focus on lowest dimension when score < 4", () => {
    const lowScores = {
      "Passé & Ressentiment": 1,
      "Souffrance présente": 5,
      Authenticité: 7,
      Création: 5,
      "Éternel Retour": 6,
    };
    const recs = getRecommendations(lowScores, "souffrance");
    const focusRec = recs.find((r) => r.startsWith("__focus__"));
    expect(focusRec).toBeDefined();
    expect(focusRec).toContain("Passé & Ressentiment");
  });

  it("limits to 5 recommendations max", () => {
    const recs = getRecommendations(fullScores, "ressentiment");
    expect(recs.length).toBeLessThanOrEqual(5);
  });

  it("returns recommendations for none priority with all high scores", () => {
    const highScores = {
      "Passé & Ressentiment": 7,
      "Souffrance présente": 7,
      Authenticité: 7,
      Création: 7,
      "Éternel Retour": 7,
    };
    const recs = getRecommendations(highScores, "none");
    // "none" priority always returns 2 general recommendations
    expect(recs.length).toBe(2);
  });
});

// ─── escapeHtml ───

describe("escapeHtml", () => {
  it("escapes < and >", () => {
    expect(escapeHtml("<div>test</div>")).toBe("&lt;div&gt;test&lt;/div&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('He said "hello"')).toBe("He said &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("Passé & Ressentiment")).toBe("Passé &amp; Ressentiment");
  });

  it("escapes full XSS payload", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("returns empty string for null", () => {
    expect(escapeHtml(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escapeHtml(undefined)).toBe("");
  });

  it("returns empty string for non-string types", () => {
    expect(escapeHtml(42)).toBe("");
    expect(escapeHtml({})).toBe("");
  });

  it("leaves normal text unchanged", () => {
    expect(escapeHtml("Hello world")).toBe("Hello world");
    expect(escapeHtml("Évaluation du jour")).toBe("Évaluation du jour");
  });
});

// ─── Constants integrity ───

describe("Constants integrity", () => {
  it("DIMENSIONS has 5 entries", () => {
    expect(Object.keys(DIMENSIONS)).toHaveLength(5);
  });

  it("DIMENSIONS keys match expected names", () => {
    expect(DIMENSIONS).toHaveProperty("Passé & Ressentiment");
    expect(DIMENSIONS).toHaveProperty("Souffrance présente");
    expect(DIMENSIONS).toHaveProperty("Authenticité");
    expect(DIMENSIONS).toHaveProperty("Création");
    expect(DIMENSIONS).toHaveProperty("Éternel Retour");
  });

  it("each DIMENSIONS entry has 2 questions", () => {
    for (const questions of Object.values(DIMENSIONS)) {
      expect(questions).toHaveLength(2);
    }
  });

  it("INTERPRETATIONS has 5 levels", () => {
    expect(INTERPRETATIONS).toHaveLength(5);
  });

  it("INTERPRETATIONS cover the full range 0-40 without gaps", () => {
    const covered = new Set();
    for (const interp of INTERPRETATIONS) {
      for (let i = interp.min; i <= interp.max; i++) {
        covered.add(i);
      }
    }
    for (let i = 0; i <= 40; i++) {
      expect(covered.has(i)).toBe(true);
    }
  });

  it("PRIORITY_LABELS has all 6 keys", () => {
    expect(Object.keys(PRIORITY_LABELS)).toHaveLength(6);
    expect(PRIORITY_LABELS).toHaveProperty("ressentiment");
    expect(PRIORITY_LABELS).toHaveProperty("souffrance");
    expect(PRIORITY_LABELS).toHaveProperty("authenticite");
    expect(PRIORITY_LABELS).toHaveProperty("creation");
    expect(PRIORITY_LABELS).toHaveProperty("eternel");
    expect(PRIORITY_LABELS).toHaveProperty("none");
  });

  it("PRIORITY_RECOMMENDATIONS has all 6 keys", () => {
    expect(Object.keys(PRIORITY_RECOMMENDATIONS)).toHaveLength(6);
  });
});
