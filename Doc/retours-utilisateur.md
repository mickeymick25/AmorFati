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
