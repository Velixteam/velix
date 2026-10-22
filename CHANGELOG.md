# Changelog

All notable changes to Velix are documented in this file.

## [Unreleased] - Chantier 1: Pipeline Déterministe (Manifest + Assets Hachés)

### Added
- **Schéma de Manifeste Zod (`dist/manifest.json`) :**
  - Validation stricte via Zod (`ManifestSchema`) avec `schemaVersion: 1`, `buildId`, `version`, `routes`, `islands`, `styles`, et `assets`.
  - Exporté dans `@teamvelix/velix-core/manifest`.
- **Module Universel `loadAssetManifest(mode)` :**
  - En production (`mode: 'production'`) : lit et valide `dist/manifest.json`, vérifiant que chaque fichier référencé existe sur le disque. Refuse de démarrer si un fichier est manquant.
  - En développement (`mode: 'development'`) : génère dynamiquement un manifeste en mémoire suivant strictement le même schéma à partir des sources.
- **Hashing Déterministe Tailwind CSS :**
  - La compilation Tailwind en production écrit `dist/public/tailwind.<hash8>.css` et l'enregistre dans `manifest.styles`.
  - `public/tailwind.css` ne sert plus qu'au serveur de développement.
- **Production Server Durci (`velix start`) :**
  - Sert uniquement `dist/public` et `dist/client`.
  - Entête `Cache-Control: immutable` réservé strictement aux fichiers hachés.
  - Échec immédiat et bruyant si le manifeste est absent ou corrompu.
- **Diagnostics `velix doctor` Renforcés :**
  - Vérification de l'intégrité de `dist/manifest.json` et de tous les fichiers référencés.
  - Vérification de la non-duplication des instances `react` / `react-dom`.
- **Suite de tests d'intégration e2e (`tests/e2e/pipeline-manifest.test.ts`) :**
  - Scaffold d'application, build, exécution sans devDependencies, vérification Playwright (0 erreur console) et validation de l'invalidation de cache après mise à jour CSS.
