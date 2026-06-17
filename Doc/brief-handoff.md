# Brief — Handoff pour le prochain thread

> Date : 2026-06-17  
> État : P0–P4 terminés. P5.1 + P5.5 + P5.6 terminés. CI/CD opérationnel.

---

## 1. Contexte projet

**AmorFati** est une PWA de suivi personnel philosophique (10 questions, 5 dimensions, score 0-40). Elle fonctionne 100% client-side avec localStorage, déployée sur GitHub Pages.

**Dépôt** : `https://github.com/mickeymick25/AmorFati`  
**URL publique** : `https://mickeymick25.github.io/AmorFati`

---

## 2. Ce qui a été fait

### P0 + P1 — Terminé ✅

| Tâche | Détail |
|-------|--------|
| T0.1 | Élimination duplication code (`index.html` éclaté en 3 fichiers) |
| T0.2 | Correction XSS (`escapeHtml()` importé depuis `logic.js`, appliqué partout) |
| T0.3 | Accessibilité ARIA (tabs, modales, `aria-live`, `role`, navigation clavier) |
| T0.4 | Bugs `app.js` corrigés |
| T1.1 | Modales accessibles (`showAlert`, `showConfirm`, `showDangerConfirm`, `showPrioritySelector`) |
| T1.2 | Focus visible (`:focus-visible` sur tous les éléments interactifs) |
| T1.3 | Contraste couleur (`#666` → `#555`, 9 occurrences) |
| T1.4 | Validation données au chargement (`isValidAssessment`, `DEFAULT_DATA`, `loadData()`) |
| T1.5 | Nettoyage CSS inline (9 nouvelles classes, `index.html` nettoyé) |
| T1.6 | Workflow redondant `deploy-pages.yml` supprimé |
| T1.7 | Constantes centralisées dans `src/logic.js`, importées dans `app.js` |
| T1.8 | 41 tests passent, `app.js` importe depuis `logic.js` |
| T1.9 | `app.js` en module ES, globals exposés via `window.xxx` |
| T2.9 | `URL.revokeObjectURL` avec `setTimeout` |
| T2.11 | Service Worker v3 (runtime caching, build Vite, `public/`) |

### P2 — TDD + DDD — Terminé ✅

| Tâche | Détail |
|-------|--------|
| P2.1 | Créé `src/infrastructure/storage-repository.js` — Classe `LocalStorageRepository` |
| P2.2 | Ajouté `@vitest/coverage-v8` + seuil 80% sur `src/` (atteint: 100%) |
| P2.3 | Tests TDD pour assessment (42 tests) |
| P2.4 | Extrait `src/domain/assessment.js` |
| P2.5 | Extrait `src/domain/constants.js` |
| P2.6 | Extrait `src/domain/interpretation.js` et `src/domain/recommendation.js` |
| P2.7 | Transformé `src/logic.js` en barrel re-export |
| P2.8 | Refactoré `app.js` pour utiliser les nouveaux modules + LocalStorageRepository |
| P2.9 | Extrait `src/ui/modal.js` + 31 tests UI |
| P2.10 | Configuré Husky + lint-staged |
| P2.11 | Créé `CONTRIBUTING.md` |

### P3 — Qualité & Améliorations — Terminé ✅

| Tâche | Détail |
|-------|--------|
| P3.1 | Skip-link accessibilité clavier + `<main id="main-content">` + CSS |
| P3.2 | Versionnage schéma données (`appData.version = 1` + `migrateData()` + `CURRENT_SCHEMA_VERSION`) |
| P3.3 | Open Graph + Twitter Card meta tags |
| P3.4 | `.editorconfig` |
| P3.5 | Mode merge import (`mergeAssessments()` + modale Remplacer/Fusionner/Annuler) |

### P4 — Améliorations incrémentales — Terminé ✅

| Tâche | Détail | Statut |
|-------|--------|--------|
| P4.1 | Dark mode (`prefers-color-scheme: dark` + 30+ variables CSS sémantiques) | ✅ Terminé |
| P4.2 | Extraction données métier (`src/domain/questions.js` + `DIMENSION_INFO` + `renderAssessmentForm()`) | ✅ Terminé |
| P4.3 | SVG favicon (`public/icons/favicon.svg`) référencé dans `index.html` | ✅ Terminé |
| P4.4 | CSS mobile-first (inverser media queries) | ⏳ Reporté — rapport risque/bénéfice faible |
| P4.5 | Tests E2E Playwright | ⏳ Reporté — infrastructure lourde, ~4h |

### Bugs corrigés

- `isValidAssessment` retournait `true` pour `dimensionScores: null` → check `!== null`
- GitHub Pages : `base: "/AmorFati/"` dans `vite.config.js`
- GitHub Actions : upgrade actions + `npm install` au lieu de `npm ci`
- Service Worker bumpé en v4, puis v5 (dark mode cache invalidation)

---

## 3. Architecture actuelle

```
app.js (~108 lignes)                  — Orchestrateur minimal (init + window exports)
├── src/ui/state.js (51 lignes)        — État partagé (appState, storage, saveData, loadData)
├── src/ui/renderer.js (~312 lignes)   — Rendu DOM (formulaire, résultats, historique, chart, paramètres)
├── src/ui/tabs.js (~69 lignes)        — Navigation onglets (switchTab, handleTabKeydown)
├── src/ui/assessment.js (~98 lignes)  — Flow évaluation (startAssessment, calculateResults, resetForm, viewAssessmentDetails)
├── src/ui/data.js (~114 lignes)        — Gestion données (exportData, importData, deleteAllData)
├── src/ui/priority.js (~85 lignes)    — Sélecteur priorité (showPrioritySelector, changePriority)
├── src/ui/pwa.js (~79 lignes)         — PWA (installApp, dismissInstall, SW registration)
├── src/ui/modal.js (112 lignes)       — Système de modales
├── src/logic.js (41 lignes)           — Barrel re-export vers domain/*, infrastructure/*
├── src/domain/constants.js (106 lignes) — Constantes métier (PRIORITY_LABELS, INTERPRETATIONS, etc.)
├── src/domain/assessment.js (117 lignes) — Entité Assessment (validation, factory)
├── src/domain/interpretation.js (17 lignes) — Mapping score → interprétation
├── src/domain/recommendation.js (50 lignes) — Logique de recommandation
├── src/domain/questions.js (393 lignes)  — Données questions + DIMENSION_INFO + DIMENSIONS dérivé
├── src/domain/utils.js (22 lignes)     — escapeHtml
├── src/domain/migration.js (61 lignes)  — Migration schéma (migrateData, CURRENT_SCHEMA_VERSION)
├── src/domain/merge.js (39 lignes)       — Fusion d'évaluations (mergeAssessments)
└── src/infrastructure/storage-repository.js (82 lignes) — Abstraction localStorage
```

**Progrès** : `app.js` réduit de ~860 à ~108 lignes. Le monolithe est découpé en 7 modules UI focalisés.
Couverture `src/` = 100% statements/functions/lines, 100% branches. 195 tests passent.

---

## 4. État actuel des fichiers

```
AmorFati/
├── .github/workflows/
│   ├── lighthouse.yml               # Audit Lighthouse
│   └── static.yml                    # Build + deploy Pages
├── .husky/
│   ├── pre-commit                    # lint-staged via Docker
│   └── pre-push                      # tests via Docker
├── Doc/
│   ├── analyse-bonnes-pratiques.md
│   ├── architecture-pwa.md
│   ├── brief-handoff.md             # ← Ce fichier
│   └── analyse-impact-tdd-ddd.md
├── public/
│   ├── manifest.json
│   ├── offline.html
│   └── icons/
│       ├── favicon.svg               # SVG favicon (P4.3)
│       ├── icon-180.png
│       ├── icon-192.png
│       ├── icon-512.png
│       └── splash-*.png
├── scripts/
│   └── smoke_test.py
├── src/
│   ├── domain/
│   │   ├── assessment.js             # 117 lignes
│   │   ├── constants.js             # 106 lignes
│   │   ├── interpretation.js        # 17 lignes
│   │   ├── merge.js                 # 39 lignes
│   │   ├── migration.js             # 61 lignes
│   │   ├── questions.js             # 393 lignes
│   │   ├── recommendation.js        # 50 lignes
│   │   └── utils.js                 # 22 lignes
│   ├── infrastructure/
│   │   └── storage-repository.js    # 82 lignes
│   ├── ui/
│   │   ├── assessment.js            # 98 lignes — Flow évaluation
│   │   ├── data.js                  # 114 lignes — Export/Import/Delete
│   │   ├── modal.js                 # 112 lignes — Système de modales
│   │   ├── priority.js              # 85 lignes — Sélecteur priorité
│   │   ├── pwa.js                   # 79 lignes — PWA + SW
│   │   ├── renderer.js              # 312 lignes — Rendu DOM
│   │   ├── state.js                 # 51 lignes — État partagé
│   │   └── tabs.js                  # 69 lignes — Navigation onglets
│   └── logic.js                     # 41 lignes, barrel re-export
├── tests/
│   ├── domain/
│   │   ├── assessment.test.js       # 46 tests
│   │   ├── constants.test.js       # 12 tests
│   │   ├── merge.test.js            # 13 tests
│   │   ├── migration.test.js        # 12 tests
│   │   └── questions.test.js       # 14 tests
│   ├── infrastructure/
│   │   └── storage-repository.test.js # 25 tests
│   ├── ui/
│   │   └── modal.test.js            # 32 tests
│   ├── setup.js
│   ├── environment.test.js          # 3 tests
│   └── logic.test.js                # 38 tests (backward compat)
├── .dockerignore
├── .editorconfig
├── .gitignore
├── .prettierrc
├── CONTRIBUTING.md
├── Dockerfile
├── app.js                            # ~108 lignes, orchestrateur minimal
├── docker-compose.yml
├── eslint.config.js
├── favicon.ico
├── index.html                        # ~335 lignes
├── manifest.json
├── offline.html
├── package.json
├── service-worker.js                 # v5
├── styles.css                        # CSS avec variables sémantiques + dark mode
├── vite.config.js                    # base: "/AmorFati/", plugin custom copy-sw
└── vitest.config.js                  # jsdom, globals, coverage 80%
```

---

## 5. Métriques

| Métrique | Valeur |
|----------|--------|
| Tests | 195 (9 fichiers) |
| Couverture `src/` | 100% statements, 100% branches, 100% functions, 100% lines |
| `app.js` | ~108 lignes (était ~860) |
| `index.html` | ~335 lignes (était ~810) |
| Modules `src/` | 18 (7 domain + 1 infrastructure + 7 UI + 1 questions + 1 barrel + 1 tabs) |
| Lint | ✅ ESLint + Prettier, 0 errors, 0 warnings |
| Build | ✅ Vite, 22 modules transformés |
| CI/CD | ✅ GitHub Actions (build + deploy + lighthouse) |
| Pre-commit | ✅ lint-staged via Docker |
| Pre-push | ✅ tests complets via Docker |
| Déploiement | ✅ GitHub Pages fonctionnel |
| Dark mode | ✅ `prefers-color-scheme: dark` via 30+ variables CSS |

---

## 6. Plan d'action — Tâches restantes

### P4 — Tâches reportées

| # | Tâche | Criticité | Effort | Note |
|---|-------|-----------|--------|------|
| P4.4 | CSS mobile-first (inverser media queries) | 🟡 | ~2h | Risque de régression visuelle élevé, bénéfice modéré |
| P4.5 | Tests E2E (Playwright) | 🟡 | ~4h | Infrastructure lourde, nécessite Docker + navigateurs |

### P5 — Suggestions futures

| # | Tâche | Criticité | Effort | Note |
|---|-------|-----------|--------|------|
| P5.1 | Service Worker bump v5 (invalidate ancien cache dark mode) | ✅ Terminé | ~15min | Bumpé de v4 → v5 |
| P5.2 | Traduction / i18n | 🟢 | ~4h | L'interface est en français fixe |
| P5.3 | PWA update notification (améliorer le prompt existant) | 🟢 | ~1h | Le prompt de MAJ existe mais pourrait être plus visible |
| P5.4 | Lighthouse audit & perf optimisation | 🟢 | ~2h | Images, lazy loading, cache headers |
| P5.5 | Séparer `app.js` en modules UI | ✅ Terminé | ~3h | `app.js` réduit de ~860 à ~108 lignes |
| P5.6 | Ajouter des tests pour couverture branches | ✅ Terminé | ~30min | 100% branches sur `src/`, 195 tests |

---

## 7. Points d'attention

- **`base: "/AmorFati/"`** dans `vite.config.js` — nécessaire pour GitHub Pages. En dev local (Vite dev server), le base path est géré automatiquement.
- **CI/CD** : le workflow `static.yml` supprime `package-lock.json` avant `npm install` car le lockfile est généré sur Alpine/MUSL (Docker) et le runner est Ubuntu/GNU. Ne pas remettre `npm ci`.
- **Service Worker v5** : le cache name a été bumpé pour forcer la mise à jour après le changement de base path et les modifications CSS (dark mode).
- `app.js` est un module ES orchestrateur minimal (~108 lignes). Toute la logique UI est dans `src/ui/`. Les onclick handlers HTML utilisent les fonctions exposées via `window.xxx`. Si on ajoute de nouvelles fonctions appelées depuis le HTML, il faut les ajouter à la section `window.xxx` dans `app.js`.
- L'état partagé (`appState`) est dans `src/ui/state.js`. C'est un objet mutable `{ data: ... }` partagé entre tous les modules UI.
- Le système de modale utilise des Promesses. Les fonctions qui appellent `showAlert/showConfirm/showDangerConfirm/showPrioritySelector/openModal` doivent être `async`.
- Les tabs utilisent le pattern ARIA tabs avec navigation clavier (flèches, Home, End).
- Un **skip-link** (`Aller au contenu principal`) est présent dans le HTML pour l'accessibilité clavier. Il saute vers `<main id="main-content">`.
- L'import de données offre 2 modes : **Remplacer** (remplace tout) et **Fusionner** (ajoute sans doublons via `mergeAssessments`).
- Le schéma de données a un champ `version` (actuellement `1`). `migrateData()` gère la migration des anciennes données sans version.
- **Dark mode** : implémenté via 30+ variables CSS sémantiques dans `:root` et inversées dans `@media (prefers-color-scheme: dark)`. Pour ajuster les couleurs sombres, modifier les variables dans ce bloc media query uniquement.
- Les questions du formulaire sont générées dynamiquement par `renderAssessmentForm()` depuis `src/domain/questions.js`. Le HTML ne contient que `<div id="assessmentFormContainer"></div>`.
- `DIMENSIONS` n'est plus dans `constants.js` mais dans `questions.js` (dérivé de `QUESTIONS` + `DIMENSION_INFO`). `logic.js` re-exporte depuis `questions.js`.
- Les fichiers statiques (`manifest.json`, `offline.html`, `icons/`) sont dans `public/` et copiés dans `dist/` par Vite.
- Le `service-worker.js` est copié dans `dist/` par un plugin Vite custom (`copyServiceWorkerPlugin`).

---

## 8. Commandes utiles

```bash
# Serveur de dev (HMR sur localhost:5173)
docker compose up dev

# Lancer les tests
docker compose run --rm test

# Tests avec couverture
docker compose run --rm test npm run test:coverage

# Tests en watch
docker compose run --rm test npm run test:watch

# Build de production
docker compose run --rm build

# Reconstruire l'image après changement de package.json
docker compose build dev

# Linter
docker compose run --rm lint

# Linter + formater
docker compose run --rm lint npm run lint:fix
```

---

## 9. Derniers commits

| Hash | Message |
|------|---------|
| `xxxx` | feat: P5.5 — split app.js into 7 UI modules (state, renderer, tabs, assessment, data, priority, pwa) |
| `xxxx` | feat: P5.6 — add branch coverage tests (merge, migration, modal) → 195 tests, 100% branches |
| `xxxx` | feat: P5.1 — bump service worker cache to v5 (dark mode CSS invalidation) |