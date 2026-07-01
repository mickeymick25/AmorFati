// ========================================
// AmorFati — Interpretation Domain Module
// ========================================
// Maps a score (0-40) to an interpretation level.
// Pure function, no side effects.

import { INTERPRETATIONS } from "./constants.js";

/**
 * Returns the interpretation entry for a given score (0-40).
 * The returned object carries only the index; text is resolved via i18n
 * (keys: interpretation.{index}.title / .text0 / .text1 / .text2).
 * Returns undefined if score is out of range.
 * @param {number} score
 * @returns {object|undefined} { index, min, max }
 */
export function getInterpretation(score) {
  const found = INTERPRETATIONS.find((i) => score >= i.min && score <= i.max);
  if (!found) return undefined;
  return { index: found.index, min: found.min, max: found.max };
}
