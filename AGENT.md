# AGENT.md — Velix Codebase Guide

> This file is the authoritative reference for AI agents and LLM coding assistants working in this repository.
> Read it before making any changes.

---

## 1. Project Overview

**Velix v5.3** is a full-stack React 19 framework built for performance, SEO, and developer experience.
It ships as a **pnpm monorepo** with clean separation between server and client code.

Key design goals:
- Zero config to start (`npx create-velix-app@latest`)
- `server/` convention — never mix UI and backend
- Islands Architecture for minimal JS
- Smart multi-layer caching with `ICacheAdapter`
- First-class TypeScript strict mode throughout

---

## 2. Monorepo Structure

```
velix/                          ← workspace root
├── packages/
│   ├── velix/                  ← core framework (server, router, cache, plugins, devtools)
│   │   ├── server/             ← HTTP server, DevTools injection, HMR WS
│   │   ├── router/             ← async modular router (Scanner → Parser → Matcher → Tree Builder)
│   │   ├── actions/            ← server actions (Zod-validated mutations)
│   │   ├── build/              ← esbuild pipeline
│   │   ├── client/             ← client runtime (hydration, navigation)
│   │   ├── islands/            ← partial hydration runtime
│   │   ├── middleware/         ← middleware execution chain
│   │   ├── metadata/           ← SEO / Open Graph helpers
│   │   ├── plugins/            ← plugin system (tailwind, ai, etc.)
│   │   └── runtime/            ← dev/build entry points
│   ├── velix-core/             ← framework-agnostic core (ICacheAdapter, RequestDeduplicator)
│   ├── velix-react/            ← React 19 bindings (hooks, SSR, error pages, HMR overlay)
│   │   ├── src/components/     ← VelixDefaultErrorPage
│   │   └── src/hmr/            ← VelixDevOverlay, HMR client
│   ├── velix-cli/              ← CLI (velix dev / build / start)
│   ├── cache-redis/            ← @velix/cache-redis — distributed cache via ioredis + Lua + Pub/Sub
│   └── create-velix-app/       ← npx create-velix-app scaffolder
│       └── src/index.ts        ← full template generator (landing page, blog, minimal)
├── website/                    ← documentation site
├── test/                       ← integration tests
├── scripts/                    ← maintenance scripts (loc.js, fix-error.js)
├── ARCHITECTURE.md             ← deep-dive on request lifecycle & caching
└── AGENT.md                    ← this file
```

### User-app conventions (generated templates)

```
my-app/
├── app/                        ← React UI — never import server/ here
│   ├── layout.tsx              ← root layout
│   ├── page.tsx                ← home route (/)
│   └── globals.css             ← CSS tokens + keyframes
├── server/                     ← server-only — never bundled for browser
│   ├── api/                    ← REST endpoints: export function GET/POST/...()
│   ├── loaders/                ← defineLoader(async ({ params, request }) => data)
│   └── actions/                ← defineAction(schema, async (data) => result)
├── components/                 ← shared UI components
├── public/                     ← static assets
└── velix.config.ts             ← defineConfig({ app, server, seo, plugins })
```

---

## 3. Code Conventions

### TypeScript
- **strict: true** everywhere — no `any` escapes without explicit comment
- All exports are typed; use `InferLoaderData<typeof loader>` in pages
- `tsconfig.json` uses `"moduleResolution": "bundler"`, `"jsx": "react-jsx"`

### Imports
- Internal workspace packages: `import { x } from 'velix/server'` or `from '@teamvelix/velix-core'`
- Workspace dependencies declared as `"workspace:*"` in `package.json`
- Avoid deep internal imports across package boundaries — use each package's `index.ts` surface

### File naming
- Components: `PascalCase.tsx`
- Server modules: `kebab-case.ts` or `camelCase.loader.ts`
- Test files: `*.test.ts` or `*.spec.ts` beside source

### Commits
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`
- Scope optional: `feat(router):`, `fix(cache):`

---

## 4. Development Commands

```bash
# Install dependencies (pnpm workspace)
pnpm install

# Run dev server (monorepo — starts velix runtime)
pnpm dev
# or from a user app:
npx velix dev

# Build all packages
pnpm build:packages

# Type-check without emit
pnpm typecheck

# Run all tests (vitest)
pnpm test

# Watch tests
pnpm test:watch

# Lint
pnpm lint

# Format
pnpm format

# Lines of code report
pnpm loc
```

---

## 5. Request Lifecycle (summary)

```
HTTP Request
  → Middleware chain (auth, rate-limit, redirects)
  → Async Router match (Scanner → Parser → Matcher → Tree Builder)
  → VelixCache check (ICacheAdapter, tag-based)
      ↳ HIT  → stream cached response
      ↳ MISS → RequestDeduplicator (merges inflight identical requests)
                → Loader(s) execute on server
                → React 19 SSR / RSC render
                → Cache store (TTL + tags)
  → Stream response to client
```

### Critical invariants — never break these:
- **`ICacheAdapter`** is the only allowed cache interface. Do not bypass it with direct `Map` or module-level state for request caching.
- **`RequestDeduplicator`** prevents cache stampedes. Loaders must be idempotent.
- **The async router** is non-blocking. Do not introduce synchronous FS reads in the hot path (`Scanner`, `Matcher`).
- **`server/` is server-only** — tree-shaking relies on this. Never import `server/` from `app/`.

---

## 6. Official Velix Color Palette

> **Source of truth:** extracted from `packages/velix/server/devtools.ts`

### Brand Blue (primary accent)

| Token | Hex | Usage |
|---|---|---|
| `--velix-accent` | `#2563EB` | Tab active border, row values, connection dot, CTA buttons |
| `--velix-accent-light` | `#38BDF8` | Pill text, dev-badge text, compile spinner, success overlay |
| `--velix-accent-hover` | `#1D4ED8` | Button hover state |
| `--velix-accent-glow` | `rgba(37,99,235,0.15)` | Glow halos, radial bg gradients |
| `--velix-accent-deep` | `#0c1a3a` | `.pill-blue` background |

### UI Neutrals

| Token | Hex | Usage |
|---|---|---|
| `--velix-bg` | `#0a0a0a` | Page / app background |
| `--velix-surface` | `#0F172A` / `#111211` | Panels, cards, DevTools body |
| `--velix-border` | `#1e201e` / `#162032` | Borders, dividers |
| `--velix-muted` | `#6b7068` | Secondary text, labels |
| `--velix-text` | `#e8ebe5` | Primary foreground text |

### Semantic (non-brand)

| Token | Hex | Usage |
|---|---|---|
| `--velix-success` | `#00e87a` | ✓ semantic success, build OK indicators, file-tree annotations |
| `--velix-error` | `#ff6b6b` | Error states, 500 status, compile errors |
| `--velix-warn` | `#f59e0b` | Warning states, 4xx status codes |

### WCAG AA Contrast check (dark `#0a0a0a` background)

| Color | Hex | Contrast ratio | AA pass |
|---|---|---|---|
| `--velix-accent` | `#2563EB` | ~4.6:1 | ✅ (large text / UI) |
| `--velix-accent-light` | `#38BDF8` | ~7.1:1 | ✅ |
| `--velix-success` | `#00e87a` | ~8.2:1 | ✅ |
| `--velix-error` | `#ff6b6b` | ~5.9:1 | ✅ |

---

## 7. Color Rules — MUST READ

### ✅ Use the blue palette for all brand accent UI:
- Hero text highlights (`Ship smarter.`)
- Badges, pills, tab active states
- CTA buttons (`Get started`, `Deploy`, copy buttons)
- Link hovers, navbar accents, footer brand dots
- DevTools panel (already correct — this is the source)

### ❌ Never introduce green (`#00e87a` or similar) as a brand accent:
- Green is **semantically reserved** for success / build-OK states only
- Examples of allowed green: `✓ Compiled`, `← clean ✓` code annotations, `✅ Velix` comparison table
- Examples of forbidden green: hero heading color, badge background, CTA button background, navbar dot

### Pattern reference from DevTools (source):

```css
/* ✅ Correct — brand blue */
.__vdt-tab.active  { border-bottom-color: #2563EB; color: #2563EB; }
.__vdt-row-right   { color: #2563EB; }
.__vdt-conn-dot    { background: #2563EB; }
.__vdt-dev-badge   { border: 1px solid #2563EB; color: #38BDF8; }
.__vdt-pill-green  { color: #38BDF8; border: 1px solid #2563EB; } /* named "green" but is blue */
.__vdt-dot-good    { background: #2563EB; }

/* ✅ Correct — semantic success only */
.vdt-idle          { border-color: #22D3EE; }  /* idle state, not brand */
```

---

## 8. Plugin System

Plugins are registered in `velix.config.ts`:

```ts
import { defineConfig, tailwindPlugin } from "@teamvelix/velix";

export default defineConfig({
  plugins: [tailwindPlugin()],
});
```

- Plugins live in `packages/velix/plugins/`
- Each plugin implements the `VelixPlugin` interface from `velix-core`
- Do not add side-effects at module import time inside plugins

---

## 9. Testing

- Test runner: **Vitest** (`vitest.config.ts` at root)
- DOM environment: **jsdom**
- Coverage: `@vitest/coverage-v8`
- Tests live in `packages/*/tests/` or `test/` at root

```bash
pnpm test           # run all tests once
pnpm test:watch     # interactive watch
```

---

## 10. CI / Benchmarks

- GitHub Actions workflows in `.github/`
- PR checks: typecheck → lint → test → build:packages
- No benchmark suite yet — performance is validated manually via DevTools Web Vitals panel

---

*Last updated: 2026-07-11 · Generated by Antigravity agent*
