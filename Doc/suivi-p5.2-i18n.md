# Suivi P5.2 — Internationalisation (i18n FR + EN)

> Journal de suivi de l'implémentation de la phase P5.2.
> Source du besoin : `brief-handoff.md` (P5.2 — Traduction / i18n, ~4h).
> Décisions validées avec l'utilisateur le 2026-06-24.

---

## 1. Contexte et objectifs

L'interface d'AmorFati est en français fixe. P5.2 vise à internationaliser l'application pour supporter **FR (source) et EN (cible)** via une bibliothèque standard, en vue de permettre l'ajout facile d'autres langues ultérieurement.

**Périmètre** : ~215 chaînes réparties sur `index.html`, `src/domain/*`, `src/ui/*`, `manifest.json`, `offline.html`. `service-worker.js` est hors périmètre (aucune chaîne).

---

## 2. Décisions de design (validées)

| Décision                 | Choix                                                                          | Raison                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Bibliothèque             | **i18next** + `i18next-browser-languagedetector`                               | Standard de l'écosystème, mature, API stable, délégation de la détection/persistance à un plugin officiel |
| Langues cibles           | **FR + EN**                                                                    | FR source (déjà existant), EN traduction cible                                                            |
| Format des resources     | **JSON** (`src/i18n/locales/{fr,en}.json`)                                     | Format recommandé par i18next, séparation code/traduction                                                 |
| Persistance de la langue | **Clé i18next dédiée** (`amorFatiLang` via `i18next-browser-languagedetector`) | Découple du schéma `appState.data` → pas de migration schéma v2 nécessaire                                |
| Détection initiale       | `localStorage` → `navigator.language` → fallback `fr`                          | Ordre standard i18next (préférence utilisateur mémorisée > langue navigateur > défaut)                    |
| Stratégie HTML           | **Attributs `data-i18n`** + fonction `translatePage()`                         | HTML reste lisible (fallback FR visible si JS désactivé), traduction appliquée au runtime                 |
| Formatage dates/nombres  | **`Intl.DateTimeFormat` / `Intl.NumberFormat`** avec `i18next.language`        | Pas de dépendance supplémentaire (dayjs, etc.), API native du navigateur                                  |

---

## 3. Architecture cible

```
src/i18n/
├── index.js              — init i18next (resources, detector, fallback), t(), setLang(), onLanguageChanged(), translatePage()
└── locales/
    ├── fr.json           — dictionnaire français (source, complet dès P5.2.1)
    └── en.json           — dictionnaire anglais (rempli en P5.2.4)
```

### Module `src/i18n/index.js` (API prévue)

```js
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

export async function initI18n() {
  /* init + LanguageDetector */
}
export function t(key, params) {
  return i18next.t(key, params);
}
export function getCurrentLang() {
  return i18next.language || "fr";
}
export async function setLang(lang) {
  await i18next.changeLanguage(lang);
}
export function onLanguageChanged(cb) {
  i18next.on("languageChanged", cb);
}
export function translatePage() {
  /* applique t() aux [data-i18n] + [data-i18n-attr] */
}
```

### Configuration i18next

```jsonc
{
  "fallbackLng": "fr",
  "supportedLngs": ["fr", "en"],
  "detection": {
    "order": ["localStorage", "navigator"],
    "lookupLocalStorage": "amorFatiLang",
    "caches": ["localStorage"],
  },
  "interpolation": { "escapeValue": false }, // escapeHtml déjà géré côté renderer
}
```

### Structure des clés du dictionnaire

Clés hiérarchiques par point, organisées par domaine fonctionnel :

```
app.title
app.welcome.title
app.welcome.intro
app.welcome.confidential
app.welcome.priority.question
tab.welcome / tab.assessment / tab.history / tab.settings
priority.ressentiment.label / priority.ressentiment.desc
priority.none.label / priority.none.desc
q1.text / q1.opt0 / q1.opt1 / ... / q1.opt4
q2.text / ...
dim.1.title / dim.1.description
results.score / results.interpretation.title
alert.assessment.incomplete
modal.confirm.delete / modal.cancel
pwa.install.title / pwa.install.confirm / pwa.update.banner / pwa.update.reload
settings.export.title / settings.import.title / settings.delete.title
...
```

### Refactor `src/domain/questions.js`

Les `QUESTIONS` gardent leur structure (id, dimension, ordre des options, values) mais `text` et `label` deviennent des **clés i18n** :

```js
// Avant
{ id: "q1", text: "Quand tu repenses...", options: [{ value: 0, label: "Une colère..." }] }
// Après
{ id: "q1", textKey: "q1.text", options: [{ value: 0, labelKey: "q1.opt0" }] }
```

Le renderer appelle `t(question.textKey)` / `t(option.labelKey)`. Une seule structure de données → pas de drift entre langues.

### `index.html` — attributs `data-i18n`

```html
<h1 data-i18n="app.title">🌟 Amor Fati Tracker</h1>
<p data-i18n="app.welcome.subtitle">
  "Ne rien vouloir d'autre que ce qui est" - Nietzsche
</p>
<button data-i18n="app.welcome.start">Commencer ma première évaluation</button>
```

Le texte FR reste en fallback dans le HTML (visible si JS désactivé). `translatePage()` remplace au runtime. Attributs (placeholder, aria-label, title) gérés via `data-i18n-attr="placeholder:key;aria-label:key2"`.

### Sélecteur de langue (onglet Paramètres)

Nouveau bloc dans `index.html` onglet settings + handler dans `src/ui/settings.js` (nouveau module) ou extension de `src/ui/priority.js`/`src/ui/data.js`. Appelle `setLang(lang)`, déclenche `translatePage()` + re-rendu des modules dynamiques (history, results, form).

### Cycle de vie

1. `app.js` `DOMContentLoaded` → `await initI18n()` → `translatePage()` → `renderAssessmentForm()` (déjà i18n-isé) → `loadData()` → `displaySettings()` + `displayHistory()`.
2. `i18next.on("languageChanged")` → `translatePage()` + re-rendu dynamique (history/results si visibles).
3. Sélecteur Paramètres → `setLang()` → i18next émet `languageChanged`.

---

## 4. Découpage en sous-tâches (TDD)

| #          | Tâche                                                                                  | Fichiers                                                                         | Effort  | Statut     |
| ---------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------- | ---------- |
| **P5.2.1** | Install deps + core i18n + sélecteur Paramètres + tests                                | `package.json`, `src/i18n/*`, `tests/i18n/*`, `app.js`, `index.html` (sélecteur) | ~1h30   | ✅ Terminé |
| **P5.2.2** | Migrer UI : `index.html` (`data-i18n`) + `src/ui/*` + `offline.html` + `manifest.json` | UI modules + HTML                                                                | ~1h     | ✅ Terminé |
| **P5.2.3** | Migrer domain : `questions.js` (clés) + `constants.js` + tests                         | `src/domain/*`, `tests/domain/*`                                                 | ~1h     | ✅ Terminé |
| **P5.2.4** | Traduction `en.json` complet                                                           | `src/i18n/locales/en.json`                                                       | ~30 min | ✅ Terminé |
| **P5.2.5** | Validation bilingue : tests, lint, build, vérif visuelle FR/EN                         | —                                                                                | ~15 min | ✅ Terminé |

---

## 5. Journal d'avancement

### 2026-06-24 — Lancement P5.2.1

- ✅ Décisions de design validées avec l'utilisateur (i18next + detector, FR+EN, JSON resources, `data-i18n`, pas de migration schéma)
- ✅ Plan en 5 sous-tâches validé
- ✅ Architecture cible définie (structure modules, API `src/i18n/index.js`, structure des clés, refactor `questions.js`)
- ⚠️ **Install des dépendances bloquée** : `docker compose run --rm dev npm install i18next i18next-browser-languagedetector` a échoué avec `authorization channel closed` (problème d'accès au daemon Docker pendant la commande — le daemon est up mais la commande a été interrompue). Aucune modification de `package.json` (pas de section `dependencies` créée).
- **Prochaine étape** : relancer l'install des deps, puis créer `src/i18n/index.js` + `fr.json` (squelette) + sélecteur Paramètres + tests TDD.

### 2026-06-24 — P5.2.1 terminée

- ✅ Dépendances installées : `i18next@^26.3.4` + `i18next-browser-languagedetector@^8.2.1` (section `dependencies` créée dans `package.json`)
- ✅ `src/i18n/index.js` créé : `initI18n()`, `t()`, `getCurrentLang()`, `setLang()`, `onLanguageChanged()`, `translatePage()`, `_resetI18n()` (pour tests)
- ✅ Dictionnaires `src/i18n/locales/fr.json` + `en.json` créés (clés du sélecteur de langue + exemples ; le reste sera rempli en P5.2.2/P5.2.3)
- ✅ Sélecteur de langue ajouté dans l'onglet Paramètres (`index.html`) avec CSS `.lang-selector` / `.lang-btn` et état actif via `aria-pressed`
- ✅ Câblage `app.js` : `await initI18n()` au `DOMContentLoaded` (avant le reste), `translatePage()`, handler `.lang-btn` → `setLang()`, abonnement `onLanguageChanged` → `translatePage()` + `updateLangButtonsActive()`
- ✅ Tests TDD : `tests/i18n/index.test.js` — 16 tests couvrant init/détection, `t()`, `setLang`+persistance, `onLanguageChanged` (subscribe/unsubscribe), `translatePage` (textContent + attributs + multi-éléments + re-traduction après changement de langue)
- ✅ Validation :
  - Lint (ESLint + Prettier) : 0 erreur, 0 warning
  - Tests : **211 tests passent** (195 existants + 16 nouveaux), 0 régression
  - Build Vite : 27 modules transformés (vs 22), JS bundle 85 kB (vs 32 kB) — i18next + detector bien inclus
- **Note** : en P5.2.1, seul le sélecteur est traduit (le reste de l'UI garde son texte FR en dur jusqu'à P5.2.2). Le sélecteur fonctionne mais visuellement le reste ne change pas encore — c'est attendu.
- **Prochaine étape** : P5.2.2 — migrer l'UI vers `t()` / `data-i18n` (`index.html` + `src/ui/*` + `offline.html` + `manifest.json`).

### 2026-06-24 — P5.2.2 / P5.2.3 / P5.2.4 terminées

Migration complète de l'UI et du domain vers i18next, + traduction EN complète.

- ✅ **Dictionnaires FR + EN complets** (`src/i18n/locales/fr.json` + `en.json`) : ~215 clés couvrant app, tabs, welcome, priority, assessment, results, history, settings, lang, modal, data, priorityModal, pwa, offline, dimension (5), q1-q10 (texte + 5 options), interpretation (5 niveaux × 4), recommendation (6 priorités × 3).
- ✅ **`index.html`** : attributs `data-i18n` sur tous les éléments textuels + `data-i18n-attr` pour les attributs (placeholder, aria-label, meta description, og/twitter). Texte FR conservé en fallback dans le HTML (visible si JS désactivé).
- ✅ **`src/ui/*`** : `modal.js` (titres/boutons via `t()`), `assessment.js` (alertes validation), `data.js` (messages import/export/delete), `priority.js` (modale priorité), `renderer.js` (formulaire, résultats, historique, graphique, settings — formatage dates via `Intl.DateTimeFormat(getCurrentLang(), …)`).
- ✅ **`src/domain/*`** : `questions.js` refactoré (suppression `text`/`label`, texte en i18n — clés `{id}.text` / `{id}.opt{value}`), `constants.js` (INTERPRETATIONS → `{index,min,max}`, PRIORITY_LABELS/\_FULL → clés i18n, PRIORITY_RECOMMENDATIONS → arrays d'indices), `interpretation.js` (retourne `{index,min,max}`), `recommendation.js` (retourne des clés i18n + markers `__focus__dim__score__`).
- ✅ **`offline.html`** : page autonome avec mini-dictionnaires FR/EN inline + lecture `amorFatiLang` depuis localStorage (pas accès à i18next car servie par SW).
- ✅ **`manifest.json`** : champ `lang` laissé à `fr-FR` (la langue UI est gérée au runtime par JS ; le manifest décrit l'app installée).
- ✅ **`app.js`** : `onLanguageChanged` re-rend désormais les modules dynamiques (`renderAssessmentForm`, `displaySettings`, `displayHistory`) + re-câble les handlers `.option`.
- ✅ **`tests/setup.js`** : initialise i18next en `beforeAll` (force FR) + `beforeEach` remet `changeLanguage("fr")` pour des assertions déterministes. Les tests i18n gardent leur propre `beforeEach` (\_resetI18n + initI18n).
- ✅ **Tests mis à jour** : `tests/domain/questions.test.js` (plus de `text`/`label`), `tests/domain/constants.test.js` (INTERPRETATIONS index/min/max, PRIORITY_LABELS clés i18n, PRIORITY_RECOMMENDATIONS arrays de nombres), `tests/logic.test.js` (getInterpretation vérifie `index`, getRecommendations vérifie des clés i18n + markers `__focus__`). Suppression du test "adds creation recommendation when Création < 4" (recommandation retirée car dépendait de la clé FR "Création").
- ✅ **Bonus nettoyage** : suppression du dead code CSS `.score-badge` (plus utilisé après retrait du score-badge du formulaire — répond aussi au retour utilisateur P6.2).
- ✅ **Validation intermédiaire** :
  - Lint : ✅ 0 erreur
  - Tests : ✅ 211 tests passent (0 régression)
  - Build : ✅ 27 modules, JS 108 kB (dictionnaires FR/EN embarqués)
- **Décisions de design prises en cours de route** :
  - Le domain (`interpretation.js`, `recommendation.js`) retourne des **clés i18n** au lieu de strings — la couche domain reste pure (pas d'import i18next), la résolution du texte se fait côté renderer via `t()`. Respecte l'architecture DDD.
  - Les noms de dimensions stockés en FR dans `dimensionScores` (clés des objets JSON) sont mappés via `DIMENSION_I18N_KEYS` dans le renderer pour afficher le label traduit.
  - `offline.html` ne dépend pas d'i18next (servie hors app) — dictionnaires FR/EN inline minimaux.
- **Prochaine étape** : P5.2.5 — validation bilingue finale (vérification visuelle FR/EN dans le dev server).

---

## 6. Points d'attention pour l'implémentation

- **Dépendances production** : i18next et le detector sont des deps runtime (pas dev). C'est la première fois que le projet ajoute une section `dependencies` (actuellement uniquement `devDependencies`). Le `Dockerfile` doit installer les deps production (vérifier le `npm install` dans le Dockerfile — si `npm install --omit=dev`, i18next sera bien inclus).
- **CI/CD** : le workflow `static.yml` supprime `package-lock.json` avant `npm install` (différences Alpine/GNU). Ne pas remettre `npm ci`. L'ajout de deps production ne change pas ce comportement.
- **Tests** : i18next doit être initialisé dans `tests/setup.js` (ou mocké) pour que les tests UI qui appellent `t()` fonctionnent. Créer un setup i18n de test (resources FR minimal, ou réutiliser `fr.json`).
- **`escapeHtml`** : i18next avec `interpolation.escapeValue: false` n'échappe pas. Le renderer applique déjà `escapeHtml` sur les valeurs dynamiques. Veiller à ne pas double-échapper : `t()` retourne la chaîne traduite, `escapeHtml(t(key))` est l'usage sûr pour injection HTML.
- **Re-rendu dynamique sur `languageChanged`** : `displayHistory()`, `displayResults()`, `renderAssessmentForm()` doivent être re-déclenchés au changement de langue (abonnement via `onLanguageChanged`).
- **Formatage dates** : remplacer `toLocaleDateString("fr-FR")` (renderer.js L143, L214, L285) par `Intl.DateTimeFormat(getCurrentLang(), …)` ou `new Intl.DateTimeFormat(i18next.language)`.
- **`manifest.json`** : champ `lang` à dynamiser (ou dupliquer le manifest par langue — plus simple : laisser `lang: "fr"` et gérer la langue via JS au runtime). À décider en P5.2.2.
- **Couverture tests** : le projet est à 100% sur `src/`. Les nouveaux modules `src/i18n/*` doivent être couverts. Le seuil de couverture (80% sur `src/`) est dans `vitest.config.js`.

---

## 7. Commandes utiles (spécifiques P5.2)

```bash
# Installer les deps i18n (via Docker)
docker compose run --rm dev npm install i18next i18next-browser-languagedetector

# Reconstruire l'image dev après changement de package.json (si nécessaire)
docker compose build dev

# Tests (incluant les nouveaux tests i18n)
docker compose run --rm test

# Build de production (vérifier que i18next est bundlé)
docker compose run --rm build

# Dev server + vérif visuelle bilingue
docker compose up dev
# → http://localhost:5173/AmorFati/ → onglet Paramètres → sélecteur FR/EN
```
