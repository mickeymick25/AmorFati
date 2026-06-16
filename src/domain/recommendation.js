// ========================================
// AmorFati — Recommendation Domain Module
// ========================================
// Generates recommendations based on dimension scores and priority.
// Pure function, no side effects.

import { PRIORITY_RECOMMENDATIONS } from "./constants.js";

/**
 * Returns an array of recommendation strings based on dimension scores and priority.
 * Limits to 5 recommendations maximum.
 * @param {object} dimensionScores - Scores per dimension
 * @param {string} priority - Priority key (e.g. "ressentiment", "souffrance")
 * @returns {string[]} Array of recommendation strings
 */
export function getRecommendations(dimensionScores, priority) {
  const recommendations = [];

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
    recommendations.push(...PRIORITY_RECOMMENDATIONS[priority]);
  }

  // Lowest dimension recommendation
  if (lowestDimension && lowestScore < 4) {
    recommendations.push(
      `<strong>Focus sur "${lowestDimension}"</strong> : C'est ta dimension la plus faible (${lowestScore}/8). C'est là que le travail aura le plus d'impact.`,
    );
  }

  // General recommendation for low creation score
  if (dimensionScores["Création"] < 4) {
    recommendations.push(
      "Tu sembles plus dans la réaction que dans la création. Commence par 15 minutes de création par jour.",
    );
  }

  return recommendations.slice(0, 5);
}
