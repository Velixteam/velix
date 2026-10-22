# Futures Mises à Jour et Évolutions de Velix

Ce document présente les chantiers et améliorations planifiés pour les versions ultérieures de Velix.

---

## 1. Moteur de Bundling & Runtime
- **Support natif de React Server Components (RSC)** avec Flight protocol (remplaçant le compromis SSR streaming + îles).
- **Import Maps automatiques** pour le chargement granulaire des dépendances tierces sans bundling monolithique.
- **Support des Workers Edge universels** (Cloudflare Workers, Deno Deploy, Vercel Edge Runtime) avec génération d'un adaptateur de build unique.
- **Incrémentalité avancée du cache** partagé entre machines en CI via remote caching Redis / S3.

---

## 2. DX & Outillage Développeur
- **Overlay d'erreurs runtime unifié** connecté directement aux sourcemaps d'esbuild.
- **Typage automatique des loaders et server actions** généré par compilation TS en arrière-plan sans étape manuelle.
- **Générateur de schémas de routes typés** (`velix/link` avec autocomplétion des routes et paramètres dynamiques).

---

## 3. Performance & Optimisations
- **Préchargement intelligent des chunks** basé sur l'observation des liens visibles (`IntersectionObserver` sur balises `<a href="...">`).
- **Compression Brotli/Zstandard intégrée** dans `velix start` pour les assets statiques et les flux SSR.
- **Optimisation d'images en pipeline** automatique (conversion WebP/AVIF à la volée ou pré-générée au build).
