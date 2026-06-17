# Analyse d'impact — TDD & DDD sur AmorFati

> Date : 2026-06-16  
> Contexte : Évaluation de l'impact de l'adoption du TDD et du DDD comme pratiques méthodologiques.

> **✅ STATUT — Plan P2 entièrement implémenté**  
> Cette analyse a servi de base au plan P2, qui est désormais **complet**. Le document ci-dessous est conservé comme référence historique.
>
> **Ce qui a été implémenté (P2 — terminé) :**
> - Création de `src/infrastructure/storage-repository.js` — classe LocalStorageRepository
> - Ajout de `@vitest/coverage-v8` + seuil 80 % sur `src/` (atteint : 100 % statements/functions/lines, ~100 % branches)
> - Tests TDD pour l'assessment (42 → 46 tests)
> - Extraction de `src/domain/assessment.js`, `constants.js`, `interpretation.js`, `recommendation.js`
> - Extraction de `src/domain/questions.js` (QUESTIONS, DIMENSION_INFO, DIMENSIONS dérivés)
> - Extraction de `src/domain/migration.js` (migrateData, CURRENT_SCHEMA_VERSION)
> - Extraction de `src/domain/merge.js` (mergeAssessments)
> - Extraction de `src/domain/utils.js` (escapeHtml)
> - Transformation de `src/logic.js` en barrel re-export
> - Refactor de `app.js` pour utiliser les nouveaux modules + LocalStorageRepository
> - Extraction de `src/ui/modal.js` + 31 tests UI
> - Configuration de Husky + lint-staged
> - Création de CONTRIBUTING.md
>
> **Couverture de tests actuelle :** 195 tests sur 9 fichiers, 100 % statements/functions/lines sur `src/`
>
> **L'architecture actuelle correspond à l'architecture proposée en Section 3.1**, avec les différences suivantes :
> - `dimension.js` et `score.js` ont été fusionnés dans `questions.js` (DIMENSION_INFO + DIMENSIONS dérivés de QUESTIONS)
> - `utils.js` contient `escapeHtml` (gardé minimal, comme recommandé)
- `app.js` a été découpé en 7 modules UI lors de P5.5 :
>   - `src/ui/state.js` (appState partagé, storage, saveData, loadData)
>   - `src/ui/renderer.js` (rendu DOM)
>   - `src/ui/tabs.js` (navigation par onglets)
>   - `src/ui/assessment.js` (flux d'assessment)
>   - `src/ui/data.js` (export/import/delete)
>   - `src/ui/priority.js` (sélecteur de priorité)
>   - `src/ui/pwa.js` (installation PWA + enregistrement SW)

---

## 1. État actuel — Cartographie du code

| Fichier | Lignes | Rôle | Testé ? |
|---------|--------|------|---------|
| `src/logic.js` | 188 | Fonctions pures + constantes | ✅ 38 tests |
| `app.js` | 948 | UI + modales + données + DOM | ❌ 0 tests |
| `index.html` | 811 | Structure HTML + onglets ARIA | ❌ |
| `styles.css` | 854 | Styles | ❌ |
| `service-worker.js` | 147 | Cache offline | ❌ |
| `tests/logic.test.js` | 271 | Tests du domaine | — |
| `tests/environment.test.js` | 19 | Tests environnement | — |

### Analyse de `app.js` — Répartition des responsabilités

`app.js` mélange **5 catégories de logique** qui relèvent de couches différentes :

| Catégorie | Fonctions | Lignes approx. | Testable sans DOM ? |
|-----------|-----------|----------------|---------------------|
| **Domaine pur** | `isValidAssessment`, `DEFAULT_DATA`, calculs de scores (déjà dans `logic.js`) | ~190 | ✅ Oui |
| **Modales** | `openModal`, `closeModal`, `showAlert`, `showConfirm`, `showDangerConfirm`, `showPrioritySelector` | ~170 | ⚠️ Partiel (DOM) |
| **Rendu HTML** | `displayResults`, `getEvolutionComparison`, `displayHistory`, `createChart`, `displaySettings` | ~220 | ⚠️ Partiel (DOM) |
| **Données** | `saveData`, `loadData`, `exportData`, `importData`, `deleteAllData` | ~120 | ⚠️ Partiel (localStorage) |
| **Navigation** | `switchTab`, `handleTabKeydown`, `resetForm` | ~50 | ❌ DOM uniquement |

### Dépendances croisées dans `app.js`

```
app.js
├── Importe de src/logic.js (domaine pur)
├── Utilise localStorage directement (infrastructure)
├── Utilise document.* directement (DOM)
├── Utilise window.* directement (module scope)
└── Génère du HTML en template strings (rendu)
```

**Problème clé** : `app.js` est un monolithe de 948 lignes qui mélange domaine, infrastructure et présentation. Cela rend le test unitaire difficile car chaque fonction dépend du DOM ou de localStorage.

---

## 2. Impact du TDD

### 2.1 Ce que le TDD change concrètement

**Avant TDD** : On écrit du code, puis on ajoute des tests (ou pas).

**Avec TDD** : On écrit un test qui échoue (Red), on écrit le minimum de code pour le faire passer (Green), on refactor (Refactor).

### 2.2 Couverture de tests actuelle vs. nécessaire

| Module | Tests actuels | Tests nécessaires | Difficulté |
|--------|--------------|-------------------|------------|
| `src/logic.js` | 38 tests ✅ | Maintenir | Faible — déjà couvert |
| `isValidAssessment()` | 0 ❌ | ~5 tests | Faible — fonction pure |
| `loadData()` validation | 0 ❌ | ~8 tests | Moyen — mock localStorage |
| `DEFAULT_DATA` | 0 ❌ | ~2 tests | Faible — constante |
| Modales (`showAlert`, etc.) | 0 ❌ | ~6 tests | Élevé — DOM + Promesses |
| `displayResults` | 0 ❌ | ~3 tests | Élevé — DOM + innerHTML |
| `calculateResults` | 0 ❌ | ~3 tests | Élevé — FormData + DOM |
| `switchTab` | 0 ❌ | ~2 tests | Élevé — DOM |

### 2.3 Investissement nécessaire

| Action | Effort | Impact |
|--------|--------|--------|
| Ajouter `@vitest/coverage-v8` | 15 min | Couverture mesurable |
| Configurer seuil de couverture (80% sur `src/`) | 10 min | Check CI |
| Tester `isValidAssessment` et `loadData` | 1-2h | 13 tests, couverture domaine |
| Tester les modales avec jsdom | 2-3h | 6 tests, couverture UX critique |
| Tester le rendu HTML avec jsdom | 2-3h | 8 tests, couverture affichage |
| Ajouter `@testing-library/dom` | 30 min | Meilleure ergonomie de test DOM |
| Configurer pre-commit hook (husky + lint-staged) | 30 min | Automatisation TDD |
| Écrire un CONTRIBUTING.md | 30 min | Documentation |

### 2.4 Risques et mitigation

| Risque | Mitigation |
|--------|-----------|
| Les tests DOM sont fragiles (sélecteurs CSS) | Utiliser `@testing-library/dom` (sélection par rôle/texte) |
| Couverture ≠ qualité | Privilégier les tests de comportement sur les tests d'implémentation |
| TDD ralentit le développement court terme | Le gain est à long terme : moins de bugs de régression |
| Les tests de modales impliquent des Promesses | Utiliser `vi.fn()` et `await` systématiquement |

### 2.5 Recommandation TDD

**Priorité 1** — Tester les fonctions pures et les données (domaine) : `isValidAssessment`, `loadData` validation, `DEFAULT_DATA`. Ces tests ne nécessitent pas de mock DOM et ont le meilleur rapport investissement/qualité.

**Priorité 2** — Tester les modales et la navigation. Nécessite un setup jsdom + `@testing-library/dom`.

**Priorité 3** — Tester le rendu HTML (`displayResults`, `displayHistory`). Fragile mais utile pour la régression.

**Ne pas tester** — Les fonctions de pure infrastructure (`exportData` avec Blob/URL, `serviceWorker.register`). Le rapport investissement/qualité est trop faible.

---

## 3. Impact du DDD

### 3.1 Architecture proposée

```
src/
├── domain/
│   ├── assessment.js      # Entité Assessment (factory, validation)
│   ├── dimension.js       # Value object Dimension (nom, questions, scoreMax)
│   ├── score.js           # Value object Score (calcul, interprétation)
│   ├── recommendation.js  # Logique de recommandation
│   ├── interpretation.js  # Mapping score → interprétation
│   └── constants.js       # PRIORITY_LABELS, DIMENSIONS, etc.
├── infrastructure/
│   └── storage-repository.js  # Interface + implémentation localStorage
├── logic.js               # ⬅️ Barrel re-export (backward compat)
└── ...
app.js                     # UI orchestration only
```

### 3.2 Ce que chaque module contient

#### `src/domain/assessment.js`
```js
// Actuellement dans app.js (loadData, isValidAssessment, DEFAULT_DATA)
export const DEFAULT_DATA = { priority: null, assessments: [], settings: { lastAssessment: null } };
export function createAssessment({ date, totalScore, dimensionScores, answers, context, priority }) { ... }
export function isValidAssessment(a) { ... }
export function filterValidAssessments(assessments) { ... }
```

#### `src/domain/score.js`
```js
// Actuellement dans logic.js (getInterpretation)
export function calculateTotalScore(answers, dimensions) { ... }
export function calculateDimensionScores(answers, dimensions) { ... }
```

#### `src/domain/recommendation.js`
```js
// Actuellement dans logic.js (getRecommendations, PRIORITY_RECOMMENDATIONS)
export function getRecommendations(dimensionScores, priority) { ... }
```

#### `src/domain/interpretation.js`
```js
// Actuellement dans logic.js (INTERPRETATIONS, getInterpretation)
export function getInterpretation(score) { ... }
```

#### `src/domain/dimension.js`
```js
// Actuellement dans logic.js (DIMENSIONS)
export const DIMENSIONS = { ... };
export function getDimensionNames() { ... }
export function getQuestionsForDimension(dimension) { ... }
```

#### `src/infrastructure/storage-repository.js`
```js
// Actuellement dans app.js (saveData, loadData, STORAGE_KEY)
export class LocalStorageRepository {
  constructor(key = 'amorFatiData') { ... }
  save(data) { ... }
  load() { ... }
  delete() { ... }
  exportJSON(data) { ... }
  importJSON(jsonString) { ... }
}
```

### 3.3 Impact sur `src/logic.js`

`src/logic.js` devient un **barrel file** qui re-exporte depuis les modules de domaine :

```js
// src/logic.js — Barrel re-export (backward compatibility)
export { STORAGE_KEY, PRIORITY_LABELS, PRIORITY_LABELS_FULL, DIMENSIONS, INTERPRETATIONS, PRIORITY_RECOMMENDATIONS } from './domain/constants.js';
export { getInterpretation } from './domain/interpretation.js';
export { getRecommendations } from './domain/recommendation.js';
export { escapeHtml } from './domain/utils.js';
```

**Impact** : `app.js` et `tests/logic.test.js` continuent d'importer depuis `./src/logic.js`. Aucun import à changer. Migration transparente.

### 3.4 Impact sur `app.js`

`app.js` passe de **948 lignes** à environ **700 lignes** (les fonctions de domaine et de données migrent vers les modules). Il devient un orchestrateur UI :

```
app.js (orchestrateur)
├── Importe depuis src/domain/* (logique métier)
├── Importe depuis src/infrastructure/* (persistance)
├── Modal system (reste ici — c'est du UI)
├── Event handlers (reste ici — c'est du UI)
├── HTML rendering (reste ici — c'est du UI)
└── Service Worker registration (reste ici)
```

### 3.5 Investissement nécessaire

| Action | Effort | Impact |
|--------|--------|--------|
| Créer `src/domain/` avec 5 modules | 2-3h | Séparation claire du domaine |
| Créer `src/infrastructure/storage-repository.js` | 1h | Abstraction de localStorage |
| Transformer `logic.js` en barrel re-export | 30 min | Backward compat |
| Migrer les tests vers les nouveaux modules | 1-2h | Tests par domaine |
| Refactor `app.js` pour utiliser les nouveaux modules | 1-2h | Code plus lisible |
| Créer `CONTRIBUTING.md` avec architecture DDD | 30 min | Documentation |

### 3.6 Risques et mitigation

| Risque | Mitigation |
|--------|-----------|
| Sur-ingénierie pour une petite PWA | Commencer par la couche Repository (le plus utile), les modules domaine en second |
| Duplication temporaire pendant la migration | Garder `logic.js` comme barrel jusqu'à ce que tous les imports soient migrés |
| Trop de fichiers pour un petit projet | Limiter à 3-4 modules domaine au lieu de 5-6 si certains sont trop petits |
| Les modules domaine finissent par ressembler à `logic.js` découpé | C'est le but — mais chaque module a une responsabilité unique et testable |

### 3.7 Recommandation DDD

**Phase 1 (priorité haute)** — Créer `src/infrastructure/storage-repository.js`. C'est le plus gros gain : séparer `app.js` de `localStorage` permet de tester la gestion des données sans mock.

**Phase 2 (priorité haute)** — Extraire `assessment.js` et `constants.js`. Ce sont les modules les plus testables et les plus réutilisables.

**Phase 3 (priorité moyenne)** — Extraire `score.js`, `recommendation.js`, `interpretation.js`. Ce sont des refactorings plus fins qui découpent `logic.js`.

**Ne pas faire** — Créer des modules pour des choses qui n'ont qu'une seule fonction (ex: `escapeHtml` dans `utils.js`). Garder les petits utilitaires dans un module `utils.js` commun.

---

## 4. Impact combiné TDD + DDD

### 4.1 Synergie

Le DDD et le TDD se renforcent mutuellement :

```
DDD (structure)        →  Domaine pur, testable sans DOM
TDD (discipline)       →  Chaque fonction domaine a des tests avant l'implémentation
Résultat combiné       →  Couverture élevée sur le domaine, confiance dans les refactorings
```

**Sans DDD** : TDD est difficile car il faut mocker le DOM et localStorage pour tester `app.js`.

**Sans TDD** : DDD crée des modules mais sans garantie qu'ils fonctionnent correctement.

**Avec les deux** : Chaque module domaine est pur (pas de DOM, pas de localStorage) et testé indépendamment. `app.js` devient un orchestrateur fin qui ne fait que connecter le domaine à l'UI.

### 4.2 Ordre de mise en œuvre recommandé

```
1. Storage Repository (DDD)     →  Permet de tester loadData/saveData sans mock localStorage
2. isValidAssessment (TDD)       →  Tests de la validation des données
3. assessment.js (DDD)           →  Extraction du domaine Assessment
4. Tests de assessment.js (TDD)  →  Couverture du domaine
5. constants.js (DDD)            →  Extraction des constantes
6. score.js + recommendation.js  →  Extraction progressive
7. logic.js → barrel re-export   →  Migration transparente
8. Tests modales (TDD)           →  Couverture UX
9. CONTRIBUTING.md               →  Documentation du workflow
```

### 4.3 Ce que ça change concrètement pour le développeur

| Action | Avant | Après |
|--------|-------|-------|
| Ajouter une question | Modifier `DIMENSIONS` dans `logic.js` | Modifier `dimension.js` + test en TDD |
| Ajouter une interprétation | Modifier `INTERPRETATIONS` dans `logic.js` | Modifier `interpretation.js` + test en TDD |
| Changer le stockage | Modifier `saveData`/`loadData` dans `app.js` | Créer une nouvelle implémentation de `StorageRepository` |
| Ajouter une modale | Ajouter du code dans `app.js` | Ajouter du code dans `app.js` (pas de changement) |
| Corriger un bug de calcul | Modifier `logic.js` | Modifier le module domaine + vérifier que le test passe |

### 4.4 Ce qui NE change PAS

- L'UI (HTML, CSS) n'est pas affectée par DDD
- L'expérience utilisateur reste identique
- Le build Vite, le CI, le service worker ne changent pas
- Les 41 tests existants continuent de passer

---

## 5. Conclusion

| Pratique | Investissement | Gain principal | Risque |
|----------|----------------|---------------|--------|
| **TDD** | ~8h (tests domaine + modales + setup) | Confiance dans les refactorings, moins de bugs de régression | Tests DOM fragiles |
| **DDD** | ~5-6h (extraction modules + Repository) | Séparation domain/infrastructure, testabilité, maintenabilité | Sur-ingénierie possible |
| **TDD + DDD** | ~10-12h (les deux se renforcent) | Architecture propre, haute couverture, évolutivité | Complexité initiale |

**Recommandation** : Commencer par le **Storage Repository** (DDD, ~1h) puis les **tests de `isValidAssessment` et `loadData`** (TDD, ~2h). Ces deux étapes apportent le meilleur rapport investissement/qualité et préparent le terrain pour la suite.