# Velix Architecture

This document describes the high-level architecture of Velix, the request lifecycle, and our internal module design. Understanding this is crucial for core maintainers and contributors.

## High-Level Architecture

Velix is divided into several decoupled packages within the monorepo:

```mermaid
graph TD
    A[velix CLI / Build] --> B(velix-core)
    B --> C{Cache Interface}
    C --> D(Memory Cache)
    C --> E(@velix/cache-redis)
    A --> F(velix-react)
    B --> G(Modular Router)
    F --> H[React 19]
```

- **`velix-core`**: The backbone of the framework. It handles the non-blocking async router, the server environment, caching interfaces, and middleware execution. It is framework-agnostic at its core.
- **`velix-react`**: The React bindings. Provides hooks like `useAction`, `useLoaderData`, and the integration layer for React 19's Server Components and Islands architecture.
- **`@velix/cache-redis`**: A robust, atomic cache adapter using `ioredis`, ensuring consistency in multi-instance (serverless or container) deployments via Lua scripts and Pub/Sub.

## The Request Lifecycle

When a request enters a Velix server, it follows a strict, predictable pipeline:

1. **Incoming Request**: The raw HTTP request hits the Node.js / Edge server adapter.
2. **Middleware Phase**: Global middleware executes (auth checks, rate limiting, redirects).
3. **Router Matching**: The async modular router matches the URL to the corresponding tree node.
4. **Cache Check**: The `VelixCache` wrapper checks if a valid response exists. If it does, and no mutation is detected, the cached response is served immediately.
5. **Data Fetching (Loaders)**: For dynamic pages or cache misses, the associated `loader` runs on the server. `RequestDeduplicator` ensures that concurrent identical requests share the same loader promise.
6. **React Rendering**: `velix-react` renders the component tree to HTML or a React Flight stream (RSC).
7. **Response**: The final payload is streamed back to the client.

## Modular Async Router

The Velix router is fully asynchronous and non-blocking, designed to scale with thousands of routes without freezing the Node.js event loop during HMR or startup.

It is split into four distinct modules:
- **Scanner**: Recursively scans the `app/` directory asynchronously.
- **Parser**: Extracts dynamic segments and metadata.
- **Matcher**: Evaluates incoming URLs against the parsed route definitions.
- **Tree Builder**: Constructs the hierarchical route tree for nested layouts.

## Caching Strategy

Velix implements an extensible caching architecture based on the `ICacheAdapter` interface.

- **Deduplication**: `RequestDeduplicator` prevents cache stampedes by merging identical inflight requests.
- **Memory vs Redis**: The default is an in-memory cache, suitable for single-instance apps. For enterprise deployments, `@velix/cache-redis` provides distributed caching with atomic invalidation using Lua scripts and real-time HMR syncing via Redis Pub/Sub.
- **Tag-based Invalidation**: Cache entries can be tagged. Velix can atomically invalidate all entries sharing a specific tag (e.g., clearing all "posts" cache when a new post is published).

## File System Routing Rules

Velix enforces a strict separation between client code and server logic:
- `app/`: Client and Server UI (React). Follows standard file-based routing (`page.tsx`, `layout.tsx`).
- `server/`: Server-only logic. Code here is **never** bundled for the browser.
  - `server/api/`: REST/GraphQL endpoints.
  - `server/loaders/`: Data fetching for SSR.
  - `server/actions/`: Server Actions for mutations (powered by Zod validation).

This strict boundary guarantees that server secrets are never leaked and keeps the client bundle exceptionally small.
