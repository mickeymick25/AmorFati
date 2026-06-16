// ========================================
// AmorFati — Domain Constants
// ========================================
// Business constants used across the application.
// Extracted from logic.js for DDD separation.

export const STORAGE_KEY = "amorFatiData";

export const PRIORITY_LABELS = {
  ressentiment: "🔥 Passé & Ressentiment",
  souffrance: "⚡ Souffrance présente",
  authenticite: "🎭 Authenticité",
  creation: "🎨 Création",
  eternel: "♾️ Éternel Retour",
  none: "🧭 Aucune priorité",
};

export const PRIORITY_LABELS_FULL = {
  ressentiment: "🔥 Passé & Ressentiment - Me libérer du poids de mon passé",
  souffrance:
    "⚡ Souffrance présente - Mieux accepter les difficultés actuelles",
  authenticite: "🎭 Authenticité - Vivre selon mes propres valeurs",
  creation: "🎨 Création - Devenir un créateur actif de ma vie",
  eternel: "♾️ Éternel Retour - Affirmer totalement ma vie",
  none: "🧭 Aucune priorité spécifique - Observer mon évolution globale",
};

export const DIMENSIONS = {
  "Passé & Ressentiment": ["q1", "q2"],
  "Souffrance présente": ["q3", "q4"],
  Authenticité: ["q5", "q6"],
  Création: ["q7", "q8"],
  "Éternel Retour": ["q9", "q10"],
};

export const INTERPRETATIONS = [
  {
    min: 0,
    max: 8,
    title: "🌑 Nihilisme & Ressentiment (0-8 points)",
    text: [
      "Tu es actuellement dans une phase de forte réactivité face à ta vie. Le ressentiment et le refus de ce qui est consomment beaucoup de ton énergie.",
      "C'est normal et humain. Beaucoup de gens passent par là. L'important est de reconnaître où tu en es pour pouvoir avancer.",
      "Commence par identifier une seule chose dans ta vie que tu pourrais accepter cette semaine, sans chercher à la justifier ou à la changer.",
    ],
  },
  {
    min: 9,
    max: 16,
    title: "🌘 Résignation & Lutte (9-16 points)",
    text: [
      "Tu oscilles entre acceptation forcée et lutte intérieure. Une partie de toi veut lâcher prise, une autre résiste encore.",
      "Cette phase de transition est courageuse. Tu commences à voir qu'il pourrait y avoir une autre façon de vivre.",
      "Concentre-toi sur les dimensions où ton score est le plus bas - c'est là que le travail sera le plus transformateur.",
    ],
  },
  {
    min: 17,
    max: 24,
    title: "🌗 Acceptation en Construction (17-24 points)",
    text: [
      "Tu es sur un bon chemin. Tu as déjà intégré certaines formes d'acceptation, même si ce n'est pas toujours facile.",
      "L'amor fati n'est pas encore pleinement vécu, mais tu en comprends déjà la logique et tu l'appliques par moments.",
      "Continue ce travail. Observe dans quelles situations tu retombes dans le ressentiment, et pourquoi.",
    ],
  },
  {
    min: 25,
    max: 32,
    title: "🌖 Affirmation Avancée (25-32 points)",
    text: [
      "Tu as atteint un niveau significatif d'amor fati. Tu acceptes une grande partie de ta vie sans chercher à la justifier.",
      "Il reste peut-être quelques zones de résistance - c'est normal. L'important est que tu créés activement plutôt que de réagir.",
      "Tu es probablement déjà une inspiration pour d'autres, même sans le savoir. Continue à approfondir.",
    ],
  },
  {
    min: 33,
    max: 40,
    title: "🌕 Amor Fati Accompli (33-40 points)",
    text: [
      "Tu incarnes l'amor fati à un niveau rare. Tu affirmes ta vie totalement, même dans ses aspects les plus difficiles.",
      "Attention à ne pas tomber dans l'orgueil ou la performance de 'l'homme fort'. Le vrai amor fati reste humble.",
      "Ta présence même peut aider les autres à voir qu'un autre rapport à la vie est possible. Partage ce que tu vis, sans prosélytisme.",
    ],
  },
];

export const PRIORITY_RECOMMENDATIONS = {
  ressentiment: [
    "Écris une lettre (que tu n'enverras pas) à quelqu'un qui t'a fait du mal. Puis brûle-la symboliquement.",
    "Pratique l'exercice : 'Et si cette personne avait fait exactement ce qu'elle devait faire pour que je devienne qui je suis ?'",
    "Journal : chaque soir, note un événement passé douloureux et écris : 'Je dis oui à cette partie de mon histoire.'",
  ],
  souffrance: [
    "Face à une difficulté cette semaine, demande-toi : 'Comment puis-je créer quelque chose à partir de cela ?'",
    "Pratique la distinction stoïcienne : liste ce qui dépend de toi vs ce qui n'en dépend pas.",
    "Méditation sur l'impermanence : tout passe, même cette souffrance. Peux-tu l'accepter le temps qu'elle dure ?",
  ],
  authenticite: [
    "Identifie une décision que tu prends par peur du jugement. Peux-tu faire autrement cette semaine ?",
    "Liste 5 valeurs qui te définissent vraiment. Tes choix de vie les reflètent-ils ?",
    "Exercice : pendant une journée, observe combien de fois tu te censures ou joues un rôle.",
  ],
  creation: [
    "Remplace une heure de consommation par une heure de création (peu importe quoi).",
    "Face à un problème, demande-toi : 'Que puis-je créer à partir de cette contrainte ?'",
    "Lance un micro-projet créatif cette semaine, sans attendre qu'il soit parfait.",
  ],
  eternel: [
    "Pratique l'exercice de l'éternel retour : visualise ta vie qui se répète. Qu'est-ce qui te fait dire non ? Pourquoi ?",
    "Liste 3 aspects de ta vie que tu voudrais revivre éternellement. Puis 3 que tu refuserais. Explore le pourquoi.",
    "Chaque soir : 'Voudrais-je revivre cette journée éternellement ?' Si non, qu'est-ce qui devrait changer ?",
  ],
  none: [
    "Observe simplement ton évolution sans te juger. Le chemin est aussi important que la destination.",
    "Concentre-toi sur ta dimension la plus faible (voir ci-dessus).",
  ],
};
