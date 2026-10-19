# Velix Roadmap

This roadmap lists what exists, what we are working on, and what is only an idea. It carries **no dates**: earlier versions of this file promised quarters that passed without the work landing, so we now only commit to order and status.

Legend: ✅ shipped · 🔧 in progress · 📋 planned · 💭 exploring (no commitment)

## ✅ Shipped

- File-based routing (`app/`), nested layouts, dynamic and catch-all routes
- Loaders (`defineLoader`), Server Actions v2 (Zod-validated), API routes in `server/api/`
- Islands hydration (`'use client'` / `'use island'`), server-side rendering with `renderToString`
- Revalidation API: `revalidatePath()` and `revalidateTag()`
- Error pages (`error.tsx`, `not-found.tsx`), dev overlay, HMR over WebSocket
- Tailwind plugin (v3 and v4)
- Image route: on-demand optimisation at `/__velix/image` (uses `sharp` when installed)
- `create-velix-app` templates, optional Redis cache adapter (`cache-redis`)
- Velix Pack **beta**: module graph, persistent cache in `.velix/cache/pack/`, esbuild transforms, `--pack` flag
- `velix-ai` **alpha**: `createAIClient`, `createAIAction`, `useAI`; OpenAI and Ollama providers only

## 🔧 Now: stabilisation

The goal is a framework that is trustworthy before it is bigger.

- Hashed asset filenames plus a manifest, so long-lived caching is safe (un-hashed files must be revalidated)
- End-to-end tests that build and run a template in dev and production
- Real bundling inside Velix Pack, so production builds use the same graph as dev
- Tailwind plugin: fail loudly instead of silently shipping unprocessed CSS
- Docs and website kept in sync with the code (this PR series)

## 📋 Next

- Streaming SSR (`renderToPipeableStream`), Suspense, and `loading.tsx` (needs streaming first)
- Reproducible, published benchmarks (`scripts/bench-build.mjs` is the starting point); no performance claims until then
- Edge adapters. Velix runs on the Node.js runtime today.
- File-based SEO conventions (`sitemap`, `robots`, `opengraph-image`) — metadata helpers exist, file conventions do not
- Font optimisation

## 💭 Exploring

These are ideas, not commitments, and the API snippets that used to live here were proposals that are **not implemented**.

- React Server Components and Partial Prerendering
- More `velix-ai` providers (Gemini, Anthropic, Mistral), tool calling, RAG helpers
- `velix-auth`, `velix-db`, `velix-analytics` plugins
- Velix Query / Velix Store
- Security-by-default helpers (env validation, CSRF for actions)
- Online playground
- A faster native compiler layer (only after benchmarks show the transform step is the bottleneck)

## Versioning

Velix follows [SemVer](https://semver.org). Breaking changes go in major releases, with migration notes in the changelog. There is no fixed release cadence.
