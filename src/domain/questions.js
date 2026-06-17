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
 */
export const QUESTIONS = [
  // Dimension 1: Passé & Ressentiment
  {
    id: "q1",
    dimension: "Passé & Ressentiment",
    text: "Quand tu repenses à des événements difficiles de ton passé, que ressens-tu principalement ?",
    options: [
      {
        value: 0,
        label:
          "Une colère vive, un sentiment d'injustice qui me consume régulièrement",
      },
      {
        value: 1,
        label:
          "De l'amertume, je me dis souvent \"si seulement ça ne s'était pas passé\"",
      },
      {
        value: 2,
        label: "De la tristesse parfois, mais je n'y pense plus constamment",
      },
      {
        value: 3,
        label:
          "Une acceptation tranquille, c'est mon histoire et elle fait partie de moi",
      },
      {
        value: 4,
        label:
          "Une affirmation complète : je ne voudrais pas que ça n'ait pas existé",
      },
    ],
  },
  {
    id: "q2",
    dimension: "Passé & Ressentiment",
    text: "Face aux personnes qui t'ont fait du mal dans le passé, quelle est ton attitude ?",
    options: [
      {
        value: 0,
        label: "Je leur en veux profondément, j'imagine parfois me venger",
      },
      {
        value: 1,
        label:
          "Je leur en veux encore beaucoup, j'évite d'y penser car ça me met en colère",
      },
      {
        value: 2,
        label: "Je travaille à leur pardonner, mais c'est difficile",
      },
      {
        value: 3,
        label: "Je ne leur en veux plus vraiment, j'ai tourné la page",
      },
      {
        value: 4,
        label:
          "Je les accepte comme faisant partie de mon histoire, sans ressentiment ni besoin de pardon",
      },
    ],
  },

  // Dimension 2: Souffrance présente
  {
    id: "q3",
    dimension: "Souffrance présente",
    text: "Quand tu traverses une épreuve difficile (maladie, échec, perte), quelle est ta réaction dominante ?",
    options: [
      {
        value: 0,
        label: '"Pourquoi moi ? C\'est injuste !" - Je me sens victime',
      },
      {
        value: 1,
        label:
          '"Il faut que je transforme ça en quelque chose de positif pour que ça ait un sens"',
      },
      {
        value: 2,
        label:
          "\"C'est dur, mais ça fait partie de la vie, je vais m'en sortir\"",
      },
      {
        value: 3,
        label:
          "\"C'est une épreuve, je l'accepte et je vais la traverser avec dignité\"",
      },
      {
        value: 4,
        label:
          '"Cette souffrance fait partie de ma vie, je dis oui même à cela"',
      },
    ],
  },
  {
    id: "q4",
    dimension: "Souffrance présente",
    text: "Comment réagis-tu quand quelque chose échappe complètement à ton contrôle ?",
    options: [
      {
        value: 0,
        label: "Je m'énerve, je lutte contre la réalité, je refuse d'accepter",
      },
      {
        value: 1,
        label: "Je suis frustré mais je finis par me résigner à contrecœur",
      },
      {
        value: 2,
        label:
          "J'accepte relativement vite et je me concentre sur ce que je peux contrôler",
      },
      {
        value: 3,
        label:
          "J'accepte sereinement, je comprends que tout ne dépend pas de moi",
      },
      {
        value: 4,
        label: "J'accueille même cela comme faisant partie du flux de la vie",
      },
    ],
  },

  // Dimension 3: Authenticité
  {
    id: "q5",
    dimension: "Authenticité",
    text: "Concernant tes choix de vie importants (travail, relations, projets), tu dirais qu'ils sont :",
    options: [
      {
        value: 0,
        label:
          "Principalement dictés par les attentes des autres (famille, société)",
      },
      {
        value: 1,
        label:
          "Un mélange, mais j'ai du mal à distinguer ce qui vient vraiment de moi",
      },
      {
        value: 2,
        label:
          "Plutôt alignés avec mes valeurs, même si je fais parfois des compromis",
      },
      {
        value: 3,
        label:
          "Clairement alignés avec mes valeurs personnelles, j'assume mes choix",
      },
      {
        value: 4,
        label:
          "Je crée mes propres valeurs et vis selon elles, indépendamment du jugement",
      },
    ],
  },
  {
    id: "q6",
    dimension: "Authenticité",
    text: "Si tu devais être totalement honnête : acceptes-tu qui tu es vraiment (forces ET faiblesses) ?",
    options: [
      {
        value: 0,
        label: "Non, je me déteste ou je rejette des parties de moi-même",
      },
      {
        value: 1,
        label:
          "J'accepte mes forces mais je suis en lutte contre mes faiblesses",
      },
      {
        value: 2,
        label: "J'apprends à m'accepter, c'est un travail en cours",
      },
      {
        value: 3,
        label: "Oui, j'accepte qui je suis dans ma globalité",
      },
      {
        value: 4,
        label: "J'affirme totalement qui je suis, y compris mes parts d'ombre",
      },
    ],
  },

  // Dimension 4: Création
  {
    id: "q7",
    dimension: "Création",
    text: "Dans ta vie quotidienne, tu dirais que tu passes le plus de temps à :",
    options: [
      {
        value: 0,
        label: "Subir et me plaindre de ce qui m'arrive",
      },
      {
        value: 1,
        label: "Consommer (divertissements, réseaux sociaux, séries...)",
      },
      {
        value: 2,
        label: "Gérer mes obligations avec un peu de temps pour moi",
      },
      {
        value: 3,
        label: "Construire activement des projets qui me tiennent à cœur",
      },
      {
        value: 4,
        label:
          "Créer (art, pensée, relations, œuvres) avec passion et nécessité",
      },
    ],
  },
  {
    id: "q8",
    dimension: "Création",
    text: "Face à un échec ou une difficulté, tu as tendance à :",
    options: [
      {
        value: 0,
        label: "T'effondrer et abandonner, rester paralysé",
      },
      {
        value: 1,
        label: "Chercher qui blâmer (les autres, les circonstances, toi-même)",
      },
      {
        value: 2,
        label: "Prendre du recul, apprendre et réessayer",
      },
      {
        value: 3,
        label:
          "Utiliser l'échec comme matériau pour créer quelque chose de nouveau",
      },
      {
        value: 4,
        label:
          "L'accepter totalement et créer à partir de cette nouvelle réalité",
      },
    ],
  },

  // Dimension 5: Éternel Retour
  {
    id: "q9",
    dimension: "Éternel Retour",
    text: "Si tu devais revivre ta vie EXACTEMENT à l'identique (même joies, mêmes souffrances, mêmes erreurs), que répondrais-tu ?",
    options: [
      {
        value: 0,
        label: "Non, surtout pas ! Ma vie a trop de souffrance et d'échecs",
      },
      {
        value: 1,
        label: "Non, je voudrais changer beaucoup de choses",
      },
      {
        value: 2,
        label: "Peut-être... si je pouvais changer quelques événements clés",
      },
      {
        value: 3,
        label: "Probablement oui, même si certains moments ont été très durs",
      },
      {
        value: 4,
        label: "Oui, absolument, sans changer une seule chose",
      },
    ],
  },
  {
    id: "q10",
    dimension: "Éternel Retour",
    text: "Honnêtement, pourquoi accepterais-tu (ou pas) de revivre ta vie ?",
    options: [
      {
        value: 0,
        label: "Je ne l'accepterais pas, il y a eu trop de souffrance inutile",
      },
      {
        value: 1,
        label: 'Seulement si la souffrance m\'a "servi" à quelque chose',
      },
      {
        value: 2,
        label: "Parce que les bons moments compensent les mauvais",
      },
      {
        value: 3,
        label: "Parce que c'est ma vie, avec tout ce qu'elle comporte",
      },
      {
        value: 4,
        label:
          "Parce que j'affirme la totalité de l'existence, même le tragique",
      },
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
