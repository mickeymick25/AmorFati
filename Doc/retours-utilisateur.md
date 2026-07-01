# Retours utilisateurs — AmorFati

> Journal cumulatif des retours utilisateurs et de leur analyse technique.
> Une entrée par message, chaque point étant analysé séparément (cause racine, faisabilité, impact, risques, plan d'implémentation).
> Les entrées analysées et implémentées sont migrées vers le brief `brief-handoff.md`.

---

## 2026-06-24 — Biais de rappel et visibilité des scores

**Source** : retour utilisateur (message direct)
**Thème** : réduction du biais de mesure lors des évaluations répétées
**Statut** : ✅ Implémenté (commit à venir, voir `Doc/suivi-p5.2-i18n.md` § P6)

### Résumé

Deux points complémentaires visant à limiter l'effet d'ancrage lors des évaluations répétées :

1. Les réponses précédentes restent visibles au démarrage d'une nouvelle évaluation → effet d'ancrage.
2. Le score par option + l'ordre croissant des options trahissent visuellement le résultat → perte de spontanéité.

---

### Point 1 — Réponses précédentes visibles dans le 2e test

#### Retour

> « Je vois mes premières réponses dans mon 2e test et je trouve ça assez biaisant. On est toujours un peu d'accord avec soi-même donc tendance à mettre la même chose ou à répondre en réaction ("ah non là j'ai fait des progrès quand même, je change de réponse") »

#### Analyse technique

##### Cause racine

`startAssessment()` (`src/ui/assessment.js` L11-23) ne réinitialise pas le formulaire avant d'afficher l'onglet Évaluation :

```js
export async function startAssessment() {
  const selectedPriority = document.querySelector(
    'input[name="priority"]:checked',
  );
  if (!selectedPriority) {
    /* ... */ return;
  }
  appState.data.priority = selectedPriority.value;
  saveData();
  switchTab("assessment"); // ← pas de reset du formulaire
}
```

Le formulaire est rendu **une seule fois** au `DOMContentLoaded` (`app.js` L57 → `renderAssessmentForm()`), puis n'est jamais re-rendu. `resetForm()` n'est appelé que par le bouton « Nouvelle évaluation » qui apparaît **dans les résultats** (`renderer.js` L121). Or ce bouton n'est visible qu'après avoir calculé un score.

##### Scénario de reproduction

1. Page d'accueil → « Commencer ma première évaluation » → `startAssessment()` → onglet Évaluation.
2. Répondre aux 10 questions → « Calculer mon score » → `calculateResults()` → `displayResults()` affiche les résultats **sous** le formulaire (le formulaire reste coché).
3. Naviguer vers l'onglet **Accueil** (ou rafraîchir la page sans recharger).
4. Cliquer à nouveau « Commencer ma première évaluation » → `startAssessment()` → onglet Évaluation : **le formulaire affiche encore les réponses du test précédent** et les résultats sont toujours présents.

L'utilisateur perçoit ses anciennes réponses comme point de départ, ce qui produit l'effet d'ancrage décrit.

##### Faisabilité

**Très élevée.** Correction localisée à `src/ui/assessment.js` (et un libellé dans `index.html`).

##### Impact

- Comportement : `startAssessment()` repartira d'un formulaire vierge à chaque appel.
- Données : aucun impact (les évaluations déjà sauvegardées dans `appState.data.assessments` ne sont pas touchées).
- Accessibilité : neutre (les radios sont reset, `aria-live` inchangé).
- Tests : `startAssessment` n'est couvert par aucun test (vérifié : `tests/ui/modal.test.js` est le seul fichier UI, et aucune référence à `startAssessment`/`renderAssessmentForm` n'existe). Il faudra ajouter un test TDD pour le nouveau comportement.

##### Risques

- **Faible.** Le seul cas où l'utilisateur pourrait vouloir revoir ses anciennes réponses est déjà couvert par `viewAssessmentDetails(index)` (clic sur une entrée d'historique → `displayResults`).
- **Edge case** : un utilisateur qui clique « Commencer ma première évaluation » alors qu'il est en train de remplir le formulaire perdrait sa saisie en cours. C'est acceptable (le bouton est sur l'onglet Accueil, pas sur l'Évaluation).

##### Plan d'implémentation

1. **TDD** : ajouter un test dans un nouveau `tests/ui/assessment.test.js` couvrant `startAssessment` :
   - Setup : `document.body` avec un formulaire déjà coché + `#results.show` + une priorité sélectionnée.
   - Assertion : après `startAssessment()`, plus aucun radio coché, `.option.selected` absent, `#results` sans `.show`.
2. **Code** : dans `startAssessment()`, appeler `resetForm()` **avant** `switchTab("assessment")` (après avoir validé la priorité).
3. **Bonus UX** : adapter le libellé du bouton d'accueil (`index.html` L209-211) selon `appState.data.assessments.length` :
   - `0` → « Commencer ma première évaluation »
   - `>0` → « Faire une nouvelle évaluation »
     Implémentation : fonction `updateWelcomeButtonLabel()` appelée dans `loadData()` et après `calculateResults()`.
4. **Validation** : `docker compose run --rm test` + `docker compose run --rm lint` + vérification visuelle.

##### Effort estimé

~45 min (test + code + libellé dynamique).

---

### Point 2 — Ne pas indiquer le nombre de points par réponse et les mettre dans le désordre

#### Retour

> « Pour permettre plus de spontanéité, je n'indiquerais pas le nombre de points par réponse et les mettrais dans le désordre. Même si on voit l'idée derrière chaque option, ça éviterait même visuellement de situer d'avance le résultat. »

#### Analyse technique

##### État actuel

Deux mécanismes trahissent visuellement le score attendu :

1. **Score-badge affiché** : `renderAssessmentForm()` (`src/ui/renderer.js` L42-49) injecte un `<span class="score-badge">` à côté de chaque label :

   ```js
   const scoreBadgeLabels = ["0 pt", "1 pt", "2 pts", "3 pts", "4 pts"];
   // ...
   html += `${escapeHtml(option.label)} <span class="score-badge">${scoreBadgeLabels[option.value]}</span>`;
   ```

   L'utilisateur voit explicitement la valeur de chaque option (0 pt → 4 pts).

2. **Ordre croissant des options** : dans `src/domain/questions.js`, chaque `question.options` est stocké trié par `value` croissante (0 → 4). Le rendu itère dans l'ordre (`for (const option of question.options)`), donc l'utilisateur voit de haut en bas la progression « le moins amor fati → le plus amor fati », ce qui permet de se situer d'avance sans lire finement chaque label.

##### Faisabilité

**Élevée.** Les deux changements sont localisés au rendu (`renderer.js`) et à un utilitaire de shuffle (`domain/utils.js`). Aucune impact sur le calcul du score (`calculateResults` lit `formData.get(q)` qui récupère la `value` du radio coché, peu importe l'ordre d'affichage).

##### Impact

- **Calcul** : neutre. La `value` du radio reste attachée à l'option, indépendante de sa position dans le DOM. `answers[q] = parseInt(formData.get(q))` (`assessment.js` L51-53) fonctionne identiquement.
- **Données / historique** : neutre. Seules les `answers` (values) sont stockées, pas l'ordre d'affichage.
- **Accessibilité** : neutre. Les radios restent groupés par `name` (un groupe ARIA implicite). L'ordre des options n'a pas de sémantique ARIA requise.
- **Tests** : aucun test existant sur `renderAssessmentForm` (vérifié). Il faudra en ajouter.
- **CSS** : la classe `.score-badge` (`styles.css` L320-328) devient inutilisée si on retire l'élément du DOM → à supprimer pour éviter le dead code, ou à conserver si on choisit l'option « cacher en CSS » (voir ci-dessous).

##### Risques

- **Shuffle déterministe vs aléatoire** :
  - Si on shuffle **une bonne fois pour toutes** (ordre statique permuté dans `QUESTIONS`), l'utilisateur régulier mémorisera l'ordre → le biais réapparaît après quelques tests.
  - Si on shuffle **runtime à chaque `startAssessment`**, l'ordre change à chaque évaluation → effet anti-ancrage maximal, mais peut surprendre un utilisateur qui s'attend à retrouver la même option au même endroit. C'est acceptable vu le but recherché.
- **Reproductibilité** : un même utilisateur qui relit le questionnaire (sans cocher) verra le même ordre pendant toute la session (le formulaire n'est re-rendu qu'au `startAssessment`). OK.
- **Couplage avec Point 1** : si on re-rend le formulaire à chaque `startAssessment` (pour appliquer le shuffle), on résout aussi le Point 1 naturellement (nouveau DOM vierge). Les deux points sont donc à implémenter **ensemble** pour plus de cohérence.

##### Décisions de design

- **Retrait du score-badge** : retirer l'élément `<span class="score-badge">` du HTML généré (plus propre que `display: none` en CSS). La `value` du radio reste pour le calcul.
- **Shuffle** : utiliser Fisher-Yates sur une **copie** de `question.options` (ne pas muter `QUESTIONS`, qui est la source de vérité partagée). Shuffle runtime à chaque `renderAssessmentForm()`.
  - Aléatoire via `Math.random()` (suffisant ici, pas besoin de PRNG seedé).
  - Implémenter `shuffle(array)` dans `src/domain/utils.js` (déjà présent pour `escapeHtml`).
- **Option conservatoire (à discuter)** : si on veut un compromis, on peut ne **retirer que le score-badge** sans shuffler (bénéfice partiel : l'ordre croissant reste, mais au moins la valeur numérique n'est plus affichée). Mon recommandation : faire les deux, l'utilisateur a explicitement demandé les deux et ils sont complémentaires.

##### Plan d'implémentation

1. **TDD** :
   - Ajouter `shuffle` dans `src/domain/utils.js` avec tests dans `tests/domain/utils.test.js` (Fisher-Yates : même éléments, même longueur, distribution non dégénérée).
   - Ajouter `tests/ui/renderer.test.js` couvrant `renderAssessmentForm` :
     - Pas de `.score-badge` dans le HTML rendu.
     - Toutes les options attendues sont présentes (par `value`), quel que soit l'ordre.
     - Le radio `value` correspond bien à l'option (mapping conservé après shuffle).
2. **Code** :
   - `src/domain/utils.js` : ajouter `export function shuffle(array)` (Fisher-Yates, retourne une copie mélangée).
   - `src/ui/renderer.js` : remplacer `for (const option of question.options)` par `for (const option of shuffle(question.options))`, et retirer la ligne `<span class="score-badge">...`.
   - Supprimer `.score-badge` de `styles.css` (L320-328) si plus utilisé nulle part (vérifier : grep `score-badge`).
3. **Re-rendu à chaque `startAssessment`** (couplage avec Point 1) : appeler `renderAssessmentForm()` dans `startAssessment()` au lieu de `resetForm()`. Cela régénère un formulaire vierge avec un nouvel ordre. Attention : `app.js` câble les handlers `.option` au `DOMContentLoaded` une seule fois (`app.js` L62-73). Si on re-rend le formulaire, les nouveaux `.option` n'auront pas de handler click.
   - **Solution** : déléguer le handler au `container` via event delegation, ou re-câbler les handlers après chaque `renderAssessmentForm`. La délégation est plus propre (un seul handler sur `#assessmentFormContainer` qui gère `e.target.closest('.option')`).
4. **Validation** : `docker compose run --rm test` + `docker compose run --rm lint` + vérification visuelle (ordres différents à chaque évaluation, pas de score visible, calcul du score correct).

##### Effort estimé

~1h30 (shuffle + retrait badge + délégation d'événements + tests + cleanup CSS).

---

## Synthèse et recommandation

| Point                 | Type            | Criticité  | Effort  | Risque | Recommandation                                                     |
| --------------------- | --------------- | ---------- | ------- | ------ | ------------------------------------------------------------------ |
| 1 — Réponses visibles | Bug UX          | 🟡 Moyenne | ~45 min | Faible | **À implémenter** (correction simple + bonus libellé dynamique)    |
| 2 — Score + ordre     | Amélioration UX | 🟡 Moyenne | ~1h30   | Faible | **À implémenter** (combiné avec Point 1 via re-rendu + délégation) |

**Recommandation** : implémenter les deux points **ensemble** dans une même phase (ex. « P6 — Biais d'évaluation ») car le Point 2 nécessite un re-rendu du formulaire à chaque évaluation, ce qui résout naturellement le Point 1. Effort cumulé estimé : ~2h (test + code + délégation d'événements + libellé dynamique + cleanup CSS + validation).

**Préfixe de commit suggéré** : `feat: P6 — reduce assessment bias (blank form on restart, hide scores, shuffle options)`

**Points d'attention pour l'implémentation** :

- Ne pas muter `QUESTIONS` (source de vérité partagée) : toujours shuffler une copie.
- Re-câbler ou déléguer les handlers `.option` après re-rendu du formulaire.
- Vérifier que `calculateResults` fonctionne toujours (les `value` des radios doivent être corrects après shuffle).
- Ajouter des tests TDD avant le code (projet déjà en TDD, 195 tests, 100% coverage sur `src/`).

---

## 2026-07-01 — Formulaire une question par écran (style Duolingo)

**Source** : retour utilisateur (message direct)
**Thème** : refonte de l'expérience du formulaire d'évaluation
**Statut** : ✅ Implémenté (P7, commit à venir)

### Retour

> « Aujourd'hui, le formulaire présente toutes les questions à la suite mais l'utilisateur aimerait que l'écran propose les questions les unes après les autres, une seule à la fois. Un peu à l'image de Duolingo. »

L'utilisateur souhaite passer d'un formulaire long (toutes les questions défilent verticalement) à une expérience séquencée : **une question par écran**, avec navigation pas-à-pas, à l'instar de l'app Duolingo (sélection d'une réponse → bouton « Suivant » → transition vers la question suivante, avec une barre de progression).

### Étude de faisabilité

#### État actuel

`renderAssessmentForm()` (`src/ui/renderer.js` L24-73) rend **en une fois** tout le formulaire dans `#assessmentFormContainer` :

- un `<form id="assessmentForm">` unique contenant les 5 dimensions × 2 questions = 10 questions
- chaque question est un `.question` avec ses 5 options (radios, ordre shufflé)
- à la fin : une `context-note` (textarea) + un bouton « Calculer mon score »
- `calculateResults()` (`src/ui/assessment.js`) lit `FormData(form)` pour récupérer toutes les réponses d'un coup
- navigation : scroll vertical dans la page, pas de pagination

#### Faisabilité

**Élevée.** Le changement est localisé au rendu du formulaire et à l'ajout d'une logique de navigation. `calculateResults` peut rester inchangé (approche A ci-dessous).

#### Approches possibles

**Option A — Pré-rendu + masquage CSS (recommandée)**

- `renderAssessmentForm()` rend toutes les questions comme aujourd'hui, mais enveloppe chaque question dans un `.question-screen` et n'en montre qu'une à la fois via une classe `.active`.
- Un état JS `currentQuestion` (0-9) gère la navigation (Suivant/Précédent).
- Ajout d'une barre de progression + boutons Précédent/Suivant en bas du formulaire.
- `calculateResults` **inchangé** : `FormData(form)` lit tout le formulaire y compris les radios cachés (les radios masqués via CSS restent dans le DOM et restent submittables).
- La `context-note` est placée sur un écran dédié (écran 11) après la 10ᵉ question, avant le bouton final « Voir mes résultats ».
- Avantages : changement minimal, préserve `FormData`, préserve le shuffle et la délégation d'événements existante, moins de risque de régression.

**Option B — Re-rendu à chaque question**

- `renderQuestion(index)` ne rend qu'une question à la fois ; les réponses sont stockées dans un objet JS ; `calculateResults` lit cet objet au lieu de `FormData`.
- Avantages : transitions plus fluides, contrôle total du DOM à chaque écran.
- Inconvénients : refactor plus profond de `calculateResults`, re-gestion de l'état des réponses, plus de risque de régression, complexité supérieure.

**Recommandation** : Option A (pré-rendu + masquage CSS). C'est l'approche la moins invasive, elle préserve tout le fonctionnement existant (FormData, shuffle, délégation d'événements) et se concentre sur l'expérience visuelle.

#### Architecture cible (Option A)

Nouveau module `src/ui/assessment-flow.js` (logique de navigation, pur UI) :

```js
// État de progression (module-scoped)
let currentQuestion = 0;
const totalQuestions = 10;

export function goToQuestion(index) {
  /* show/hide .question-screen, update progress, scroll top */
}
export function nextQuestion() {
  /* if currentQuestion < total → goToQuestion(current+1) */
}
export function prevQuestion() {
  /* if currentQuestion > 0 → goToQuestion(current-1) */
}
export function isLastQuestion() {
  /* currentQuestion === totalQuestions - 1 */
}
export function updateNextButtonState() {
  /* disable Suivant if no radio checked on current screen */
}
export function resetFlow() {
  currentQuestion = 0;
  goToQuestion(0);
}
```

`renderAssessmentForm()` (renderer.js) modifié :

- chaque question enveloppée dans `<div class="question-screen" data-index="N">` (seul le premier a `.active`)
- après les 10 questions : écran `<div class="question-screen" data-index="10">` pour la `context-note` + bouton final
- barre de progression en haut : `<div class="progress-bar"><div class="progress-fill"></div></div>` + indicateur `{{n}}/{{total}}`
- boutons bas : `<button class="btn btn-secondary" id="prevBtn">Précédent</button>` + `<button class="btn" id="nextBtn">Suivant</button>` (le dernier écran remplace Suivant par « Voir mes résultats » qui appelle `calculateResults()`)

`app.js` : la délégation d'événements existante sur `#assessmentFormContainer` est étendue pour gérer les clics sur `#nextBtn` / `#prevBtn` et la mise à jour de l'état du bouton Suivant quand une option est sélectionnée.

#### Impact

- **Calcul** : neutre. `calculateResults` lit `FormData(form)` qui contient tous les radios (masqués ou non). Inchangé.
- **Données / historique** : neutre. Les réponses sont stockées comme avant (clés `q1`-`q10`).
- **Shuffle** : préservé. Le shuffle s'applique toujours aux options de chaque question au moment du rendu.
- **i18n** : nouvelles clés à ajouter — `assessment.next`, `assessment.previous`, `assessment.seeResults`, `assessment.progress` (`{{n}}/{{total}}`), `assessment.contextScreenTitle` (titre de l'écran context-note).
- **Accessibilité** : points d'attention —
  - focus management : déplacer le focus sur la question courante à chaque changement (`tabindex="-1"` sur le `.question-screen` + `.focus()`).
  - `aria-live="polite` sur l'indicateur de progression pour annoncer le changement d'écran aux lecteurs d'écran.
  - les boutons Précédent/Suivant doivent être des `<button>` réels (navigables clavier).
  - le bouton Suivant désactivé tant qu'aucune option n'est sélectionnée → `aria-disabled` + `disabled`.
- **CSS** : nouvelles classes `.question-screen`, `.question-screen.active`, `.progress-bar`, `.progress-fill`, `.flow-buttons`. Doit intégrer le dark mode (variables sémantiques) et le mobile-first (déjà en place via P4.4). Transitions optionnelles (`transform: translateX` pour un effet slide Duolingo).
- **Tests** : nouveaux tests UI pour la navigation (`tests/ui/assessment-flow.test.js`) — goToQuestion, next/prev aux bornes, état du bouton Suivant selon sélection, calculateResults toujours fonctionnel après navigation.
- **PWA / SW** : neutre (pas de changement de cache, le HTML/JS est re-bundlé → hash change → bannière de mise à jour auto).

#### Risques

- **Faibles**. L'approche A préserve `FormData` et la délégation d'événements. Le risque principal est visuel (transitions, responsive) et accessibilité (focus management).
- **Edge cases** :
  - Re-rendu du formulaire (reset, changement de langue) doit réinitialiser `currentQuestion` à 0. `resetFlow()` sera appelé dans `resetForm()` et dans le handler `onLanguageChanged`.
  - Navigation au clavier (Tab) à travers les options de l'écran courant — les options des autres écrans sont `display: none` donc non-tabulables. OK.
  - La `context-note` sur l'écran 11 : son `<textarea>` reste dans le form, `calculateResults` lit sa valeur. Inchangé.
- **Accessibilité** : sans focus management explicite, un utilisateur au lecteur d'écran peut ne pas percevoir le changement d'écran. D'où l'importance du `aria-live` sur la progression et du `.focus()` sur la question courante.

#### Décisions de design à valider avec l'utilisateur

1. **Comportement du bouton Suivant** : désactivé tant qu'aucune option n'est sélectionnée (style Duolingo, guide l'utilisateur) **ou** toujours activé (l'utilisateur peut naviguer librement sans répondre) ? → Recommandation : **désactivé** (parallèle avec Duolingo, évite les évaluations incomplètes implicites).
2. **Bouton Précédent** : toujours visible **ou** masqué sur la première question ? → Recommandation : **masqué sur la 1ʳᵉ question** (plus propre visuellement).
3. **Sélection d'une option → passage auto à la suivante ?** Duolingo exige un clic explicite sur « Continuer ». → Recommandation : **clic explicite requis** sur « Suivant » (évite les misclics, permet de re-lire sa réponse).
4. **Context-note** : sur le dernier écran (écran 11, après la 10ᵉ question) **ou** écran séparé avant les résultats ? → Recommandation : **écran dédié 11** avec son propre titre (« Note de contexte ») puis bouton « Voir mes résultats ».
5. **Animation de transition** : slide horizontal style Duolingo (`transform: translateX`) **ou** fondu simple (`opacity`) **ou** aucune ? → Recommandation : **fondu simple** (propre, peu de risque, pas de dépendance à la direction du swipe).
6. **Indicateur de progression** : texte `{{n}}/{{total}}` **ou** barre visuelle **ou** les deux ? → Recommandation : **les deux** (barre visuelle + texte aria-live pour l'accessibilité).

#### Plan d'implémentation (TDD)

| #        | Tâche                                                                                                                                       | Fichiers                                         | Effort |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------ |
| **P7.1** | `src/ui/assessment-flow.js` (navigation) + `renderAssessmentForm` refactor en `.question-screen` + tests `tests/ui/assessment-flow.test.js` | renderer.js, assessment-flow.js (nouveau), tests | ~1h    |
| **P7.2** | CSS des écrans + barre de progression + boutons (mobile-first, dark mode, transition fondu)                                                 | styles.css                                       | ~45min |
| **P7.3** | i18n : clés `assessment.next/previous/seeResults/progress/contextScreenTitle` (FR + EN)                                                     | fr.json, en.json                                 | ~15min |
| **P7.4** | Validation bouton Suivant + accessibilité (focus management, aria-live, Précédent masqué sur 1ʳᵉ question) + délégation events dans app.js  | assessment-flow.js, app.js                       | ~30min |
| **P7.5** | Validation finale : lint, tests, build, vérif visuelle                                                                                      | —                                                | ~15min |

Effort total estimé : **~2h30–3h** selon le niveau de polish (transitions, animations).

#### Synthèse et recommandation

| Critère              | Évaluation                                                                  |
| -------------------- | --------------------------------------------------------------------------- |
| Faisabilité          | Élevée — changement localisé au rendu du formulaire                         |
| Risque de régression | Faible — approche A préserve `FormData` et la délégation d'événements       |
| Bénéfice UX          | Élevé — expérience plus engageante, moins intimidante, meilleure sur mobile |
| Effort               | ~2h30–3h (5 sous-tâches TDD)                                                |
| Recommandation       | **À implémenter** (P7 — Formulaire séquencé)                                |

**Préfixe de commit suggéré** : `feat: P7 — one-question-per-screen assessment (Duolingo-style flow)`

**Points d'attention** :

- Réinitialiser `currentQuestion` à 0 dans `resetForm()` et sur `onLanguageChanged`.
- Gérer le focus sur la question courante (accessibilité).
- Préserver `calculateResults` inchangé (FormData lit les radios masqués).
- Le `context-note` reste dans le `<form>` (valeur lue par `FormData`).
- Tests TDD avant code (projet déjà en TDD, 228 tests, 100% coverage sur `src/`).
