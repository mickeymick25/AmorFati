// ========================================
// AmorFati — Barrel Re-export (Backward Compatibility)
// ========================================
// This module re-exports everything from the domain and infrastructure modules.
// Existing imports from './src/logic.js' continue to work without changes.
// New code should import directly from the specific domain module instead.

// Domain constants
export {
  STORAGE_KEY,
  PRIORITY_LABELS,
  PRIORITY_LABELS_FULL,
  INTERPRETATIONS,
  PRIORITY_RECOMMENDATIONS,
} from "./domain/constants.js";

// Domain questions (DIMENSIONS is derived from QUESTIONS)
export { QUESTIONS, DIMENSION_INFO, DIMENSIONS } from "./domain/questions.js";

// Domain functions
export { getInterpretation } from "./domain/interpretation.js";
export { getRecommendations } from "./domain/recommendation.js";
export { escapeHtml } from "./domain/utils.js";

// Domain assessment
export {
  DEFAULT_DATA,
  createAssessment,
  isValidAssessment,
  filterValidAssessments,
  validateAppData,
} from "./domain/assessment.js";

// Domain migration
export { migrateData, CURRENT_SCHEMA_VERSION } from "./domain/migration.js";

// Domain merge
export { mergeAssessments } from "./domain/merge.js";

// Infrastructure
export { LocalStorageRepository } from "./infrastructure/storage-repository.js";
