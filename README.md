<p align="center">
  <img src="./assets/flexireact.webp" alt="FlexiReact Logo" width="360" />
</p>

<h1 align="center">⚡ FlexiReact v4</h1>

<p align="center">
  <strong>An Edge-First React Framework</strong>
</p>

<p align="center">
  A modern React framework focused on <b>performance</b>, <b>clarity</b> and <b>modern React APIs</b>.<br/>
  Inspired by Next.js, Remix and Astro — but simpler, lighter and edge-native.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@flexireact/core">
    <img src="https://img.shields.io/npm/v/@flexireact/core.svg?color=00FF9C" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@flexireact/core">
    <img src="https://img.shields.io/npm/dm/@flexireact/core.svg?color=00FF9C" alt="npm downloads" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-00FF9C.svg" alt="License: MIT" />
  </a>
  <img src="https://img.shields.io/badge/TypeScript-Native-blue.svg" alt="TypeScript Native" />
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-cli">CLI</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

---

## 🚀 Quick Start

```bash
npx create-flexireact my-app
cd my-app
npm run dev
Open http://localhost:3000 🎉

✨ What is FlexiReact?
FlexiReact is a full-stack React framework designed for developers who want:

modern React APIs (React 19, Actions, Suspense)

explicit and predictable behavior

partial hydration with Islands

edge-first deployment

minimal tooling complexity

It does not try to replace Next.js —
it offers an alternative focused on simplicity and performance.

🧩 Core Features
⚛️ Modern React First
Native React 19 support

Server Components ('use server')

Client Components ('use client')

Server Actions (React 19 primitives)

Suspense & streaming

🏝️ Islands Architecture
Partial hydration by default

Zero JS for static content

Explicit interactive boundaries

tsx
Copier le code
'use island';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
🖥️ Rendering Modes
SSR — server-side rendering

SSG — static generation

ISR — incremental regeneration (explicit)

Streaming SSR — progressive HTML

ts
Copier le code
export const revalidate = 60;
📁 File-Based Routing
Supports three conventions (in priority order):

routes/ (recommended)

app/ (Next-style)

pages/ (legacy)

txt
Copier le code
routes/
  (public)/
    home.tsx      → /
    about.tsx     → /about
  blog/
    [slug].tsx    → /blog/:slug
  api/
    users.ts      → /api/users
🔌 API Routes & Middleware
ts
Copier le code
export function GET() {
  return Response.json({ ok: true });
}
Middleware support (global or per-route):

ts
Copier le code
export default function middleware(req) {
  if (!req.headers.get('auth')) {
    return Response.redirect('/login');
  }
}
⚡ Edge-First Runtime
FlexiReact runs on:

Node.js

Bun

Deno

Cloudflare Workers

Vercel / Netlify Edge

Same API everywhere — no Node-only assumptions.

🧠 Architecture Philosophy
FlexiReact is built around a few strong principles:

Explicit over implicit
No hidden caching, no magic behavior.

Readable internals
You should be able to read the framework code.

Modern only
No legacy React APIs, no webpack.

Edge-native by design
Not retrofitted later.

🛠️ CLI
bash
Copier le code
flexi create <name>     # Create project
flexi dev               # Dev server (HMR)
flexi build             # Production build
flexi start             # Start server
flexi doctor            # Diagnose issues
Scaffolding:

bash
Copier le code
flexi g page dashboard
flexi g component Button
flexi g api users
flexi g middleware auth
🎨 UI Components (Optional)
FlexiReact provides an optional UI library:

bash
Copier le code
npm install @flexireact/flexi-ui
50+ accessible components

Tailwind CSS

shadcn/ui compatible

Tree-shakable

🔧 Configuration
ts
Copier le code
// flexireact.config.ts
import { defineConfig } from '@flexireact/core';

export default defineConfig({
  runtime: 'edge',
  islands: true,
  cache: {
    strategy: 'lru',
    ttl: 60
  }
});
🧪 Experimental Features
The following features are experimental and evolving:

Partial Prerendering (PPR)

Advanced DevTools overlay

Image optimization

Built-in analytics

They are opt-in and documented clearly.

🛣️ Roadmap
v4.x
Stability & DX improvements

Plugin system v1

Better Edge ISR

v5
Unified compiler pipeline

First-class plugins ecosystem

Advanced DevTools

📦 Packages
Package	Description
@flexireact/core	Core framework
create-flexireact	Project scaffolding
@flexireact/flexi-ui	UI components

🤝 Contributing
FlexiReact is open-source and community-driven.
Contributions, feedback and discussions are welcome.

📄 License
MIT © FlexiReact Team

<p align="center"> Built with ❤️ for developers who value clarity and performance. </p>