# AmorFati

[![Deployed on GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-blue?logo=github)](https://mickeymick25.github.io/AmorFati)
[![Pages deploy status](https://github.com/mickeymick25/AmorFati/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/mickeymick25/AmorFati/actions/workflows/deploy-pages.yml)

Une petite application front-end (single file) pour suivre ton cheminement vers l'« Amor Fati »
(acceptation de sa vie). L'interface est contenue dans `index.html` et fonctionne entièrement
dans le navigateur sans serveur.

## Résumé du projet

- Fichier principal : `index.html` (HTML + CSS + JavaScript intégrés).
	- Application d'évaluation personnelle (10 questions, 5 dimensions).
	- Stockage local via `localStorage` (clé `amorFatiData`).
	- Possibilité d'exporter/importer les données au format JSON.
	- Interface responsive, suggestions et comparaisons d'évolution.

L'application propose :

- Une page d'accueil avec sélection d'une priorité personnelle.
- Une évaluation composée de 10 questions réparties en 5 dimensions.
- Calcul automatique d'un score total (0–40) et d'interprétations textuelles.
- Historique des évaluations avec un petit graphique SVG.
- Export / import JSON et suppression complète des données.

## Comment l'utiliser (quick start)

1. Ouvre `index.html` dans ton navigateur (double-clic ou "Ouvrir avec").
2. Sélectionne une priorité sur la page d'accueil, puis clique sur "Commencer ma première évaluation".
3. Réponds aux 10 questions et clique sur "Calculer mon score".
4. Utilise l'onglet "Historique" pour voir l'évolution et exporter/importer les données.

Notes :

- L'application fonctionne hors-ligne (Aucune requête réseau, toutes les données restent locales).
- Aucune étape de build n'est nécessaire : c'est un fichier HTML autonome.

## Détails techniques

- Stockage : `localStorage` via la clé `amorFatiData`.
- PWA : un `manifest` est inclus (encodé en data URI) et l'app gère l'événement `beforeinstallprompt` pour
	proposer l'installation, mais il n'y a pas de service-worker fourni par défaut (commenté).
- Graphique : SVG généré côté client sans dépendances externes.
- Validation import : l'import vérifie que le JSON contient un tableau `assessments`.

## Fichiers

- `index.html` — application complète (UI + logique).
- `README.md` — ce fichier.

## Site public / Déploiement

Le projet est automatiquement publié via GitHub Pages à chaque push sur la branche `main`.
L'URL publique prévue est :

[https://mickeymick25.github.io/AmorFati](https://mickeymick25.github.io/AmorFati)

Note : si l'URL n'apparaît pas immédiatement, attends quelques minutes le temps que
le workflow GitHub Actions (`Deploy to GitHub Pages`) termine et que Pages active le site.


## Tester la PWA localement

Les Service Workers ne fonctionnent pas via le protocole file://. Pour tester la PWA et le Service Worker localement, démarre un simple serveur HTTP depuis le dossier du projet. Exemple rapide avec Python (port 8000) :

```bash
python3 -m http.server 8000
```

Ensuite ouvre dans ton navigateur : http://localhost:8000

Conseils :
- Ouvre les outils de développement (DevTools) > Application > Service Workers pour voir l'état et forcer l'installation/désinstallation.
- Les Service Workers requièrent HTTPS en production ; localhost est considéré comme sécurisé pour le développement.
- Pour tester la page offline :
	1. Charge l'app une première fois en ligne pour que le service worker et le cache s'installent.
	2. Mets ton navigateur en mode offline (DevTools > Network > Offline) et recharge. Le `offline.html` sera servi et montrera l'historique local.


## Limitations et améliorations possibles

- Pas de service worker/service-worker.js inclus : pour une PWA complète, ajouter et enregistrer un
	service worker (caching, offline-first, mises à jour).
- Le manifest est inclus en data URI — il peut être préférable d'avoir un fichier `manifest.json` séparé.
- Pas de tests automatisés (côté UI). On peut ajouter de petits tests d'intégration avec Playwright
	ou des tests unitaires pour la logique de score.
- Localisation : l'interface est en français fixe. Prévoir une structure i18n si besoin.

## Vie privée

- Toutes les données sont stockées localement dans le navigateur et ne sont pas envoyées à un serveur.
- L'export JSON permet de sauvegarder ou migrer les données manuellement.

## Contribution

- Propositions : ajouter un `service-worker.js`, séparer le `manifest.json`, améliorer l'accessibilité,
	ajouter des tests et éventuellement un petit script de build si l'on souhaite modulariser le code.

Si tu veux que j'implémente l'une de ces améliorations (service worker, tests, séparation des fichiers),
dis-moi laquelle et je m'en occupe.