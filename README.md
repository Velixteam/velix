<div align="center">

<img src="./assets/flexireact.webp" alt="FlexiReact Logo" width="280" />

# ⚡ FlexiReact v4.1

### The Edge-First React Framework

[![npm version](https://img.shields.io/npm/v/@flexireact/core.svg?style=flat-square&color=00FF9C&labelColor=0a0a0a)](https://www.npmjs.com/package/@flexireact/core)
[![npm downloads](https://img.shields.io/npm/dm/@flexireact/core.svg?style=flat-square&color=00FF9C&labelColor=0a0a0a)](https://www.npmjs.com/package/@flexireact/core)
[![License](https://img.shields.io/badge/license-MIT-00FF9C.svg?style=flat-square&labelColor=0a0a0a)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-native-3178c6.svg?style=flat-square&labelColor=0a0a0a)](https://www.typescriptlang.org/)

A modern React framework focused on **performance**, **clarity** and **modern React APIs**.  
Inspired by Next.js, Remix and Astro — but simpler, lighter and edge-native.

[Quick Start](#-quick-start) · [Features](#-features) · [Documentation](#-documentation) · [Roadmap](#-roadmap)

</div>

---

## 🚀 Quick Start

```bash
npx create-flexireact my-app
cd my-app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start building! 🎉

---

## ✨ Why FlexiReact?

FlexiReact is for developers who want:

| Feature | Description |
|---------|-------------|
| ⚛️ **Modern React** | React 19, Server Components, Server Actions, Suspense |
| 🏝️ **Islands** | Partial hydration — zero JS for static content |
| ⚡ **Edge-First** | Runs on Node, Bun, Deno, Cloudflare Workers |
| 📁 **File Routing** | Three conventions: `routes/`, `app/`, `pages/` |
| 🎯 **Explicit** | No hidden caching, no magic behavior |

---

## 🧩 Features

### ⚛️ React 19 Native

```tsx
// Server Component (default)
export default async function Page() {
  const data = await db.query('SELECT * FROM posts');
  return <PostList posts={data} />;
}
```

```tsx
'use client';
// Client Component
export function LikeButton() {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>❤️</button>;
}
```

### 🏝️ Islands Architecture

Only hydrate what needs interactivity:

```tsx
'use island';

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

### 📁 File-Based Routing

```
routes/
├── home.tsx           → /
├── about.tsx          → /about
├── blog/
│   ├── index.tsx      → /blog
│   └── [slug].tsx     → /blog/:slug
└── api/
    └── users.ts       → /api/users
```

### 🔌 API Routes

```ts
// routes/api/users.ts
export async function GET() {
  return Response.json({ users: await getUsers() });
}

export async function POST(req: Request) {
  const body = await req.json();
  return Response.json({ created: true });
}
```

### 🛡️ Middleware

```ts
// middleware.ts
export default function middleware(request) {
  if (!request.headers.get('authorization')) {
    return Response.redirect('/login');
  }
}

export const config = {
  matcher: ['/dashboard/:path*']
};
```

---

## 🖥️ Rendering Modes

| Mode | Description |
|------|-------------|
| **SSR** | Server-side rendering (default) |
| **SSG** | Static generation at build time |
| **ISR** | Incremental Static Regeneration |
| **Streaming** | Progressive HTML rendering |

```tsx
// Enable ISR with revalidation
export const revalidate = 60; // seconds

export default function Page() {
  return <div>This page revalidates every 60s</div>;
}
```

---

## 🛠️ CLI

```bash
# Create & Run
npx create-flexireact my-app    # Create new project
flexi dev                        # Development server
flexi build                      # Production build
flexi start                      # Start production server

# Scaffolding
flexi g page dashboard           # Generate page
flexi g component Button         # Generate component
flexi g api users                # Generate API route

# Utilities
flexi doctor                     # Diagnose issues
flexi upgrade                    # Upgrade FlexiReact
```

---

## ⚙️ Configuration

Create a `flexireact.config.ts` in your project root:

```ts
// flexireact.config.ts
import { defineConfig } from '@flexireact/core/config';

export default defineConfig({
  // Directories
  pagesDir: 'pages',
  layoutsDir: 'layouts',
  publicDir: 'public',
  outDir: '.flexi',

  // Server
  server: {
    port: 3000,
    host: 'localhost'
  },

  // Build
  build: {
    target: 'es2022',
    minify: true,
    sourcemap: true
  },

  // Features
  islands: {
    enabled: true
  },
  rsc: {
    enabled: true
  },
  ssg: {
    enabled: false,
    paths: []
  }
});
```

Configuration is validated with Zod. Invalid options will show clear error messages.

---

## 📦 Packages

| Package | Description |
|---------|-------------|
| [`@flexireact/core`](https://www.npmjs.com/package/@flexireact/core) | Core framework |
| [`create-flexireact`](https://www.npmjs.com/package/create-flexireact) | Project scaffolding CLI |
| `@flexireact/flexi-ui` | UI component library (coming soon) |

---

## 🛣️ Roadmap

### v4.x (Current)
- [x] React 19 support
- [x] Islands architecture
- [x] File-based routing (3 conventions)
- [x] SSR / SSG / ISR
- [x] Middleware system
- [ ] Plugin system v1
- [ ] Image optimization

### v5 (Future)
- [ ] Unified compiler pipeline
- [ ] First-class plugin ecosystem
- [ ] Advanced DevTools
- [ ] Partial Prerendering (PPR)

---

## 🤝 Contributing

FlexiReact is open-source and community-driven.  
Contributions, feedback and discussions are welcome!

---

## 📄 License

MIT © FlexiReact Team

---

<div align="center">

**Built with ❤️ for developers who value clarity and performance.**

[⬆ Back to top](#-flexireact-v41)

</div>