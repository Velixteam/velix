# Roadmap pour la Stabilité de Velix

Ce document définit les jalons stricts pour garantir que Velix soit un framework robuste, déterministe et prêt pour la production.

---

## Règle Fondamentale
> **« Le framework échoue bruyamment, jamais silencieusement, et le dev et la prod passent par le même chemin de code. »**

---

## Phase 1 : Pipeline Déterministe & Zéro Dérive (Chantier 1)
- [x] Définir le schéma Zod de `dist/manifest.json` avec version de schéma et hash de build.
- [x] Compilation et écriture atomique de `tailwind.<hash8>.css` dans `dist/public`.
- [x] Module unique `loadAssetManifest(mode)` pour dev et prod.
- [x] `velix start` refuse de démarrer si le manifest est absent ou si un fichier référencé manque.
- [x] Tests e2e complets (Playwright sans erreurs console, modification CSS avec invalidation de cache).
- [x] Diagnostiqueur `velix doctor` validant le manifest et la cohérence de l'environnement React.

---

## Phase 2 : Bundling Réel & Velix Pack (Chantier 2)
- [ ] Vrai bundling esbuild client avec découpage de code (`splitting: true`, `format: 'esm'`).
- [ ] Tailles réelles issues du métafichier esbuild (suppression des estimations arbitraires).
- [ ] Compilation Tailwind en processus via API node directe sans invocation lente de sous-processus `npx`.
- [ ] Erreurs explicites au lieu de retours silencieux de CSS brut.
- [ ] `velix build` propulsé par Pack par défaut.
- [ ] Mesure et reporting des gains de performances dans `docs/pack-benchmarks.md`.

---

## Phase 3 : Streaming SSR & Alignement Technique (Chantier 3)
- [ ] Remplacement de `renderToString` par `renderToPipeableStream`.
- [ ] Émission rapide du premier octet (`onShellReady`) et gestion d'erreurs réactive (`onShellError` -> 500).
- [ ] Stratégie dédiée pour les robots d'indexation et la génération statique (`onAllReady`).
- [ ] Prise en charge native de la convention `loading.tsx` avec `<Suspense>`.
- [ ] Clarification de la documentation et du README (SSR streamé + îles, sans allégations RSC non implémentées).
- [ ] Tests de latence TTFB et non-régression de l'hydratation.
