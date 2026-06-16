// ========================================
// AmorFati — Data Migration (Domain)
// ========================================
// Handles schema versioning and migration of data loaded from storage.
// Ensures backward compatibility when the data structure evolves.

import { DEFAULT_DATA } from "./assessment.js";

/**
 * Current schema version.
 * Increment this when the data structure changes in a non-backward-compatible way.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Migrate loaded data to the current schema version.
 *
 * - Legacy data (no version field) gets version set to CURRENT_SCHEMA_VERSION
 *   and missing structural fields (e.g. settings) are added.
 * - Data at the current version is returned as-is.
 * - Data from a future version triggers a reset to DEFAULT_DATA (with a warning).
 * - Invalid input (null, non-object, arrays) returns a clone of DEFAULT_DATA.
 *
 * @param {*} data - The loaded data to migrate
 * @returns {object} Migrated data conforming to the current schema
 */
export function migrateData(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return structuredClone(DEFAULT_DATA);
  }

  // Future version — cannot migrate forward, reset to defaults
  if (data.version > CURRENT_SCHEMA_VERSION) {
    console.warn(
      `migrateData: unknown schema version ${data.version}, resetting to defaults`,
    );
    return structuredClone(DEFAULT_DATA);
  }

  // Current version — pass through
  if (data.version === CURRENT_SCHEMA_VERSION) {
    return data;
  }

  // Legacy data (no version or version 0) — migrate
  const migrated = {
    version: CURRENT_SCHEMA_VERSION,
    priority:
      typeof data.priority === "string" || data.priority === null
        ? data.priority
        : null,
    assessments: Array.isArray(data.assessments) ? data.assessments : [],
    settings:
      typeof data.settings === "object" &&
      data.settings !== null &&
      !Array.isArray(data.settings)
        ? data.settings
        : { lastAssessment: null },
  };

  return migrated;
}
