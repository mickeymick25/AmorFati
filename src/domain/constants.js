// ========================================
// AmorFati — Domain Constants
// ========================================
// Business constants used across the application.
// Extracted from logic.js for DDD separation.

export const STORAGE_KEY = "amorFatiData";

export const PRIORITY_LABELS = {
  ressentiment: "priority.ressentiment.label",
  souffrance: "priority.souffrance.label",
  authenticite: "priority.authenticite.label",
  creation: "priority.creation.label",
  eternel: "priority.eternel.label",
  none: "priority.none.label",
};

export const PRIORITY_LABELS_FULL = {
  ressentiment: "priority.ressentiment.full",
  souffrance: "priority.souffrance.full",
  authenticite: "priority.authenticite.full",
  creation: "priority.creation.full",
  eternel: "priority.eternel.full",
  none: "priority.none.full",
};

// DIMENSIONS is now derived from QUESTIONS in questions.js
// and re-exported via logic.js for backward compatibility.

export const INTERPRETATIONS = [
  { index: 0, min: 0, max: 8 },
  { index: 1, min: 9, max: 16 },
  { index: 2, min: 17, max: 24 },
  { index: 3, min: 25, max: 32 },
  { index: 4, min: 33, max: 40 },
];

export const PRIORITY_RECOMMENDATIONS = {
  ressentiment: [0, 1, 2],
  souffrance: [0, 1, 2],
  authenticite: [0, 1, 2],
  creation: [0, 1, 2],
  eternel: [0, 1, 2],
  none: [0, 1],
};
