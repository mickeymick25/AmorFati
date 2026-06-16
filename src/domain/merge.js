// ========================================
// AmorFati — Assessment Merge Logic (Domain)
// ========================================
// Pure function for merging assessment arrays.
// Deduplicates by date+totalScore, keeps existing on conflict,
// sorts by date (most recent first).

/**
 * Merge two assessment arrays, deduplicating by date+totalScore.
 * On conflict (same date AND same totalScore), the existing entry is kept.
 * Results are sorted by date descending (most recent first).
 * Does not mutate either input array.
 *
 * @param {Array} existing - Current assessments
 * @param {Array} incoming - Assessments being imported
 * @returns {Array} Merged and sorted array
 */
export function mergeAssessments(existing, incoming) {
  if (!Array.isArray(existing)) existing = [];
  if (!Array.isArray(incoming)) incoming = [];

  const existingKeys = new Set(
    existing.map((a) => `${a.date}::${a.totalScore}`),
  );

  const merged = [...existing];

  for (const a of incoming) {
    const key = `${a.date}::${a.totalScore}`;
    if (!existingKeys.has(key)) {
      merged.push(a);
      existingKeys.add(key);
    }
  }

  merged.sort((a, b) => new Date(b.date) - new Date(a.date));

  return merged;
}
