# Problèmes et Anomalies Identifiés dans Velix

Ce document recense l'état des lieux des problèmes architecturaux et bugs identifiés dans Velix avant et pendant les chantiers de fiabilisation.

---

## 1. Pipeline de build et Manifeste (Chantier 1)
- **Déconnexion Build / Serveur Prod** : Le build copiait `public/` vers `dist/public`, mais le serveur de production servait `public/` et retombait silencieusement sur les sources.
- **Absence de hashing CSS** : Le CSS compilé par Tailwind était écrit dans `public/tailwind.css` sans hash de cache-busting, causant des problèmes de cache navigateur lors des déploiements.
- **Îlots compilés à la volée** : Dans `server/index.ts`, la route `/__velix/islands/<nom>.js` compilait les composants côté client à la demande en mémoire au lieu de faire partie des artefacts du build `dist/client/`.
- **Manifeste incomplet et non typé** : L'ancien `dist/manifest.json` contenait uniquement les routes sans hash de build, sans layouts, sans chunks client, sans styles ni inventaire d'assets.
- **Erreurs HMR client au build** : Si du code client référençait des modules de dev ou si les composants dans `components/` étaient ignorés par le scanner du build, le build client était absent (`only server files build`).
- **Absence de validation au démarrage** : `velix start` démarrait même si les artefacts du build étaient absents ou corrompus.

---

## 2. Bundling et Velix Pack (Chantier 2)
- **Faux bundling dans Velix Pack** : `velix-pack/src/bundler/index.ts` utilisait `bundle: false` et transpilait fichier par fichier sans résolution des dépendances ni chunks réels.
- **Tailles de chunks simulées** : `CodeSplitter` calculait des tailles fictives (`mod.path.length * 10`) au lieu de s'appuyer sur le métafichier réel d'esbuild.
- **Compilation CSS lente et vulnérable** : `transform/css.ts` exécutait `npx @tailwindcss/cli` via un sous-processus et masquait les erreurs en renvoyant le CSS brut sans lever d'exception.
- **Absence de Pack par défaut** : `velix build` n'utilisait pas Pack par défaut pour le bundling de production.

---

## 3. Rendu Serveur (SSR) et Hydratation (Chantier 3)
- **SSR bloquant** : `packages/velix/server/index.ts` utilisait `renderToString`, bloquant le premier octet (TTFB élevé) jusqu'à ce que toute l'arborescence soit résolue, rendant les balises `<Suspense>` inopérantes pour le streaming.
- **Injection HTML par manipulation de chaînes** : L'injection de `<head>`, styles et scripts reposait sur `lastIndexOf('</head>')` et `lastIndexOf('</body>')` au lieu d'utiliser l'API native de streaming (`renderToPipeableStream` avec `bootstrapModules` / insertion propre).
- **Incohérence SEO pour les robots** : Pas de distinction claire entre rendu streamé pour navigateurs et attente complète (`onAllReady`) pour les robots d'indexation (crawlers) et le SSG/ISR.
- **Allégations erronées dans la documentation** : Mention de "React 19 Server Components" (RSC) alors que le framework implémente actuellement du SSR classique avec îles d'hydratation.
