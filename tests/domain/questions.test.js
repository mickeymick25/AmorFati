import { describe, it, expect } from "vitest";
import {
  QUESTIONS,
  DIMENSION_INFO,
  DIMENSIONS,
} from "../../src/domain/questions.js";

describe("QUESTIONS", () => {
  it("has exactly 10 entries", () => {
    expect(QUESTIONS).toHaveLength(10);
  });

  it("each question has required fields (id, dimension, text, options)", () => {
    for (const q of QUESTIONS) {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("dimension");
      expect(q).toHaveProperty("text");
      expect(q).toHaveProperty("options");
      expect(typeof q.id).toBe("string");
      expect(typeof q.dimension).toBe("string");
      expect(typeof q.text).toBe("string");
      expect(q.text.length).toBeGreaterThan(0);
    }
  });

  it("each option has value 0-4 and a non-empty label", () => {
    for (const q of QUESTIONS) {
      expect(q.options).toHaveLength(5);
      for (const opt of q.options) {
        expect(opt).toHaveProperty("value");
        expect(opt).toHaveProperty("label");
        expect(typeof opt.value).toBe("number");
        expect(opt.value).toBeGreaterThanOrEqual(0);
        expect(opt.value).toBeLessThanOrEqual(4);
        expect(typeof opt.label).toBe("string");
        expect(opt.label.length).toBeGreaterThan(0);
      }
    }
  });

  it("question IDs are q1 through q10", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(ids).toEqual([
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
      "q6",
      "q7",
      "q8",
      "q9",
      "q10",
    ]);
  });

  it("each question has unique options with values 0, 1, 2, 3, 4", () => {
    for (const q of QUESTIONS) {
      const values = q.options.map((opt) => opt.value).sort();
      expect(values).toEqual([0, 1, 2, 3, 4]);
    }
  });
});

describe("DIMENSION_INFO", () => {
  it("has 5 entries", () => {
    expect(DIMENSION_INFO).toHaveLength(5);
  });

  it("each entry has name, title, description, and order", () => {
    for (const dim of DIMENSION_INFO) {
      expect(dim).toHaveProperty("name");
      expect(dim).toHaveProperty("title");
      expect(dim).toHaveProperty("description");
      expect(dim).toHaveProperty("order");
      expect(typeof dim.name).toBe("string");
      expect(typeof dim.title).toBe("string");
      expect(typeof dim.description).toBe("string");
      expect(typeof dim.order).toBe("number");
      expect(dim.name.length).toBeGreaterThan(0);
      expect(dim.title.length).toBeGreaterThan(0);
      expect(dim.description.length).toBeGreaterThan(0);
    }
  });

  it("orders are 1 through 5", () => {
    const orders = DIMENSION_INFO.map((d) => d.order).sort();
    expect(orders).toEqual([1, 2, 3, 4, 5]);
  });

  it("all dimension names in QUESTIONS match DIMENSION_INFO", () => {
    const dimNames = new Set(DIMENSION_INFO.map((d) => d.name));
    for (const q of QUESTIONS) {
      expect(dimNames.has(q.dimension)).toBe(true);
    }
  });

  it("each dimension has exactly 2 questions", () => {
    for (const dim of DIMENSION_INFO) {
      const dimQuestions = QUESTIONS.filter((q) => q.dimension === dim.name);
      expect(dimQuestions).toHaveLength(2);
    }
  });
});

describe("DIMENSIONS (derived)", () => {
  it("has 5 dimension keys", () => {
    expect(Object.keys(DIMENSIONS)).toHaveLength(5);
  });

  it("matches the dimension names from DIMENSION_INFO", () => {
    const dimNames = DIMENSION_INFO.map((d) => d.name);
    expect(Object.keys(DIMENSIONS)).toEqual(dimNames);
  });

  it("each dimension maps to the correct question IDs", () => {
    for (const [name, ids] of Object.entries(DIMENSIONS)) {
      expect(ids).toHaveLength(2);
      for (const id of ids) {
        const q = QUESTIONS.find((q) => q.id === id);
        expect(q).toBeDefined();
        expect(q.dimension).toBe(name);
      }
    }
  });

  it("is consistent with the original hardcoded DIMENSIONS", () => {
    expect(DIMENSIONS).toEqual({
      "Passé & Ressentiment": ["q1", "q2"],
      "Souffrance présente": ["q3", "q4"],
      Authenticité: ["q5", "q6"],
      Création: ["q7", "q8"],
      "Éternel Retour": ["q9", "q10"],
    });
  });
});
