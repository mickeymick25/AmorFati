// ========================================
// AmorFati — Recommendation Domain Module
// ========================================
// Generates recommendations based on dimension scores and priority.
// Pure function, no side effects.

import { PRIORITY_RECOMMENDATIONS } from "./constants.js";

/**
 * Returns an array of recommendation i18n keys based on dimension scores and priority.
 * The caller resolves the keys via i18next.t().
 * Limits to 5 recommendations maximum.
 * @param {object} dimensionScores - Scores per dimension
 * @param {string} priority - Priority key (e.g. "ressentiment", "souffrance")
 * @returns {string[]} Array of i18n keys
 */
export function getRecommendations(dimensionScores, priority) {
  const keys = [];

  // Find lowest dimension
  let lowestDimension = null;
  let lowestScore = 8;

  for (const [dimension, score] of Object.entries(dimensionScores)) {
    if (score < lowestScore) {
      lowestScore = score;
      lowestDimension = dimension;
    }
  }

  // Priority-based recommendations
  if (priority && PRIORITY_RECOMMENDATIONS[priority]) {
    for (const idx of PRIORITY_RECOMMENDATIONS[priority]) {
      keys.push(`recommendation.${priority}.${idx}`);
    }
  }

  // Lowest dimension recommendation (dynamic text, returned as a marker key)
  if (lowestDimension && lowestScore < 4) {
    keys.push(`__focus__${lowestDimension}__${lowestScore}__`);
  }

  return keys.slice(0, 5);
}
