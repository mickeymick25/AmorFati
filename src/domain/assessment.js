// ========================================
// AmorFati — Assessment Entity (Domain)
// ========================================
// Pure domain logic for creating, validating, and filtering assessments.
// No DOM, no localStorage, no side effects.

/**
 * Default application data structure.
 */
export const DEFAULT_DATA = {
  priority: null,
  assessments: [],
  settings: { lastAssessment: null },
};

/**
 * Create a new assessment object.
 * @param {object} params
 * @param {string} params.date - ISO date string
 * @param {number} params.totalScore - Total score (0-40)
 * @param {object} params.dimensionScores - Scores per dimension
 * @param {object} params.answers - Raw answers
 * @param {string} [params.context] - Optional user context/note
 * @param {string} [params.priority] - Optional priority key
 * @returns {object} Assessment object
 */
export function createAssessment({
  date,
  totalScore,
  dimensionScores,
  answers,
  context = "",
  priority = null,
}) {
  return {
    date,
    totalScore,
    dimensionScores,
    answers,
    context,
    priority,
  };
}

/**
 * Validate whether an object is a well-formed assessment.
 * Checks for required fields and their types.
 * @param {*} a - The value to validate
 * @returns {boolean} True if the value is a valid assessment
 */
export function isValidAssessment(a) {
  return (
    a !== null &&
    typeof a === "object" &&
    !Array.isArray(a) &&
    typeof a.date === "string" &&
    typeof a.totalScore === "number" &&
    typeof a.dimensionScores === "object" &&
    a.dimensionScores !== null &&
    !Array.isArray(a.dimensionScores)
  );
}

/**
 * Filter an array, keeping only valid assessments.
 * @param {Array} assessments - Array of objects to filter
 * @returns {Array} Array containing only valid assessments
 */
export function filterValidAssessments(assessments) {
  if (!Array.isArray(assessments)) return [];
  return assessments.filter(isValidAssessment);
}

/**
 * Validate the root data structure loaded from storage.
 * Returns a normalized data object or a clone of DEFAULT_DATA
 * if the structure is invalid.
 * @param {*} parsed - The parsed data to validate
 * @returns {object} Validated data object
 */
export function validateAppData(parsed) {
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return structuredClone(DEFAULT_DATA);
  }

  if (!Array.isArray(parsed.assessments)) {
    return structuredClone(DEFAULT_DATA);
  }

  if (parsed.priority !== null && typeof parsed.priority !== "string") {
    return structuredClone(DEFAULT_DATA);
  }

  if (
    typeof parsed.settings !== "object" ||
    parsed.settings === null ||
    Array.isArray(parsed.settings) ||
    (parsed.settings.lastAssessment !== null &&
      typeof parsed.settings.lastAssessment !== "string")
  ) {
    return structuredClone(DEFAULT_DATA);
  }

  const validAssessments = filterValidAssessments(parsed.assessments);

  return {
    priority: parsed.priority,
    assessments: validAssessments,
    settings: parsed.settings,
  };
}
