import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageRepository } from "../../src/infrastructure/storage-repository.js";

describe("LocalStorageRepository", () => {
  let repo;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageRepository("testKey");
  });

  // ─── Constructor ───

  describe("constructor", () => {
    it("uses the provided key", () => {
      const customRepo = new LocalStorageRepository("customKey");
      expect(customRepo.key).toBe("customKey");
    });

    it("defaults to amorFatiData key", () => {
      const defaultRepo = new LocalStorageRepository();
      expect(defaultRepo.key).toBe("amorFatiData");
    });
  });

  // ─── save ───

  describe("save", () => {
    it("saves data to localStorage", () => {
      const data = { priority: "creation", assessments: [] };
      repo.save(data);
      const stored = localStorage.getItem("testKey");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored)).toEqual(data);
    });

    it("overwrites existing data", () => {
      repo.save({ priority: "creation" });
      repo.save({ priority: "authenticite" });
      const stored = JSON.parse(localStorage.getItem("testKey"));
      expect(stored.priority).toBe("authenticite");
    });

    it("serializes complex nested data", () => {
      const data = {
        priority: "eternel",
        assessments: [
          {
            date: "2024-01-01",
            totalScore: 25,
            dimensionScores: { Authenticité: 6 },
          },
        ],
        settings: { lastAssessment: "2024-01-01" },
      };
      repo.save(data);
      const stored = JSON.parse(localStorage.getItem("testKey"));
      expect(stored).toEqual(data);
    });
  });

  // ─── load ───

  describe("load", () => {
    it("returns null when nothing is stored", () => {
      expect(repo.load()).toBeNull();
    });

    it("loads data that was saved", () => {
      const data = { priority: "ressentiment", assessments: [] };
      repo.save(data);
      expect(repo.load()).toEqual(data);
    });

    it("returns a parsed object, not a string", () => {
      repo.save({ priority: null });
      const result = repo.load();
      expect(typeof result).toBe("object");
      expect(result).not.toBeNull();
    });

    it("throws on invalid JSON in localStorage", () => {
      localStorage.setItem("testKey", "{invalid json!!!");
      expect(() => repo.load()).toThrow();
    });
  });

  // ─── delete ───

  describe("delete", () => {
    it("removes data from localStorage", () => {
      repo.save({ priority: "souffrance" });
      expect(repo.exists()).toBe(true);
      repo.delete();
      expect(repo.exists()).toBe(false);
      expect(repo.load()).toBeNull();
    });

    it("does not throw when key does not exist", () => {
      expect(() => repo.delete()).not.toThrow();
    });
  });

  // ─── exists ───

  describe("exists", () => {
    it("returns false when nothing is stored", () => {
      expect(repo.exists()).toBe(false);
    });

    it("returns true after data is saved", () => {
      repo.save({ priority: null });
      expect(repo.exists()).toBe(true);
    });

    it("returns false after data is deleted", () => {
      repo.save({ priority: null });
      repo.delete();
      expect(repo.exists()).toBe(false);
    });
  });

  // ─── exportJSON ───

  describe("exportJSON", () => {
    it("exports data as pretty-printed JSON", () => {
      const data = { priority: "creation", assessments: [] };
      const json = repo.exportJSON(data);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(data);
    });

    it("includes indentation in output", () => {
      const data = { priority: "creation" };
      const json = repo.exportJSON(data);
      expect(json).toContain("\n");
      expect(json).toContain("  ");
    });
  });

  // ─── importJSON ───

  describe("importJSON", () => {
    it("imports valid JSON with assessments array", () => {
      const data = {
        priority: "creation",
        assessments: [
          { date: "2024-01-01", totalScore: 20, dimensionScores: {} },
        ],
      };
      const json = JSON.stringify(data);
      expect(repo.importJSON(json)).toEqual(data);
    });

    it("imports data with empty assessments array", () => {
      const data = { priority: null, assessments: [] };
      const json = JSON.stringify(data);
      expect(repo.importJSON(json)).toEqual(data);
    });

    it("throws on invalid JSON string", () => {
      expect(() => repo.importJSON("not json")).toThrow();
    });

    it("throws on non-object root (array)", () => {
      expect(() => repo.importJSON("[1,2,3]")).toThrow(
        "Format de fichier invalide",
      );
    });

    it("throws on non-object root (string)", () => {
      expect(() => repo.importJSON('"hello"')).toThrow(
        "Format de fichier invalide",
      );
    });

    it("throws on missing assessments property", () => {
      expect(() => repo.importJSON('{"priority":"creation"}')).toThrow(
        "Format de fichier invalide",
      );
    });

    it("throws on assessments that is not an array", () => {
      expect(() => repo.importJSON('{"assessments":"not array"}')).toThrow(
        "Format de fichier invalide",
      );
    });

    it("accepts data with null priority", () => {
      const data = { priority: null, assessments: [] };
      const json = JSON.stringify(data);
      expect(repo.importJSON(json)).toEqual(data);
    });

    it("accepts data with settings", () => {
      const data = {
        priority: "creation",
        assessments: [],
        settings: { lastAssessment: "2024-01-01" },
      };
      const json = JSON.stringify(data);
      expect(repo.importJSON(json)).toEqual(data);
    });
  });
});
