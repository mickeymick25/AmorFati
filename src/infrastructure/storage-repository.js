// ========================================
// AmorFati — Storage Repository (Infrastructure)
// ========================================
// Abstraction over localStorage for data persistence.
// This module isolates infrastructure concerns from domain logic,
// making it possible to test data operations without relying on
// the browser's localStorage API.

export class LocalStorageRepository {
  /**
   * @param {string} key - The localStorage key to use
   */
  constructor(key = "amorFatiData") {
    this.key = key;
  }

  /**
   * Save data to localStorage.
   * @param {object} data - The data object to persist
   * @throws {Error} If serialization or storage fails (e.g. quota exceeded)
   */
  save(data) {
    const serialized = JSON.stringify(data);
    localStorage.setItem(this.key, serialized);
  }

  /**
   * Load data from localStorage.
   * @returns {object|null} The parsed data object, or null if nothing is stored
   * @throws {Error} If stored data is not valid JSON
   */
  load() {
    const stored = localStorage.getItem(this.key);
    if (stored === null) return null;
    return JSON.parse(stored);
  }

  /**
   * Delete data from localStorage.
   */
  delete() {
    localStorage.removeItem(this.key);
  }

  /**
   * Check whether data exists in localStorage.
   * @returns {boolean}
   */
  exists() {
    return localStorage.getItem(this.key) !== null;
  }

  /**
   * Export data as a JSON string with pretty-printing.
   * @param {object} data - The data object to export
   * @returns {string} Pretty-printed JSON string
   */
  exportJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from a JSON string.
   * Validates that the parsed result has an `assessments` array.
   * @param {string} jsonString - The JSON string to parse
   * @returns {object} The parsed data object
   * @throws {Error} If the string is not valid JSON or lacks required structure
   */
  importJSON(jsonString) {
    const parsed = JSON.parse(jsonString);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("Format de fichier invalide");
    }

    if (!Array.isArray(parsed.assessments)) {
      throw new Error("Format de fichier invalide");
    }

    return parsed;
  }
}
