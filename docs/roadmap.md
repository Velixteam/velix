# Velix v5 Roadmap 🚀

Velix v5 is designed to be a complete ecosystem. Below is our vision for the next set of official plugins and features.

## Core Refinements (Q2 2026)
- **✅ Enhanced DevTools**: Visual state indicators (orange=rendering, green=compiling, blue=navigating) inspired by Next.js latest. Real-time status updates via HMR.
- **✅ Improved Error Pages**: Beautiful 404/500 error pages with stack traces in development mode.
- **✅ Advanced Link Component**: Client-side navigation with prefetch strategies (immediate, hover, visible) and scroll management.
- **✅ Revalidation API**: `revalidatePath()` and `revalidateTag()` for cache invalidation, inspired by Next.js.
- **Edge-First Rendering**: Enhance the server to support more edge-compatible runtimes beyond Node.js.
- **Auto-Image Optimization**: Built-in plugin for WebP conversion and lazy-loading.

## Official Plugins 📦

### 🔐 velix-auth
*Status: Planning*
- Zero-config authentication for Velix apps.
- Support for OAuth2, JWT, and Session-based auth.
- Built-in `<AuthGuard>` and `useSession()` hooks.

### 🤖 velix-ai
*Status: ✅ Released v1*

**Vision**: Native AI integration for Velix apps with zero-config setup and streaming support.

**Core Features**:
- **Multi-Provider Support**: Google Gemini, OpenAI, Anthropic Claude, Mistral AI, and local models (Ollama)
- **Streaming Hooks**: `useAI()` for real-time streaming responses to React components
- **Server Actions Integration**: `aiAction()` wrapper for AI-powered server actions
- **Tool Calling**: Native support for function calling and server action execution
- **Context Management**: Automatic conversation history and context window management
- **Type Safety**: Full TypeScript support with schema validation (Zod integration)

**API Design**:
```typescript
import { useAI, aiAction, defineAIProvider } from 'velix/ai';

// Client-side streaming
const { messages, send, isLoading } = useAI({
  provider: 'gemini',
  model: 'gemini-2.0-flash-exp',
  systemPrompt: 'You are a helpful assistant',
});

// Server action with AI
export const generateContent = aiAction(async (prompt: string) => {
  const result = await ai.generate({
    model: 'gpt-4o',
    prompt,
    tools: [searchDatabase, sendEmail],
  });
  return result;
});

// Custom provider configuration
defineAIProvider({
  name: 'custom-llm',
  apiKey: process.env.CUSTOM_API_KEY,
  endpoint: 'https://api.custom.ai/v1',
});
```

**Advanced Features**:
- **RAG Support**: Built-in vector search and embedding generation
- **Prompt Caching**: Automatic caching of system prompts and context
- **Rate Limiting**: Built-in rate limiting and quota management
- **Cost Tracking**: Monitor API usage and costs in DevTools
- **Streaming UI**: Pre-built components for chat interfaces and loading states

**Roadmap**:
- Q2 2026: Beta release with Gemini and OpenAI support
- Q3 2026: Add Anthropic Claude, Mistral, and local model support
- Q4 2026: RAG features, vector search, and advanced tooling

### 📊 velix-analytics
*Status: Planning*
- Lightweight, privacy-first analytics.
- Heatmaps and session recordings without external scripts.
- Integrated dashboard in Velix DevTools.

### 🗄️ velix-db (Mini-ORM)
*Status: Planning / Inspired by Prisma*
- Type-safe communication between Frontend and Backend.
- Schema-first design (define once, use everywhere).
- Integrated migrations and seeding.
- High-security default (auto-injection protection).

---

## 🔍 SEO & Metadata System (Q3 2026)
*Status: Planning — High Priority*

**Goal**: First-class SEO with zero config, on par with Next.js 14+ but with better defaults.

### File-based SEO Conventions
- **`app/sitemap.ts`** — export a `Sitemap` function that returns a typed array of URLs; Velix auto-serves `/sitemap.xml`
- **`app/robots.ts`** — export a `Robots` function; Velix auto-serves `/robots.txt`
- **`app/opengraph-image.tsx`** — export a React component using a canvas/SVG DSL; Velix renders it server-side to a PNG and serves it at `/opengraph-image.png`
- **`app/icon.tsx`** — dynamic favicon generation

```typescript
// app/sitemap.ts
import type { Sitemap } from 'velix';

export default function sitemap(): Sitemap {
  return [
    { url: 'https://example.com', lastModified: new Date(), priority: 1 },
    { url: 'https://example.com/about', changeFrequency: 'monthly', priority: 0.8 },
  ];
}

// app/robots.ts
import type { Robots } from 'velix';

export default function robots(): Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/private/' },
    sitemap: 'https://example.com/sitemap.xml',
  };
}
```

### Metadata Enhancements
- **`generateMetadata(params, searchParams)`** — already supported; extend to accept parent metadata for inheritance
- **`generateViewport()`** — separate viewport export to control `theme-color`, `width`, `initial-scale`
- **Structured Data (JSON-LD)** — `<JsonLd schema={...} />` component that renders `<script type="application/ld+json">` server-side
- **Canonical URLs** — auto-generated from route unless overridden in metadata
- **Automatic OG fallback** — if no `og:image` is declared, Velix generates a default branded card from the page `title`

```typescript
// app/blog/[slug]/page.tsx
export function generateMetadata(params, { parent }) {
  const post = getPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      images: [{ url: `/og?title=${post.title}`, width: 1200, height: 630 }],
    },
    alternates: { canonical: `/blog/${params.slug}` },
  };
}
```

---

## ⚡ Advanced Server Actions (Q3 2026)
*Status: Planning — High Priority*

**Goal**: Full React 19 server action ergonomics with progressive enhancement, security guards, and real-world form patterns.

### Form-First API
- **`useActionState(action, initialState)`** — wraps a server action, returns `[state, dispatch, isPending]`; mirrors React 19's `useActionState`
- **`useFormStatus()`** — `{ pending, data, method, action }` inside any form child component
- **`useOptimistic(state, reducer)`** — instant UI update before server confirms; auto-rollback on error
- **Progressive enhancement** — all form actions work without JavaScript (real `<form action={...}>` serialisation)

```typescript
// Server action — app/actions.ts
'use server';
import { action } from 'velix/server';

export const createPost = action(
  async (prev, formData: FormData) => {
    const title = formData.get('title') as string;
    if (!title) return { error: 'Title is required' };
    await db.post.create({ data: { title } });
    return { success: true };
  },
  { auth: true, rateLimit: '10/min' }  // built-in guards
);

// Client component
'use client';
import { useActionState, useFormStatus } from 'velix/client';
import { createPost } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;
}

export function PostForm() {
  const [state, dispatch] = useActionState(createPost, null);
  return (
    <form action={dispatch}>
      <input name="title" />
      {state?.error && <p>{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
```

### Action Middleware
- **`action(fn, options)`** wrapper: `auth`, `rateLimit`, `validate(ZodSchema)`, `csrf` — each option injects server-side middleware automatically
- **`after(fn)`** — run side-effects (analytics, emails, queue jobs) after the response is sent, without blocking the user
- **File uploads** — `formData.file('avatar')` returns a typed `VelixFile` object with MIME validation and size limits built in

---

## 🛡️ Security by Default (Q3 2026)
*Status: Planning — High Priority*

**Goal**: Make secure apps the path of least resistance. No config needed for common attack vectors.

- **Automatic CSRF Tokens** — all `<form>` elements rendered by Velix get a hidden CSRF token; `action()` wrapper validates it automatically
- **Content Security Policy (CSP)** — `velix.config.ts` `security.csp` option generates a strict CSP header; nonces injected into inline scripts automatically
- **Secure Headers** — opt-in preset applying `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` with one config line
- **Environment variable validation** — `defineEnv(schema)` in `velix.config.ts` validates required env vars at startup and throws a readable error in dev
- **Secrets scanning** — build-time warning if a `NEXT_PUBLIC_`-style or `VITE_`-style secret is accidentally exposed to the client bundle

```typescript
// velix.config.ts
import { defineConfig, defineEnv } from 'velix';
import { z } from 'zod';

export default defineConfig({
  security: {
    csp: 'strict',           // 'strict' | 'moderate' | false
    headers: true,           // adds all secure headers
    csrf: true,              // auto-CSRF on all forms
  },
  env: defineEnv({
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET: z.string().startsWith('sk_'),
  }),
});
```

---

## 🚀 Rendering & Performance (Q3–Q4 2026)
*Status: Planning*

### Partial Prerendering (PPR)
- Static HTML shell + dynamic streaming holes — render the page skeleton at build time and stream dynamic parts at request time
- Enable per-route: `export const ppr = true` in a page or layout
- Works with `<Suspense>` boundaries; static parts never re-render on the server

### Streaming & Suspense Conventions
- **`loading.tsx`** — file-based loading skeleton; automatically wraps the page in a `<Suspense>` boundary while data fetches
- **`error.tsx`** — file-based error boundary with a typed `reset()` function
- **`not-found.tsx`** — already planned; extend with typed metadata support
- **`template.tsx`** — re-mounts on every navigation (unlike `layout.tsx`) for animations and per-page effects

### Built-in Font Optimisation (`velix/font`)
- Self-hosts Google Fonts at build time, eliminating render-blocking external requests
- Zero layout shift via `font-display: optional` by default
- CSS variables and Tailwind class output

```typescript
import { Inter, Geist_Mono } from 'velix/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono  = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });
```

### Third-Party Script Loading (`velix/script`)
- `<Script strategy="afterInteractive" | "lazyOnload" | "worker">` — load analytics, chat widgets, etc. without blocking LCP
- Partytown integration for offloading scripts to a Web Worker

### Bundle Analysis
- `velix build --analyze` — opens a visual treemap (powered by `rollup-plugin-visualizer`) showing each route's bundle size
- Per-route size budget: `export const sizeLimit = '50kb'` warns at build time if exceeded

---

## 📖 Documentation & Developer Experience (Q4 2026)
*Status: Planning*

**Goal**: Best-in-class docs with real examples, not just API reference.

### Interactive Playground
- Browser-based sandbox at `velix.dev/play` — write Velix code, see SSR output and hydration in real time
- Share snippets via URL (like TypeScript Playground)

### Real-World Example Apps
- **`examples/blog`** — full MDX blog with sitemap, RSS, OG images, and reading time
- **`examples/saas-starter`** — auth, billing (Stripe), dashboard, protected routes, email (Resend)
- **`examples/ecommerce`** — product catalog, cart with optimistic updates, checkout server actions
- **`examples/ai-chat`** — streaming chat with `velix-ai`, tool calling, and conversation history

### Documentation Structure
- **Guides** — step-by-step for each real-world pattern (forms, auth, data fetching, SEO)
- **API Reference** — auto-generated from JSDoc + TypeScript, always in sync
- **Migration Guide** — side-by-side comparison with Next.js 14 patterns
- **Performance Checklist** — a scored audit checklist developers can run against their app

### TypeScript Improvements
- `velix/types` — exported utility types: `VelixPage`, `VelixLayout`, `VelixAction`, `VelixMetadata`
- Stricter generic inference on `generateMetadata` and route params
- IDE hover docs on all core exports (JSDoc on every public API)

---

## Versioning Policy
Velix follows Semantic Versioning (SemVer). Major versions will be released annually to coincide with React major releases.
