# Agenda Efficacité

Outil d'aide à la productivité pour analyser et optimiser la répartition de votre temps de travail. Importez votre agenda Outlook, catégorisez vos activités, consultez un tableau de bord et simulez des optimisations.

## Prérequis

- [Node.js](https://nodejs.org/) 20+ (LTS recommandé)
- npm 10+

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement (http://localhost:4200)
npm start

# Build de production
npm run build
```

## Structure du projet

```
src/
├── app/
│   ├── app.component.html      # Template principal (UI extraite de legacy/)
│   ├── app.component.ts        # Point d'entrée Angular → bootstrap AppController
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── core/
│       ├── app-controller.ts   # Logique UI legacy (à migrer progressivement)
│       ├── models/             # Interfaces TypeScript partagées
│       └── services/
│           ├── category-state.service.ts
│           └── agenda-state.service.ts
├── index.html
└── styles.scss                 # Styles globaux (design system)

legacy/
└── index.html                  # Version monolithique d'origine (référence)
```

## Développement

L'application a été migrée depuis un fichier HTML unique vers Angular 19 (standalone components, sans SSR). La logique métier actuelle reste dans `AppController` et sera progressivement refactorisée en :

- **Services Angular** injectables (`CategoryState`, `AgendaState`)
- **Composants** par onglet (Import, Catégoriser, Tableau de bord, Simulateur)
- **Modèles typés** dans `src/app/core/models/`

Les fichiers `core/services/*.ts` et `app-controller.ts` portent `@ts-nocheck` le temps de la migration TypeScript.

## Données & confidentialité

Toutes les données (agenda, catégories, objectifs) sont stockées localement dans le navigateur via `localStorage`. Aucune donnée n'est envoyée à un serveur.

## Scripts npm

| Commande | Description |
|----------|-------------|
| `npm start` | Serveur de dev avec rechargement à chaud |
| `npm run build` | Build de production dans `dist/` |
| `npm test` | Tests unitaires (Karma/Jasmine) |
| `npm run watch` | Build en mode watch |

## Licence

Voir [LICENSE](LICENSE).
