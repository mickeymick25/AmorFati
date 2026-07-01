// ========================================
// AmorFati — Question Data
// ========================================
// Single source of truth for assessment questions and dimension metadata.
// The DIMENSIONS mapping is derived from QUESTIONS to avoid duplication.

/**
 * Dimension metadata with display titles, descriptions, and ordering.
 */
export const DIMENSION_INFO = [
  {
    name: "Passé & Ressentiment",
    title: "1. Rapport au passé & Ressentiment",
    description:
      "Comment te situes-tu face à ton histoire personnelle et aux événements difficiles que tu as vécus ?",
    order: 1,
  },
  {
    name: "Souffrance présente",
    title: "2. Attitude face à la souffrance présente",
    description:
      "Comment réagis-tu face aux difficultés et souffrances actuelles de ta vie ?",
    order: 2,
  },
  {
    name: "Authenticité",
    title: "3. Rapport à soi-même & Authenticité",
    description:
      "Dans quelle mesure vis-tu selon tes propres valeurs plutôt que selon les attentes extérieures ?",
    order: 3,
  },
  {
    name: "Création",
    title: "4. Création vs Réaction",
    description:
      "Es-tu un créateur actif de ta vie ou réagis-tu principalement aux circonstances ?",
    order: 4,
  },
  {
    name: "Éternel Retour",
    title: "5. Le test de l'Éternel Retour",
    description:
      "La question ultime de Nietzsche : voudrais-tu revivre ta vie exactement comme elle a été ?",
    order: 5,
  },
];

/**
 * Assessment questions, each belonging to a dimension.
 * Option values range from 0 (lowest amor fati) to 4 (highest).
 * Text labels live in i18n dictionaries (keys: {questionId}.text, {questionId}.opt{value}).
 */
export const QUESTIONS = [
  // Dimension 1: Passé & Ressentiment
  {
    id: "q1",
    dimension: "Passé & Ressentiment",
    options: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ],
  },
  {
    id: "q2",
    dimension: "Passé & Ressentiment",
    options: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ],
  },

  // Dimension 2: Souffrance présente
  {
    id: "q3",
    dimension: "Souffrance présente",
    options: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ],
  },
  {
    id: "q4",
    dimension: "Souffrance présente",
    options: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ],
  },

  // Dimension 3: Authenticité
  {
    id: "q5",
    dimension: "Authenticité",
    options: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ],
  },
  {
    id: "q6",
    dimension: "Authenticité",
    options: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ],
  },

  // Dimension 4: Création
  {
    id: "q7",
    dimension: "Création",
    options: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ],
  },
  {
    id: "q8",
    dimension: "Création",
    options: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ],
  },

  // Dimension 5: Éternel Retour
  {
    id: "q9",
    dimension: "Éternel Retour",
    options: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ],
  },
  {
    id: "q10",
    dimension: "Éternel Retour",
    options: [
      { value: 0 },
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
    ],
  },
];

/**
 * Derived dimension-to-question mapping.
 * Built from QUESTIONS so it stays in sync automatically.
 */
export const DIMENSIONS = DIMENSION_INFO.reduce((acc, dim) => {
  acc[dim.name] = QUESTIONS.filter((q) => q.dimension === dim.name).map(
    (q) => q.id,
  );
  return acc;
}, {});
