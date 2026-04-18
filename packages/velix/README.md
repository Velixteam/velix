# Velix v5
<p align="center">
  <img src="https://raw.githubusercontent.com/Velixteam/velix/main/assets/velix%20cover.webp" width="100%" alt="Velix Cover" />
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

## 📦 Installation

### Option 1: Create New App (Recommended)

The fastest way to get started:

```bash
npx create-velix-app@latest my-app
cd my-app
npm install
npm run dev
```

This will:
- ✅ Create a new Velix project with your chosen template
- ✅ Install all dependencies automatically
- ✅ Set up Tailwind CSS (optional)
- ✅ Configure TypeScript

### Option 2: Install CLI Globally

For multiple projects or advanced usage:

```bash
# Install Velix CLI globally
npm install -g @teamvelix/cli

# Create a new project
velix create my-app
cd my-app
npm install

# Start development
velix dev
```

### Option 3: Manual Installation

Add Velix to an existing project:

```bash
# Install core framework
npm install @teamvelix/velix react react-dom

# Install dev dependencies
npm install -D @teamvelix/cli typescript @types/react @types/react-dom

# Optional: Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
```

Then create a `velix.config.ts` file:

```ts
import { defineConfig } from "@teamvelix/velix";

export default defineConfig({
  app: { name: "My App" },
  server: { port: 3000 },
});
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
import { defineConfig } from "@teamvelix/velix";

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
  plugins: []
});
```

## 🛠️ CLI Commands

### Development

```bash
velix dev          # Start development server with hot reload
velix build        # Build for production
velix start        # Start production server
velix doctor       # Health check & diagnostics
velix info         # Framework & environment info
```

### Generators

```bash
velix g page <name>        # Generate a new page
velix g component <name>   # Generate a component
velix g api <name>         # Generate an API route
velix g layout <name>      # Generate a layout
velix g action <name>      # Generate a server action
velix g middleware <name>  # Generate middleware
velix g hook <name>        # Generate a custom hook
velix g context <name>     # Generate a React context
```

### Project Creation

```bash
velix create <name>                    # Create new project (interactive)
velix create <name> --template=minimal # Use minimal template
velix create <name> --no-tailwind      # Skip Tailwind CSS
```

### UI Components (Shadcn-style)

```bash
velix ui add button        # Add button component
# More components coming soon
```

### Other

```bash
velix analyze      # Bundle analysis (coming soon)
```

## 📚 Documentation

Comprehensive guides and API references:

- **[Getting Started](./docs/README.md)** - Quick start guide and overview
- **[Server Actions](./docs/server-actions.md)** - Execute server code from components
- **[API Routes](./docs/api-routes.md)** - Create custom HTTP endpoints
- **[Best Practices](./docs/best-practices.md)** - Development guidelines
- **[Roadmap](./docs/roadmap.md)** - Upcoming features and plugins

## 🔧 Troubleshooting

### Common Issues

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Tailwind CSS not working:**
```bash
# Ensure Tailwind is installed
npm install -D tailwindcss postcss autoprefixer

# Check that velix.config.ts includes tailwindPlugin
import { defineConfig, tailwindPlugin } from "@teamvelix/velix";

export default defineConfig({
  plugins: [tailwindPlugin()]
});
```

**Port already in use:**
```bash
# Change port in velix.config.ts
export default defineConfig({
  server: { port: 3001 }
});
```

### Getting Help

- 📖 Check the [documentation](./docs/README.md)
- 💬 Join our [Discord community](https://discord.gg/velix)
- 🐛 Report bugs on [GitHub Issues](https://github.com/Velixteam/velix/issues)

## 📦 NPM Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@teamvelix/velix](https://npmjs.com/package/@teamvelix/velix) | ![npm](https://img.shields.io/npm/v/@teamvelix/velix) | Core framework |
| [create-velix-app](https://npmjs.com/package/create-velix-app) | ![npm](https://img.shields.io/npm/v/create-velix-app) | Project scaffolding |
| [@teamvelix/cli](https://npmjs.com/package/@teamvelix/cli) | ![npm](https://img.shields.io/npm/v/@teamvelix/cli) | Command-line interface |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 💬 Community

- **Discord**: [Join our community](https://discord.gg/velix)
- **GitHub Discussions**: [Ask questions & share ideas](https://github.com/velix/velix/discussions)
- **Twitter**: [@VelixFramework](https://twitter.com/VelixFramework)

## �📄 License

MIT © Velix Team