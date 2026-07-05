# Contributing to Velix

Thank you for contributing to Velix! This guide explains the project architecture, coding conventions, and the process for submitting contributions.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Package Boundaries](#package-boundaries-strict-rule)
- [Development Setup](#development-setup)
- [Adding a New Feature](#adding-a-new-feature)
- [Adding a New Router Feature](#adding-a-new-router-feature)
- [Cache Adapter Development](#cache-adapter-development)
- [Pull Request Guidelines](#pull-request-guidelines)

---

## Architecture Overview

Velix is a pnpm monorepo consisting of the following packages:

| Package | Responsibility |
|---|---|
| `packages/velix-core` | Pure framework logic: async router, cache, config, middleware, plugins. **Zero React dependencies.** |
| `packages/velix-react` | React adapter: hooks (`useAction`, `useIsland`), components (`<Link>`, `<Head>`), client/server bridge |
| `packages/velix-cli` | CLI tool: commands `velix dev`, `velix build`, `velix start`. Consumes `velix-core` |
| `packages/create-velix-app` | Scaffolding: `npx create-velix-app`. Generates the initial structure of a Velix app |
| `@velix/cache-redis` | Optional Redis adapter: implements `ICacheAdapter` via `ioredis`. Peer dependency on Redis >=5 |

### Dependency Diagram

```
create-velix-app
      ↓
  velix-cli
      ↓
   velix ← velix-react
      ↓
 velix-core

@velix/cache-redis
      ↓ (peer)
 velix-core/cache/adapter
```

---

## Package Boundaries (Strict Rule)

These rules are enforced by lint checks and must be respected in every PR:

| Rule | Explanation |
|---|---|
| `velix-core` **must NEVER** import React | Core logic remains framework-agnostic |
| `velix-react` **can** import `velix-core` | It is its only allowed dependent |
| `@velix/cache-redis` **must not** import `velix-react` | The Redis adapter is headless |
| `velix-cli` **must not** import `velix-react` | The CLI runs on the server side only |

> [!WARNING]
> Any violation of these boundaries is grounds for immediate rejection of the PR, regardless of code quality.

---

## Development Setup

```bash
# 1. Clone the repo
git clone https://github.com/velixteam/velix.git
cd velix

# 2. Install dependencies (pnpm workspaces)
pnpm install

# 3. Watch mode on all packages (automatic rebuild)
pnpm dev:packages

# 4. Run the test suite with coverage
pnpm test

# 5. TypeScript type checking on all packages
pnpm typecheck
```

### Useful Commands

| Command | Action |
|---|---|
| `pnpm dev:packages` | Watch mode (tsup --watch) on velix-core, velix-react, velix-cli |
| `pnpm test` | `vitest run --coverage` — 80% thresholds for statements/lines/functions |
| `pnpm typecheck` | `tsc --noEmit` on all packages |
| `pnpm build:packages` | Production build of all packages |
| `pnpm lint` | ESLint on all packages |

---

## Adding a New Feature

Following this order ensures types are available before implementation:

1. **Types** in `packages/velix-core/src/types/index.ts` or the types file of the concerned module
2. **Pure Logic** in `packages/velix-core/src/` (no React, no DOM-specific code)
3. **React Hooks / Components** in `packages/velix-react/src/` if the feature has a UI aspect
4. **Export** from the correct entry point:
   - Server logic → `velix/server`
   - Client logic → `velix/client`
   - Universal → `velix`
5. **Tests** with respected coverage thresholds (see Coverage section)
6. `tsc --noEmit` → **0 errors** before submitting the PR

### Mandatory Coverage

Global thresholds defined in `vitest.config.ts`:
- Lines: **80%**
- Statements: **80%**
- Functions: **80%**
- Branches: **75%**

---

## Adding a New Router Feature

The router is divided into submodules with strictly isolated responsibilities. Respecting these boundaries is **non-negotiable**:

| File | Single Responsibility | What it doesn't do |
|---|---|---|
| `scanner.ts` | Traverses the filesystem (fs.promises) | Doesn't know about route patterns |
| `parser.ts` | Converts `string → RegExp` and extracts params | Doesn't touch the filesystem |
| `matcher.ts` | Matches a URL against the route manifest | Doesn't know about files |
| `tree-builder.ts` | Assembles `RouteEntry[] → RouteTree` | Doesn't touch patterns |
| `index.ts` | Re-exports everything, single entry point | Doesn't contain logic |
| `types.ts` | Internal interfaces and types | Nothing else |

**Example: adding support for `(parallel)` routes**

```ts
// 1. Add the type in router/types.ts
export type RouteEntry = {
  // ...existing
  isParallelSlot?: boolean; // NEW
};

// 2. Detect in scanner.ts only
if (entry.name.startsWith('@')) {
  segmentName = `@${entry.name.slice(1)}`; // parallel slot
}

// 3. Parse in parser.ts only
// (no change needed if the pattern is already handled)

// 4. Tests in scanner.test.ts AND parser.test.ts
```

---

## Cache Adapter Development

To create a new cache adapter (e.g., Memcached, DynamoDB, Cloudflare KV):

### 1. Implement the ICacheAdapter interface

```ts
// packages/cache-xxx/src/xxx.adapter.ts
import type { ICacheAdapter, CacheSetOptions } from '@teamvelix/velix-core';
// or copy the interface locally to avoid circular dependencies

export class XxxCacheAdapter implements ICacheAdapter {
  async get<T>(key: string): Promise<T | null> { /* ... */ }
  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> { /* ... */ }
  async delete(key: string): Promise<void> { /* ... */ }
  async deleteByTag(tag: string): Promise<void> { /* ... */ }
  async deleteByPrefix(prefix: string): Promise<void> { /* ... */ }
  async clear(): Promise<void> { /* ... */ }
  async has(key: string): Promise<boolean> { /* ... */ }
}
```

### 2. Create a separate package

```
packages/cache-xxx/
  src/
    xxx.adapter.ts
    types.ts
    index.ts
  package.json    (name: @velix/cache-xxx)
  tsconfig.json
  README.md
```

### 3. Tests with a mock of the external service

```ts
// Use a mock of the dependency — no real service in test
import MockXxx from 'xxx-mock';
const adapter = new XxxCacheAdapter({ client: new MockXxx() });
```

### 4. README with configuration example

```ts
// velix.config.ts
import { defineConfig } from 'velix';
import { XxxCacheAdapter } from '@velix/cache-xxx';

export default defineConfig({
  cache: {
    adapter: new XxxCacheAdapter({ /* options */ }),
  },
});
```

---

## Pull Request Guidelines

**Basic Rules:**

- **One PR = one feature or fix**. No unrelated changes in the same PR.
- **Tests are mandatory** for any new code added.
- `pnpm typecheck` (`tsc --noEmit`) must pass **without errors**.
- **CI benchmarks must not regress**:
  - Build time: regression > **+20%** → CI fail
  - Bundle size: increase > **+10%** → PR comment warning

**PR Description (mandatory template):**

```markdown
## Why
<!-- What problem does this PR solve? Issue link if applicable -->

## What
<!-- Concise description of changes -->

## How to test
<!-- Commands to run to verify behavior -->

## Checklist
- [ ] Tests added / updated
- [ ] `pnpm typecheck` → 0 errors
- [ ] `pnpm test` → coverage thresholds respected
- [ ] Package boundaries respected
- [ ] README / docs updated if necessary
```

**PR Labels:**

| Label | Usage |
|---|---|
| `breaking-change` | Public API modified — requires a major bump |
| `performance` | Performance improvement or regression |
| `security` | Security fix — maximum priority |
| `dependencies` | Dependency updates only |
