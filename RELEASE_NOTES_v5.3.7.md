# Release Notes — Velix v5.3.7

**Release Date:** October 18, 2026  
**Status:** Stable  
**Release Tag:** `v5.3.7`  
**License:** MIT  

---

## Executive Summary

Velix **v5.3.7** is a critical stability, developer experience (DX), and standards-compliance release across the entire Velix monorepo ecosystem. 

This release resolves cross-browser console warnings in modern browsers (Firefox, Safari, Chrome), eliminates fatal Hot Module Replacement (HMR) script blocking caused by missing MIME types in monorepo workspaces, fixes CSS specification violations with Tailwind CSS compilation, and streamlines internal workspace dependency resolution for reliable builds and distribution.

---

## 1. Key Highlights & Resolved Issues

### 1.1 Web Vitals & Cross-Browser `PerformanceObserver` Guard
- **Symptom:** In Firefox and Safari consoles, developers encountered:
  ```text
  entryTypes layout-shift ignoré, car non pris en charge. [docs:294:8]
  ```
- **Root Cause:** In the Velix Devtools overlay, web vitals collection invoked `new PerformanceObserver(...).observe({ type: 'layout-shift', buffered: true })`. While Chromium engines natively support Cumulative Layout Shift (`layout-shift`), Firefox and Safari do not implement this specific entry type in their `PerformanceObserver` specification implementation. Per the W3C Performance Timeline spec, calling `.observe()` with unsupported entry types produces a console warning.
- **The Fix:**
  - Implemented dynamic runtime feature detection in `packages/velix/server/devtools.ts`.
  - All Web Vital observers (`paint` for FCP, `largest-contentful-paint` for LCP, `layout-shift` for CLS, and `navigation` for TTFB) are now strictly guarded by inspecting `PerformanceObserver.supportedEntryTypes`:
    ```javascript
    var supported = (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes) || [];
    if (supported.includes('layout-shift')) {
      new PerformanceObserver(function(l){ ... }).observe({ type:'layout-shift', buffered:true });
    }
    ```
  - Result: Zero console noise in Firefox, Safari, or older browsers while retaining full metric accuracy in Chromium.

---

### 1.2 HMR Client Resolution & MIME-Type Compliance
- **Symptom:** Browser blocked the HMR client script with:
  ```text
  Le chargement du module à l’adresse « http://localhost:3000/__velix/hmr-client.js » a été bloqué en raison d’un type MIME interdit (« »).
  Échec du chargement pour le module dont la source est « http://localhost:3000/__velix/hmr-client.js ».
  ```
- **Root Cause:**
  1. **Monorepo Directory Mismatch:** When executing `velix dev` inside an application folder (such as `website/`), `process.cwd()` pointed to `website/`, whereas the source and compiled client resided in the root monorepo packages (`packages/velix-react/`).
  2. **Empty MIME Type on 404:** When candidate paths failed to resolve the file, the server emitted a raw `404` status with no `Content-Type` header. Modern browsers strictly reject `<script type="module">` tags if the response headers do not match a valid JavaScript MIME type (`application/javascript` or `text/javascript`), completely breaking client hydration and HMR.
- **The Fix:**
  - **Comprehensive Multi-Tier Candidate Path Resolution (`packages/velix/server/index.ts`):** Added hierarchical resolution searching parent directories, monorepo roots (`../packages/velix-react/`), and local `dist/` folders.
  - **Guaranteed Valid Module Headers:** The endpoint now guarantees `Content-Type: application/javascript; charset=utf-8` and `Cache-Control: no-cache` in 100% of cases, including fallback stubs if source code is temporarily unavailable during offline edits.
  - **Build Pipeline Synchronization (`packages/velix/build.js`):** `@teamvelix/velix-react` bundles a browser-optimized `hmr-client.js`, which is now copied directly into `@teamvelix/velix/dist/hmr-client.js` during package compilation.

---

### 1.3 CSS Specification Compliance: Misplaced `@import` Fix
- **Symptom:** Browser CSS engine reported:
  ```text
  La règle « @import » n’est pas permise après toute règle valide autre que @charset et @layer.
  La feuille de style précédente a été ignorée. [tailwind.css:1582:8]
  ```
- **Root Cause:**
  - In `website/app/globals.css`, `@import url('https://fonts.googleapis.com/...');` was placed immediately after `@import "tailwindcss";`.
  - When Tailwind CSS v4 processed the stylesheet, it injected all reset styles, theme variables, and utility classes above the font `@import`.
  - Under Section 5 of the W3C CSS Cascading and Inheritance Specification, any `@import` rule appearing after a style rule is invalid and causes compliant CSS engines to ignore or drop subsequent statements.
- **The Fix:**
  - Removed the inline `@import` from `website/app/globals.css`.
  - Font loading is standardized via high-performance HTML `<link rel="preconnect">` and `<link rel="stylesheet">` tags in `website/app/layout.tsx`.
  - Cleaned and regenerated `website/public/tailwind.css` to ensure zero misplaced `@import` declarations.

---

### 1.4 Elimination of Invalid CSS Custom Directives
- **Symptom:** Browser console warning:
  ```text
  Propriété « velix » inconnue. Déclaration abandonnée. [tailwind.css:1247:5]
  ```
- **Root Cause:** An arbitrary CSS rule class `.[velix:ssr] { velix: ssr; }` was emitted into the production CSS stylesheet. Browsers discarded the entire declaration due to the unrecognized property `velix`.
- **The Fix:**
  - Purged the invalid directive from the CSS pipeline and generated stylesheets.

---

### 1.5 Monorepo Package Linking & Dependency Topology
- **Symptom:** Monorepo package builds failing with:
  ```text
  ERR_PNPM_NO_MATCHING_VERSION: No matching version found for @teamvelix/...
  ```
- **Root Cause:** Monorepo packages referenced sibling `@teamvelix/*` packages via semver strings (`^5.3.7`) that did not exist yet on the public npm registry. Without workspace protocol enforcement, pnpm attempted to resolve unpublished versions from `registry.npmjs.org`.
- **The Fix:**
  - Configured `link-workspace-packages=true` in root `.npmrc`.
  - Transitioned internal monorepo dependencies across all packages and the website to the `workspace:*` protocol.
  - When published via `pnpm publish`, `workspace:*` references are automatically transformed into fixed semver requirements (`^5.3.7`).

---

## 2. Monorepo Package Matrix (All Bumped to `v5.3.7`)

| Package Name | New Version | Scope / Purpose |
| :--- | :--- | :--- |
| **`@teamvelix/velix`** | `5.3.7` | Main framework orchestrator, server, islands & routing engine |
| **`@teamvelix/velix-core`** | `5.3.7` | Core platform-agnostic routing, caching, and plugin architecture |
| **`@teamvelix/velix-react`** | `5.3.7` | React 19 bindings, SSR renderer, and HMR overlay client |
| **`@teamvelix/cli`** | `5.3.7` | Velix command line interface (`velix dev`, `velix build`, `velix doctor`) |
| **`@teamvelix/velix-pack`** | `5.3.7` | Incremental bundler and compiler engine |
| **`@teamvelix/cache-redis`** | `5.3.7` | Redis cache adapter with atomic tagging and prefix support |
| **`create-velix-app`** | `5.3.7` | Zero-config scaffolding CLI for new Velix projects |
| **`website`** | `5.3.7` | Official documentation and marketing website |

---

## 3. Migration & Verification Guide

### Upgrading an Existing Project

Update your `package.json` dependencies:

```json
{
  "dependencies": {
    "@teamvelix/velix": "^5.3.7"
  },
  "devDependencies": {
    "@teamvelix/cli": "^5.3.7"
  }
}
```

Run your package manager to update:
```bash
# Using pnpm
pnpm update @teamvelix/velix @teamvelix/cli

# Using npm
npm install @teamvelix/velix@^5.3.7 @teamvelix/cli@^5.3.7

# Using bun
bun update @teamvelix/velix @teamvelix/cli
```

### Verification Checklist

1. **Check System Health:**
   ```bash
   velix doctor
   ```
2. **Start Dev Server:**
   ```bash
   velix dev
   ```
   - Verify server startup (typically `< 350ms`).
   - Open browser developer tools and confirm zero console warnings on Web Vitals or HMR modules.
3. **Validate Production Build:**
   ```bash
   velix build
   ```
   - Confirm all SSR routes, static pages, and hashed Tailwind CSS bundles build without errors.

---

## 4. Contributors & Acknowledgments

Thanks to the Velix core team, Florynx Labs, and community contributors for identifying, reporting, and validating these fixes.

For bug reports and discussions, visit our [GitHub Repository](https://github.com/Velixteam/velix).
