# Known Issues & Neighboring Bugs

This document tracks bugs and edge cases encountered in related components that should not be fixed ad-hoc during focused feature branches.

---

### 1. Development HMR Client Loading in Monorepo Subfolders
- **Location:** `packages/velix/server/index.ts` line ~764
- **Observation:** `/__velix/hmr-client.js` is searched via relative directory lookups. If dev server is launched from a subfolder without proper node resolution, it can fallback to empty stub or trigger MIME type warnings in strict browser configurations.
- **Status:** Documented; client bundling in production now bypasses HMR routes completely.

### 2. Duplicate React Detection with Pnpm Monorepos
- **Location:** `packages/velix-cli/commands/doctor.ts` line ~178
- **Observation:** `pnpm why react` shell command fails when the project is not run within a pnpm root or when executed in standalone npm projects (e.g. freshly created test projects).
- **Status:** Requires native Node resolution fallback (`import.meta.resolve` / `require.resolve`).

### 3. Route Parameter Regex Parsing for Complex Catch-Alls
- **Location:** `packages/velix-core/src/router/parser.ts`
- **Observation:** Nested optional catch-alls `[[...slug]]` may collide with single-segment parameters under specific sorting conditions.
