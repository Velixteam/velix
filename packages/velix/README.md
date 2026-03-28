# Velix v5

<p align="center">
  <img src="./assets/velix cover.webp" width="100%" alt="Velix Cover" />
</p>

> **A modern full-stack React framework** optimized for performance, SEO, simplicity, and developer experience.

Velix is a lightweight but powerful React 19 framework featuring file-based routing, SSR, SSG, Islands architecture, built-in SEO optimization, and an intuitive CLI.

## ✨ Features

- ⚡ **React 19** — Latest React with Server Components & Actions
- 📁 **File-based Routing** — Intuitive `app/` directory convention
- 🏝️ **Islands Architecture** — Partial hydration for minimal JavaScript
- 🔍 **SEO First** — Automatic meta tags, Open Graph, sitemaps, robots.txt
- 🖥️ **SSR + SSG + ISR** — Choose the right rendering for each page
- 🧩 **Plugin System** — Extend with auth, database, analytics, and more
- 🛠️ **Powerful CLI** — Scaffold pages, components, APIs, and more
- 🔧 **DevTools** — Route explorer, hydration inspector, performance metrics
- 📦 **Edge Ready** — Deploy to any edge platform
- 🤖 **AI Assistant** — Built-in CLI AI for code generation

## 📦 Quick Start

```bash
npx create-velix-app my-app
cd my-app
npm run dev
```

## 📁 Project Structure

```
my-velix-app/
├── app/
│   ├── layout.tsx          → Root layout
│   ├── page.tsx            → Home page (/)
│   ├── dashboard/
│   │   ├── layout.tsx      → Dashboard layout
│   │   ├── page.tsx        → /dashboard
│   │   └── [id].tsx        → /dashboard/:id
│   └── blog/
│       ├── page.tsx        → /blog
│       └── [slug].tsx      → /blog/:slug
├── components/
├── server/
│   ├── loaders/
│   └── actions/
├── styles/
├── velix.config.ts
└── package.json
```

## ⚙️ Configuration

```ts
// velix.config.ts
import { defineConfig } from "velix";

export default defineConfig({
  app: {
    name: "My App",
    url: "https://example.com"
  },
  server: { port: 3000 },
  seo: {
    sitemap: true,
    robots: true,
    openGraph: true
  },
  plugins: ["velix-auth", "velix-db"]
});
```

## 🛠️ CLI Commands

```bash
velix dev          # Start dev server
velix build        # Build for production
velix start        # Start production server
velix doctor       # Health check

velix g page <name>        # Generate a page
velix g component <name>   # Generate a component
velix g api <name>         # Generate an API route
velix g layout <name>      # Generate a layout
velix g middleware <name>  # Generate middleware

velix ai start     # Launch AI assistant
velix analyze      # Bundle analysis
velix info         # Framework info
```

## � Documentation

Comprehensive guides and API references:

- **[Getting Started](./docs/README.md)** - Quick start guide and overview
- **[Server Actions](./docs/server-actions.md)** - Execute server code from components
- **[API Routes](./docs/api-routes.md)** - Create custom HTTP endpoints
- **[Best Practices](./docs/best-practices.md)** - Development guidelines
- **[Roadmap](./docs/roadmap.md)** - Upcoming features and plugins

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 💬 Community

- **Discord**: [Join our community](https://discord.gg/velix)
- **GitHub Discussions**: [Ask questions & share ideas](https://github.com/velix/velix/discussions)
- **Twitter**: [@VelixFramework](https://twitter.com/VelixFramework)

## �📄 License

MIT © Velix Team