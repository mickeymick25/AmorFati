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
