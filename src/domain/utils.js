// ========================================
// AmorFati — Domain Utilities
// ========================================
// Pure utility functions shared across domain modules.

/**
 * Escapes HTML special characters to prevent XSS.
 * Returns empty string for non-string inputs.
 * @param {*} str - The value to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== "string") return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Returns a shuffled copy of the input array (Fisher-Yates).
 * Does not mutate the input.
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array
 */
export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
