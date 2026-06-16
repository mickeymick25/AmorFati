// ========================================
// AmorFati — Interpretation Domain Module
// ========================================
// Maps a score (0-40) to an interpretation level.
// Pure function, no side effects.

import { INTERPRETATIONS } from "./constants.js";

/**
 * Returns the interpretation object for a given score (0-40).
 * Returns undefined if score is out of range.
 * @param {number} score
 * @returns {object|undefined}
 */
export function getInterpretation(score) {
  return INTERPRETATIONS.find((i) => score >= i.min && score <= i.max);
}
