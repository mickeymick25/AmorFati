# Contribuer à AmorFati

Merci de ton intérêt pour **AmorFati** ! 🎉

AmorFati est une PWA de suivi personnel philosophique (10 questions, 5 dimensions, score 0–40). Elle fonctionne 100% côté client, sans serveur, et est déployée sur [GitHub Pages](https://mickeymick25.github.io/AmorFati).

Ce document décrit comment configurer ton environnement, comprendre l'architecture, et contribuer efficacement.

> **Note** : En contribuant, tu acceptes de respecter le code de conduite du projet (le cas échéant).

---

## Développement local

### Prérequis

- **Docker** (toutes les commandes passent par Docker, pas besoin d'installer Node.js localement)
- **Git**

### Installation et lancement

```bash
# Cloner le dépôt
git clone https://github.com/mickeymick25/AmorFati.git
cd AmorFati

# Construire l'image Docker (nécessaire la première fois et après chaque modif de package.json)
docker compose build dev
```

### Commandes principales

| Action                                                | Commande                                             |
| ----------------------------------------------------- | ---------------------------------------------------- |
| **Serveur de dev** (HMR, `localhost:5173`)            | `docker compose up dev`                              |
| **Tests unitaires**                                   | `docker compose run --rm test`                       |
| **Tests avec couverture**                             | `docker compose run --rm test npm run test:coverage` |
| **Tests en watch**                                    | `docker compose run --rm test npm run test:watch`    |
| **Build de production**                               | `docker compose run --rm build`                      |
| **Lint**                                              | `docker compose run --rm lint`                       |
| **Lint + format auto-fix**                            | `docker compose run --rm lint npm run lint:fix`      |
| **Reconstruire l'image** (après modif `package.json`) | `docker compose build dev`                           |

> Les volumes Docker montent le répertoire local dans `/app`, les modifications sont reflétées en temps réel.

---

## Architecture

Le projet suit une architecture inspirée du **Domain-Driven Design (DDD)**, avec une séparation stricte entre domaine, infrastructure et UI.

```
src/
├── domain/                   # Logique métier pure — PAS de DOM, PAS de localStorage
│   ├── assessment.js         # Entité Assessment (factory, validation, DEFAULT_DATA)
│   ├── constants.js          # Constantes métier (PRIORITY_LABELS, DIMENSIONS, etc.)
│   ├── interpretation.js     # Mapping score → interprétation
│   ├── recommendation.js     # Logique de recommandation
│   └── utils.js              # Utilitaires purs (escapeHtml, etc.)
├── infrastructure/
│   └── storage-repository.js # Abstraction localStorage (save, load, delete, import/export)
├── ui/
│   └── modal.js              # Système de modales (showAlert, showConfirm, etc.)
├── logic.js                  # Barrel re-export (rétrocompatibilité)
app.js                        # Orchestrateur UI (~780 lignes)
index.html                    # Structure HTML
styles.css                    # Styles
service-worker.js              # Cache offline
```

### Règles par couche

| Couche                    | Responsabilité                                | Dépendances autorisées                          |
| ------------------------- | --------------------------------------------- | ----------------------------------------------- |
| **`src/domain/`**         | Logique métier pure, fonctions pures, entités | Aucune (pas de DOM, pas de localStorage)        |
| **`src/infrastructure/`** | Persistance, accès aux données                | `src/domain/`                                   |
| **`src/ui/`**             | Composants d'interface                        | `src/domain/`                                   |
| **`app.js`**              | Orchestration, wiring                         | `src/domain/`, `src/infrastructure/`, `src/ui/` |

**`src/logic.js`** est un barrel re-export qui garantit la rétrocompatibilité avec les imports existants. Ne pas y ajouter de nouvelle logique — créer un module dans `src/domain/` à la place.

### Pourquoi cette séparation ?

- **Testabilité** : Le domaine (`src/domain/`) ne dépend ni du DOM ni de localStorage, donc il se teste avec des tests unitaires simples.
- **Maintenabilité** : Changer le stockage (ex. IndexedDB) ne touche qu'`infrastructure/`.
- **Confiance** : Les refactorings sont sécurisés par les tests qui couvrent le domaine à 100%.

---

## Workflow TDD

Le projet suit une discipline **Red → Green → Refactor** :

1. **Red** : Écrire un test qui échoue (définit le comportement attendu).
2. **Green** : Écrire le minimum de code pour faire passer le test.
3. **Refactor** : Nettoyer le code tout en gardant les tests au vert.

### Processus concret

```bash
# 1. Écrire le test dans le bon répertoire
#    tests/domain/assessment.test.js    → pour src/domain/assessment.js
#    tests/infrastructure/storage-repository.test.js → pour src/infrastructure/

# 2. Lancer les tests en watch pour voir l'échec (Red)
docker compose run --rm test npm run test:watch

# 3. Implémenter le minimum pour faire passer (Green)

# 4. Refactorer tant que les tests restent verts
```

### Exigences de couverture

Le seuil de couverture est **80% sur `src/`** (statements, branches, functions, lines), configuré dans `vitest.config.js`. Actuellement, `src/domain/` est couvert à 100%.

```bash
# Vérifier la couverture
docker compose run --rm test npm run test:coverage
```

Les tests de `app.js` ne sont pas exigés (UI monolithe), mais les nouvelles fonctions extraites dans `src/` doivent être couvertes.

---

## Conventions de code

### ESLint + Prettier

La configuration est dans `eslint.config.js` et `.prettierrc` :

- **ESLint** : `@eslint/js` recommandé, `ecmaVersion: 2022`, modules ES
- **Prettier** : guillemets doubles, point-virgule obligatoires, virgules de fin, `printWidth: 80`, `tabWidth: 2`

```bash
# Vérifier le lint
docker compose run --rm lint

# Corriger automatiquement
docker compose run --rm lint npm run lint:fix
```

### Hooks pre-commit / pre-push

Les hooks Husky sont configurés :

- **pre-commit** : lance `lint-staged` (ESLint + Prettier sur les fichiers modifiés)
- **pre-push** : lance les tests unitaires (`npm run test`)

Les hooks s'exécutent dans Docker (`docker compose run --rm dev npx lint-staged`).

### Conventions de nommage

| Élément          | Convention            | Exemple                       |
| ---------------- | --------------------- | ----------------------------- |
| Fichiers source  | `kebab-case`          | `storage-repository.js`       |
| Fichiers de test | Même nom + `.test.js` | `storage-repository.test.js`  |
| Classes          | `PascalCase`          | `LocalStorageRepository`      |
| Fonctions        | `camelCase`           | `isValidAssessment()`         |
| Constantes       | `UPPER_SNAKE_CASE`    | `STORAGE_KEY`, `DEFAULT_DATA` |

### Structure des modules

Chaque module `src/domain/*.js` doit :

- Exporter des fonctions pures ou des constantes
- Ne jamais accéder au DOM (`document.*`) ni à `localStorage`
- Ne jamais importer depuis `infrastructure/` ou `ui/`

Les imports dans `app.js` se font via `src/logic.js` (barrel) ou directement depuis les modules domaine.

---

## Git workflow

### Branches

| Branche        | Usage                                                 |
| -------------- | ----------------------------------------------------- |
| `main`         | Production — déploiement automatique sur GitHub Pages |
| `feat/xxx`     | Nouvelle fonctionnalité                               |
| `fix/xxx`      | Correction de bug                                     |
| `refactor/xxx` | Refactoring sans changement de comportement           |
| `docs/xxx`     | Documentation                                         |

### Messages de commit (Conventional Commits)

```
type(scope): description courte

type: feat | fix | refactor | docs | test | chore | style
scope: optionnel — domain, ui, storage, etc.
```

Exemples :

```
feat(domain): ajouter validateAppData()
fix(storage): corriger l'import de données corrompues
refactor(app): extraire les modales vers src/ui/modal.js
test(domain): ajouter tests pour getInterpretation()
docs: mettre à jour CONTRIBUTING.md
```

### Pull Requests

1. Créer une branche depuis `main`.
2. Développer avec TDD (tests d'abord).
3. Vérifier que les tests passent et que la couverture ≥ 80% sur `src/`.
4. Vérifier le lint (`docker compose run --rm lint`).
5. Ouvrir une PR avec une description claire du changement et des tests ajoutés.

---

## Tests

### Structure

```
tests/
├── domain/
│   ├── assessment.test.js       # Tests de l'entité Assessment
│   └── constants.test.js        # Tests des constantes métier
├── infrastructure/
│   └── storage-repository.test.js  # Tests du repository localStorage
├── ui/
│   └── modal.test.js            # Tests des modales
├── logic.test.js                # Tests de rétrocompatibilité (barrel)
├── environment.test.js          # Tests environnement jsdom
└── setup.js                     # Setup global Vitest
```

### Écrire un nouveau test

1. **Identifier la couche** : `domain`, `infrastructure`, ou `ui`.
2. **Créer le fichier** dans le bon sous-répertoire de `tests/`, avec le même nom que le module source + `.test.js`.
3. **Utiliser `jsdom`** : L'environnement Vitest est configuré en `jsdom` avec `globals: true` — pas besoin d'importer `describe`, `it`, `expect`.
4. **Pour `localStorage`** : Utiliser l'abstraction `LocalStorageRepository` et mocker si nécessaire.

```js
// tests/domain/mon-module.test.js
import { maFonction } from "../../../src/domain/mon-module.js";

describe("maFonction", () => {
  it("retourne le résultat attendu", () => {
    expect(maFonction("input")).toBe("output");
  });
});
```

### Commandes de test

```bash
# Lancer tous les tests
docker compose run --rm test

# Tests en mode watch
docker compose run --rm test npm run test:watch

# Tests avec couverture
docker compose run --rm test npm run test:coverage
```

### Ce qu'il faut tester

| Priorité   | Quoi                   | Pourquoi                                                     |
| ---------- | ---------------------- | ------------------------------------------------------------ |
| 🔴 Haute   | `src/domain/*`         | Logique métier pure, haut ROI                                |
| 🟠 Moyenne | `src/infrastructure/*` | Persistance, nécessite des mocks légers                      |
| 🟡 Basse   | `app.js` (UI)          | Fragile, faible ROI — tester seulement les chemins critiques |

---

## Déploiement

Le déploiement est **automatique** via GitHub Actions :

- Chaque push sur `main` déclenche le workflow `.github/workflows/static.yml`
- Le workflow exécute `npm ci && npm run build`, puis déploie le dossier `dist/` sur GitHub Pages
- URL publique : [https://mickeymick25.github.io/AmorFati](https://mickeymick25.github.io/AmorFati)

Il n'y a pas de déploiement manuel — tout passe par le CI. Si le build échoue, la PR ne doit pas être mergée.
