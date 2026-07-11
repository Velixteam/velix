#!/usr/bin/env node

/**
 * create-velix-app
 * Create a new Velix v5 project with one command
 *
 * Usage: npx create-velix-app my-app
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = '5.3.2';

async function main() {
  console.log('');
  console.log(`  ${pc.green('▲')} ${pc.bold('Create Velix App')} ${pc.dim(`v${VERSION}`)}`);
  console.log(`  ${pc.dim('──────────────────────────────────────────────')}`);
  console.log('');

  let projectName = process.argv[2];

  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: 'Project name:',
      initial: 'my-velix-app',
    });
    projectName = response.name;
    if (!projectName) process.exit(0);
  }

  const projectDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(projectDir)) {
    console.log(`  ${pc.red('✖')} Directory ${pc.bold(projectName)} already exists`);
    process.exit(1);
  }

  let template = 'default';
  const templateArgIndex = process.argv.indexOf('--template');
  if (templateArgIndex > -1 && process.argv.length > templateArgIndex + 1) {
    template = process.argv[templateArgIndex + 1];
  } else {
    const response = await prompts({
      type: 'select',
      name: 'template',
      message: 'Select a template:',
      choices: [
        { title: '✨ Default', description: 'Full Velix app with examples', value: 'default' },
        { title: '⚡ Minimal', description: 'Bare minimum setup', value: 'minimal' },
        { title: '📝 Blog', description: 'Blog starter', value: 'blog' },
      ],
    });
    template = response.template;
  }

  if (!template) process.exit(0);

  // Ask for Tailwind
  const { useTailwind } = await prompts({
    type: 'toggle',
    name: 'useTailwind',
    message: 'Use Tailwind CSS?',
    initial: true,
    active: 'yes',
    inactive: 'no',
  });

  const packageManager = 'npm';

  console.log('');
  console.log(`  Creating ${pc.bold(projectName)}...`);

  // Create project from template
  fs.mkdirSync(projectDir, { recursive: true });

  // Copy template files
  const templateDir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'templates', template);

  if (fs.existsSync(templateDir)) {
    copyDir(templateDir, projectDir);
  } else {
    // Inline template generation
    generateTemplate(projectDir, projectName, template, useTailwind);
  }

  // Install dependencies
  console.log(`  Installing dependencies with ${pc.cyan('npm')}...`);
  console.log('');

  try {
    execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
  } catch {
    console.log(`  ${pc.yellow('⚠')} Could not install dependencies. Run manually.`);
  }

  console.log('');
  console.log(`  ${pc.green('✔')} ${pc.bold(projectName)} created successfully!`);
  console.log('');
  console.log(`  ${pc.bold('Get started:')}`);
  console.log(`    ${pc.dim('$')} cd ${projectName}`);
  console.log(`    ${pc.dim('$')} npm run dev`);
  console.log('');
}

function generateTemplate(dir: string, name: string, template: string, useTailwind: boolean = true) {
  // package.json
  const pkg: any = {
    name, version: '0.1.0', private: true, type: 'module',
    scripts: {
      dev: 'velix dev',
      build: 'velix build',
      start: 'velix start'
    },
    dependencies: { '@teamvelix/velix': 'latest', react: '^19.0.0', 'react-dom': '^19.0.0' },
    devDependencies: { '@teamvelix/cli': 'latest', typescript: '^5.7.0', '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0' },
  };

  if (useTailwind) {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      'tailwindcss': '^4.0.0',
      '@tailwindcss/cli': '^4.0.0',
    };
  }

  write(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));

  // velix.config.ts
  write(path.join(dir, 'velix.config.ts'), `import { defineConfig${useTailwind ? ', tailwindPlugin' : ''} } from "@teamvelix/velix";\n\nexport default defineConfig({\n  app: { name: "${name}" },\n  server: { port: 3000, host: "localhost" },\n  seo: { sitemap: true, robots: true, openGraph: true },\n  favicon: "/favicon.webp",\n  ${useTailwind ? `plugins: [\n    tailwindPlugin()\n  ],` : 'plugins: [],'}\n});\n`);

  // tsconfig.json
  write(path.join(dir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx', strict: true, esModuleInterop: true, skipLibCheck: true },
    include: ['app/**/*.ts', 'app/**/*.tsx', 'server/**/*.ts', 'components/**/*.tsx'],
    exclude: ['node_modules', '.velix']
  }, null, 2));

  // app/
  fs.mkdirSync(path.join(dir, 'app'), { recursive: true });
  write(path.join(dir, 'app', 'globals.css'), generateGlobalsCss(useTailwind));
  write(path.join(dir, 'app', 'layout.tsx'), generateLayoutTsx(name, template, useTailwind));
  write(path.join(dir, 'app', 'page.tsx'), generatePageTemplate(name, template, useTailwind));

  // components/
  if (template === 'default') {
    fs.mkdirSync(path.join(dir, 'components', 'layout'), { recursive: true });
    write(path.join(dir, 'components', 'layout', 'navbar.tsx'), generateNavbar(useTailwind));
    write(path.join(dir, 'components', 'layout', 'footer.tsx'), generateFooter(useTailwind));
  }

  // public/
  fs.mkdirSync(path.join(dir, 'public'), { recursive: true });

  if (template !== 'minimal') {
    // server/api/
    fs.mkdirSync(path.join(dir, 'server', 'api'), { recursive: true });
    write(path.join(dir, 'server', 'api', 'hello.ts'), `export function GET() { return Response.json({ message: "Hello from Velix!" }); }\n`);
  }

  if (template === 'blog') {
    generateBlogTemplate(dir, useTailwind);
  }

  // Copy favicon
  const logoSrc = path.join(__dirname, '..', 'assets', 'logo.webp');
  if (fs.existsSync(logoSrc)) {
    fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
    fs.copyFileSync(logoSrc, path.join(dir, 'public', 'favicon.webp'));
  }

  // AGENT.md — AI coding guide for the generated project
  write(path.join(dir, 'AGENT.md'), generateAgentMd(name, template, useTailwind));
}

// ─── AGENT.md generator ─────────────────────────────────────────────────────

function generateAgentMd(name: string, template: string, useTailwind: boolean): string {
  const styling = useTailwind
    ? 'Tailwind CSS v4 (utility classes). Use `bg-[#2563EB]`, `text-[#38BDF8]` etc. for brand colors.'
    : 'Vanilla CSS via `app/globals.css`. Use CSS custom properties: `var(--velix-accent)`, `var(--velix-accent-light)`.';

  const templateBlurb: Record<string, string> = {
    default: 'Full Velix app — landing page hero, navbar, footer, feature sections, CTA. Edit `app/page.tsx` to customise the landing page.',
    minimal: 'Bare-bones Velix app — a single page with project structure displayed. Perfect starting point for custom UIs.',
    blog:    'Blog starter — listing page (`app/blog/page.tsx`), slug route (`app/blog/post/[slug]/page.tsx`), and ID route (`app/blog/id/[id]/page.tsx`).',
  };

  const structureByTemplate: Record<string, string> = {
    default: `\`\`\`
${name}/
├── app/
│   ├── layout.tsx          ← root layout (wraps Navbar + Footer)
│   ├── page.tsx            ← landing page — hero, features, CTA
│   └── globals.css         ← CSS tokens + keyframes
├── components/
│   └── layout/
│       ├── navbar.tsx      ← fixed top bar with Deploy CTA
│       └── footer.tsx      ← 4-column footer grid
├── server/
│   └── api/
│       └── hello.ts        ← GET /api/hello
├── public/
│   └── favicon.webp
└── velix.config.ts
\`\`\``,
    minimal: `\`\`\`
${name}/
├── app/
│   ├── layout.tsx          ← root layout
│   ├── page.tsx            ← home page (project structure display)
│   └── globals.css         ← CSS tokens + keyframes
├── public/
│   └── favicon.webp
└── velix.config.ts
\`\`\``,
    blog: `\`\`\`
${name}/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── blog/
│       ├── page.tsx                    ← /blog listing
│       ├── post/[slug]/page.tsx        ← /blog/post/:slug
│       └── id/[id]/page.tsx            ← /blog/id/:id
├── server/
│   └── api/
│       └── hello.ts
├── public/
│   └── favicon.webp
└── velix.config.ts
\`\`\``,
  };

  const serverSection = template !== 'minimal' ? `
## Server Layer

\`server/\` is **server-only** — never imported by the browser bundle.

| Directory | Purpose | Example export |
|---|---|---|
| \`server/api/\` | REST endpoints | \`export function GET() { return Response.json({}) }\` |
| \`server/loaders/\` | SSR data fetching | \`export const loader = defineLoader(async ({ params }) => data)\` |
| \`server/actions/\` | Server mutations (Zod) | \`export const action = defineAction(schema, async (data) => result)\` |

To add a loader and use it in a page:

\`\`\`ts
// server/loaders/posts.loader.ts
import { defineLoader } from 'velix/server';
export const postsLoader = defineLoader(async () => {
  return { posts: await db.posts.findAll() };
});
\`\`\`

\`\`\`tsx
// app/page.tsx
import { postsLoader } from '~/server/loaders/posts.loader';
import type { InferLoaderData } from 'velix';
export const loader = postsLoader;
export default function Page({ data }: { data: InferLoaderData<typeof loader> }) {
  return <ul>{data.posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
\`\`\`
` : '';

  const blogSection = template === 'blog' ? `
## Blog Routes

| Route | File | Notes |
|---|---|---|
| \`/blog\` | \`app/blog/page.tsx\` | Article listing |
| \`/blog/post/:slug\` | \`app/blog/post/[slug]/page.tsx\` | Slug-based route |
| \`/blog/id/:id\` | \`app/blog/id/[id]/page.tsx\` | ID-based route |

To add a real data source, create a loader:

\`\`\`ts
// server/loaders/blog.loader.ts
import { defineLoader, NotFoundError } from 'velix/server';
export const blogLoader = defineLoader(async ({ params }) => {
  const post = await db.post.findUnique({ where: { slug: params.slug } });
  if (!post) throw new NotFoundError();
  return { post };
});
\`\`\`
` : '';

  return `# AGENT.md — ${name}

> AI coding guide for this Velix project.
> Read this before editing any file. Keep it up to date when you add routes, components, or server logic.

---

## Project

- **Template:** \`${template}\` — ${templateBlurb[template] ?? 'Velix app'}
- **Framework:** Velix v5.3 (React 19, TypeScript strict, file-based routing)
- **Styling:** ${styling}
- **Dev server:** \`npm run dev\` → [http://localhost:3000](http://localhost:3000)

---

## Project Structure

${structureByTemplate[template] ?? ''}
${serverSection}${blogSection}
## Key Files

| File | What to edit |
|---|---|
| \`app/page.tsx\` | Main page content |
| \`app/layout.tsx\` | Root HTML shell, global providers |
| \`app/globals.css\` | CSS tokens, global styles, keyframes |
| \`velix.config.ts\` | App name, port, SEO, plugins |${template === 'default' ? `
| \`components/layout/navbar.tsx\` | Top navigation bar |
| \`components/layout/footer.tsx\` | Site footer |` : ''}

---

## Commands

\`\`\`bash
npm run dev      # start dev server with HMR
npm run build    # production build
npm run start    # serve production build
\`\`\`

---

## Routing Rules

- Files in \`app/\` become routes automatically:
  - \`app/page.tsx\` → \`/\`
  - \`app/blog/page.tsx\` → \`/blog\`
  - \`app/blog/[slug]/page.tsx\` → \`/blog/:slug\`
- \`layout.tsx\` wraps all child routes at the same level
- \`error.tsx\` catches errors for that subtree
- \`app/\` and \`server/\` are **strictly separated** — never cross-import

---

## Official Color Palette

> Source of truth: Velix DevTools widget (bottom-left pill in dev mode).

### Brand Blue — use for all UI accents

| Token | Hex | Use |
|---|---|---|
| \`--velix-accent\` | \`#2563EB\` | Buttons, active tabs, links, brand dots |
| \`--velix-accent-light\` | \`#38BDF8\` | Secondary highlights, monospace values |
| \`--velix-accent-hover\` | \`#1D4ED8\` | Button :hover |
| \`--velix-accent-glow\` | \`rgba(37,99,235,0.15)\` | Glow / radial bg |

${useTailwind ? `Tailwind usage: \`bg-[#2563EB]\`, \`text-[#38BDF8]\`, \`border-[#2563EB]\`, \`hover:bg-[#1D4ED8]\`` : `CSS usage: \`color: var(--velix-accent)\`, \`border-color: var(--velix-accent)\``}

### UI Neutrals

| Token | Hex | Use |
|---|---|---|
| \`--velix-bg\` | \`#0a0a0a\` | Page background |
| \`--velix-surface\` | \`#111211\` | Cards, panels |
| \`--velix-border\` | \`#1e201e\` | Borders, dividers |
| \`--velix-muted\` | \`#6b7068\` | Secondary text |
| \`--velix-text\` | \`#e8ebe5\` | Primary text |

### Semantic (not brand)

| Token | Hex | Use |
|---|---|---|
| \`--velix-success\` | \`#00e87a\` | ✓ build OK, success status only |
| \`--velix-error\` | \`#ff6b6b\` | Errors, 5xx |
| \`--velix-warn\` | \`#f59e0b\` | Warnings, 4xx |

### Color Rules

- ✅ Use **blue** (\`#2563EB\` / \`#38BDF8\`) for all brand accent UI (buttons, headings, links, badges)
- ❌ **Never** use green (\`#00e87a\`) as a brand accent color
- ✅ Green is only allowed for semantic success states (build completed, form submitted, status: ok)

---

## TypeScript Conventions

- \`strict: true\` — no implicit \`any\`
- Use \`InferLoaderData<typeof loader>\` to type page props
- Use \`defineLoader\` / \`defineAction\` from \`'velix/server'\`
- Server imports stay in \`server/\` — never import them from \`app/\`

---

## Adding Features (quick reference)

### New page
Create \`app/about/page.tsx\` → available at \`/about\`

### New API route
Create \`server/api/hello.ts\` → available at \`GET /api/hello\`

### New component
Create \`components/ui/Button.tsx\` → import from \`'~/components/ui/Button'\`

### Islands (partial hydration)
\`\`\`tsx
'use client'; // mark a component as a client island
export default function Counter() { ... }
\`\`\`

---

*Generated by [create-velix-app](https://github.com/Velixteam/velix) · Velix v5.3*
`;
}



function generateGlobalsCss(useTailwind: boolean) {
  const base = `@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300..900&family=Geist+Mono:wght@300..900&display=swap');

:root {
  --velix-bg: #0a0a0a;
  --velix-surface: #111211;
  --velix-border: #1e201e;
  /* Brand blue palette — extracted from DevTools (source of truth) */
  --velix-accent: #2563EB;          /* tab active border, row values, conn dot   */
  --velix-accent-light: #38BDF8;    /* pill text, dev-badge text, compile spinner */
  --velix-accent-hover: #1D4ED8;    /* button hover                               */
  --velix-accent-glow: rgba(37,99,235,0.15);
  --velix-accent-deep: #0c1a3a;     /* pill-blue bg                               */
  /* Semantic only — do NOT use as brand accent */
  --velix-success: #00e87a;
  --velix-muted: #6b7068;
  --velix-text: #e8ebe5;
  --velix-error: #ff6b6b;
}


body {
  background-color: var(--velix-bg);
  color: var(--velix-text);
  font-family: 'Geist', sans-serif;
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

@keyframes pulse-blue {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes termFade {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

  if (useTailwind) {
    return `@import "tailwindcss";\n\n` + base;
  }
  return base;
}

function generateLayoutTsx(name: string, template: string, useTailwind: boolean) {
  if (template === 'default') {
    return `import "./globals.css";
import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";

export const metadata = { title: "${name}", description: "Built with Velix v5.3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[#0a0a0a] text-[#e8ebe5]">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
`;
  }

  return `import "./globals.css";

export const metadata = { title: "${name}", description: "Built with Velix v5.3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="${useTailwind ? 'min-h-screen antialiased bg-[#0a0a0a] text-[#e8ebe5]' : ''}">
        {children}
      </body>
    </html>
  );
}
`;
}

function generatePageTemplate(name: string, template: string, useTailwind: boolean): string {
  if (template === 'minimal') {
    return generateMinimalPage(useTailwind);
  }
  return generateDefaultPage(useTailwind);
}

function generateMinimalPage(useTailwind: boolean): string {
  const styles = !useTailwind ? {
    container: 'style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", backgroundColor: "#0a0a0a", color: "#e8ebe5" }}',
    grid: 'style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(to right, #1e201e 1px, transparent 1px), linear-gradient(to bottom, #1e201e 1px, transparent 1px)", backgroundSize: "60px 60px", opacity: 0.2, maskImage: "radial-gradient(circle at center, black, transparent 80%)", WebkitMaskImage: "radial-gradient(circle at center, black, transparent 80%)", pointerEvents: "none" }}',
    header: 'style={{ position: "absolute", top: "2rem", left: "2rem", display: "flex", alignItems: "center", gap: "0.75rem", zIndex: 10 }}',
    dot: 'style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2563EB" }}',
    logo: 'style={{ fontWeight: "bold", fontSize: "1.25rem" }}',
    badge: 'style={{ backgroundColor: "#1e201e", color: "#6b7068", padding: "0.1rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem" }}',
    main: 'style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", zIndex: 10 }}',
    titleBlock: 'style={{ textAlign: "center", marginBottom: "4rem" }}',
    title: 'style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#e8ebe5" }}',
    subtitle: 'style={{ color: "#6b7068", fontSize: "14px" }}',
    columns: 'style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", width: "100%", maxWidth: "480px", marginBottom: "3rem" }}',
    colCard: 'style={{ flex: "1 1 200px", backgroundColor: "#111211", border: "1px solid #1e201e", borderRadius: "10px", padding: "1rem" }}',
    colLabel: 'style={{ color: "#2563EB", fontFamily: "\\"Geist Mono\\", monospace", fontSize: "12px", marginBottom: "1rem" }}',
    ul: 'style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "13px", display: "flex", flexDirection: "column", gap: "0.5rem" }}',
    li: 'style={{ display: "flex", gap: "1rem" }}',
    liFile: 'style={{ color: "#2563EB", width: "80px" }}',
    liDesc: 'style={{ color: "#6b7068" }}',
    linksRow: 'style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", width: "100%", maxWidth: "480px" }}',
    linkCard: 'style={{ flex: "1 1 120px", backgroundColor: "#111211", border: "1px solid #1e201e", padding: "1rem", borderRadius: "8px", textDecoration: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}',
    linkTitle: 'style={{ color: "#e8ebe5", fontSize: "14px", fontWeight: "bold" }}',
    linkDesc: 'style={{ color: "#6b7068", fontSize: "12px" }}',
    footer: 'style={{ position: "absolute", bottom: "2rem", left: "0", right: "0", textAlign: "center", zIndex: 10 }}',
    footerText: 'style={{ color: "#3a3d3a", fontSize: "12px", fontFamily: "\\"Geist Mono\\", monospace" }}'
  } : {
    container: 'className="min-h-screen flex flex-col relative overflow-hidden bg-[#0a0a0a] text-[#e8ebe5]"',
    grid: 'className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "linear-gradient(to right, #1e201e 1px, transparent 1px), linear-gradient(to bottom, #1e201e 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(circle at center, black, transparent 80%)", WebkitMaskImage: "radial-gradient(circle at center, black, transparent 80%)" }}',
    header: 'className="absolute top-8 left-8 flex items-center gap-3 z-10"',
    dot: 'className="w-2 h-2 rounded-full bg-[#2563EB]"',
    logo: 'className="font-bold text-xl"',
    badge: 'className="bg-[#1e201e] text-[#6b7068] px-2.5 py-0.5 rounded-full text-xs"',
    main: 'className="flex-1 flex flex-col items-center justify-center p-8 z-10"',
    titleBlock: 'className="text-center mb-16"',
    title: 'className="text-[2.5rem] font-bold mb-2 text-[#e8ebe5]"',
    subtitle: 'className="text-[#6b7068] text-[14px]"',
    columns: 'className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[480px] mb-12"',
    colCard: 'className="bg-[#111211] border border-[#1e201e] rounded-[10px] p-4"',
    colLabel: 'className="text-[#2563EB] font-mono text-xs mb-4"',
    ul: 'className="flex flex-col gap-2 text-[13px]"',
    li: 'className="flex gap-4"',
    liFile: 'className="text-[#2563EB] w-[80px]"',
    liDesc: 'className="text-[#6b7068]"',
    linksRow: 'className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-[480px]"',
    linkCard: 'className="bg-[#111211] border border-[#1e201e] hover:border-[#2563EB] transition-colors duration-200 cursor-pointer p-4 rounded-lg flex flex-col gap-1 text-left"',
    linkTitle: 'className="text-[#e8ebe5] text-[14px] font-bold"',
    linkDesc: 'className="text-[#6b7068] text-[12px]"',
    footer: 'className="absolute bottom-8 left-0 right-0 text-center z-10"',
    footerText: 'className="text-[#3a3d3a] text-xs font-mono"'
  };

  return `export default function HomePage() {
  return (
    <div ${styles.container}>
      <div ${styles.grid} />
      
      <header ${styles.header}>
        <div ${styles.dot} />
        <span ${styles.logo}>Velix</span>
        <span ${styles.badge}>v5.3</span>
      </header>

      <main ${styles.main}>
        <div ${styles.titleBlock}>
          <h1 ${styles.title}>Your app starts here.</h1>
          <p ${styles.subtitle}>Edit app/page.tsx to get started.</p>
        </div>

        <div ${styles.columns}>
          <div ${styles.colCard}>
            <div ${styles.colLabel}>app/</div>
            <ul ${styles.ul}>
              <li ${styles.li}><span ${styles.liFile}>layout.tsx</span><span ${styles.liDesc}>Root layout</span></li>
              <li ${styles.li}><span ${styles.liFile}>page.tsx</span><span ${styles.liDesc}>Home (/)</span></li>
              <li ${styles.li}><span ${styles.liFile}>error.tsx</span><span ${styles.liDesc}>Error boundary</span></li>
            </ul>
          </div>
          <div ${styles.colCard}>
            <div ${styles.colLabel}>server/</div>
            <ul ${styles.ul}>
              <li ${styles.li}><span ${styles.liFile}>api/health.ts</span><span ${styles.liDesc}>GET /api/health</span></li>
              <li ${styles.li}><span ${styles.liFile}>loaders/</span><span ${styles.liDesc}>Data fetching</span></li>
              <li ${styles.li}><span ${styles.liFile}>actions/</span><span ${styles.liDesc}>Mutations</span></li>
            </ul>
          </div>
        </div>

        <div ${styles.linksRow}>
          <a href="https://teamvelix.vercel.app" target="_blank" rel="noreferrer" ${styles.linkCard}>
            <span ${styles.linkTitle}>Docs &rarr;</span>
            <span ${styles.linkDesc}>Read the documentation</span>
          </a>
          <a href="https://github.com/Velixteam/velix/tree/main/examples" target="_blank" rel="noreferrer" ${styles.linkCard}>
            <span ${styles.linkTitle}>Examples &rarr;</span>
            <span ${styles.linkDesc}>See what's possible</span>
          </a>
          <a href="https://discord.gg/velix" target="_blank" rel="noreferrer" ${styles.linkCard}>
            <span ${styles.linkTitle}>Discord &rarr;</span>
            <span ${styles.linkDesc}>Join the community</span>
          </a>
        </div>
      </main>

      <footer ${styles.footer}>
        <span ${styles.footerText}>Built with Velix v5.3</span>
      </footer>
    </div>
  );
}
`;
}

function generateDefaultPage(useTailwind: boolean): string {
  if (!useTailwind) {
    return `export const metadata = { title: "Welcome to Velix" };

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#e8ebe5" }}>
      <h1 style={{ fontSize: "3rem", fontWeight: 800 }}>Build faster. <span style={{ color: "#2563EB" }}>Ship smarter.</span></h1>
      <p style={{ color: "#6b7068", marginTop: "0.5rem" }}>Velix v5.3 is here.</p>
    </main>
  );
}
`;
  }

  return `"use client";

import { useState } from 'react';

export default function HomePage() {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText('npx create-velix-app@latest');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex flex-col">
      {/* SECTION 1 - Hero */}
      <section className="relative pt-40 pb-24 flex flex-col items-center justify-center text-center overflow-hidden min-h-[90vh]">
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'linear-gradient(to right, #1e201e 1px, transparent 1px), linear-gradient(to bottom, #1e201e 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 60% at center, black, transparent)', WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at center, black, transparent)' }} />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05),transparent_50%)]" />
        
        <div className="z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111211] border border-[#1e201e] mb-8">
          <div className="w-2 h-2 rounded-full bg-[#2563EB] animate-[pulse-blue_2s_ease-in-out_infinite]" />
          <span className="text-[13px] text-[#6b7068]">Velix v5.3 is here</span>
        </div>

        <h1 className="z-10 text-[4rem] md:text-[5rem] font-bold leading-none tracking-tight mb-6">
          <span className="text-[#e8ebe5]">Build faster.</span><br/>
          <span className="text-[#2563EB]">Ship smarter.</span>
        </h1>

        <p className="z-10 text-[16px] text-[#6b7068] max-w-[500px] mb-10 px-4">
          The full-stack React 19 framework with a clean server/ convention.
        </p>

        <div className="z-10 flex flex-col sm:flex-row items-center gap-4 mb-16">
          <a href="#" className="px-8 py-3.5 bg-[#2563EB] text-[#0a0a0a] font-bold rounded-lg hover:opacity-90 hover:-translate-y-[1px] transition-all">Get started &rarr;</a>
          <a href="https://github.com/Velixteam/velix" className="px-8 py-3.5 bg-transparent text-[#e8ebe5] border border-[#1e201e] rounded-lg hover:border-[#6b7068] transition-all">View on GitHub</a>
        </div>

        <div className="z-10 w-full max-w-[520px] bg-[#111211] border border-[#1e201e] rounded-xl text-left overflow-hidden shadow-2xl mx-4 md:mx-0">
          <div className="flex items-center px-4 py-3 border-b border-[#1e201e] bg-[#0a0a0a]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="mx-auto text-[#6b7068] text-xs font-mono">bash</div>
            <div className="w-12" />
          </div>
          <div className="p-4 font-mono text-[13px] leading-loose text-[#e8ebe5]">
            <div className="opacity-0 animate-[termFade_0.2s_ease-out_forwards]" style={{ animationDelay: '0ms' }}>
              <span className="text-[#6b7068]">$</span> <span className="text-[#2563EB]">npx create-velix-app@latest</span> my-app
            </div>
            <div className="opacity-0 animate-[termFade_0.2s_ease-out_forwards] text-[#6b7068]" style={{ animationDelay: '600ms' }}>
              ✓ Detected Velix v5.3
            </div>
            <div className="opacity-0 animate-[termFade_0.2s_ease-out_forwards] text-[#6b7068]" style={{ animationDelay: '1200ms' }}>
              ✓ Installing dependencies...
            </div>
            <div className="opacity-0 animate-[termFade_0.2s_ease-out_forwards] text-[#6b7068]" style={{ animationDelay: '1800ms' }}>
              ✓ Setting up TypeScript
            </div>
            <div className="opacity-0 animate-[termFade_0.2s_ease-out_forwards] text-[#2563EB]" style={{ animationDelay: '2400ms' }}>
              ✓ Ready! cd my-app && npm run dev
            </div>
            <div className="opacity-0 animate-[termFade_0.2s_ease-out_forwards]" style={{ animationDelay: '3000ms' }}>
              <span className="text-[#6b7068]">$</span> <span className="text-[#2563EB]">cursor</span> <span className="inline-block w-2 h-4 bg-[#e8ebe5] ml-1 align-middle animate-[blink_1s_step-end_infinite]" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - Stats bar */}
      <section className="border-y border-[#1e201e] py-8 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 bg-[#0a0a0a]">
        <div className="flex flex-col items-center">
          <div className="font-bold text-[1.75rem] text-[#e8ebe5]">React 19</div>
          <div className="text-[12px] text-[#6b7068]">Latest</div>
        </div>
        <div className="hidden md:block w-px h-12 bg-[#1e201e]" />
        <div className="flex flex-col items-center">
          <div className="font-bold text-[1.75rem] text-[#e8ebe5]">&lt; 2s</div>
          <div className="text-[12px] text-[#6b7068]">Build time</div>
        </div>
        <div className="hidden md:block w-px h-12 bg-[#1e201e]" />
        <div className="flex flex-col items-center">
          <div className="font-bold text-[1.75rem] text-[#e8ebe5]">100%</div>
          <div className="text-[12px] text-[#6b7068]">TypeScript</div>
        </div>
      </section>

      {/* SECTION 3 - Convention */}
      <section className="py-32 flex flex-col items-center px-6">
        <h2 className="text-[2.5rem] font-bold text-[#e8ebe5] mb-2 text-center">Server logic where it belongs.</h2>
        <p className="text-[#6b7068] text-center max-w-[500px] mb-16 leading-relaxed">Next.js mixes your frontend and backend.<br/>Velix keeps them separate.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[900px]">
          <div className="rounded-xl border border-[rgba(255,107,107,0.15)] bg-[#111211] overflow-hidden">
            <div className="bg-[rgba(255,107,107,0.05)] border-b border-[rgba(255,107,107,0.15)] px-4 py-3 flex items-center gap-2">
              <span className="text-[#ff6b6b] font-mono text-sm font-bold">❌ Next.js</span>
            </div>
            <div className="p-6 font-mono text-[13px] text-[#6b7068] leading-[2.5] whitespace-pre overflow-x-auto">
app/
  page.tsx
  api/
    posts/
      route.ts    <span className="text-[#ff6b6b]">← mixed here 😕</span>
            </div>
          </div>
          
          <div className="rounded-xl border border-[rgba(0,232,122,0.15)] bg-[#111211] overflow-hidden">
            <div className="bg-[rgba(37,99,235,0.05)] border-b border-[rgba(0,232,122,0.15)] px-4 py-3 flex items-center gap-2">
              <span className="text-[#2563EB] font-mono text-sm font-bold">✅ Velix</span>
            </div>
            <div className="p-6 font-mono text-[13px] text-[#6b7068] leading-[2.5] whitespace-pre overflow-x-auto">
app/
  page.tsx        <span className="text-[#2563EB]">← UI only ✓</span>
server/
  api/posts.ts    <span className="text-[#2563EB]">← clean ✓</span>
  loaders/...     <span className="text-[#2563EB]">← clean ✓</span>
  actions/...     <span className="text-[#2563EB]">← clean ✓</span>
            </div>
          </div>
        </div>
        
        <p className="mt-12 text-[#e8ebe5] text-[1.25rem]">One convention. Zero confusion.</p>
      </section>

      {/* SECTION 4 - Features */}
      <section className="py-24 flex flex-col items-center px-6">
        <h2 className="text-[2.5rem] font-bold text-[#e8ebe5] mb-2">Everything you need.</h2>
        <p className="text-[#6b7068] text-center mb-16">Nothing you don't.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#1e201e] border border-[#1e201e] rounded-[16px] overflow-hidden w-full max-w-[1000px]">
          {[
            { icon: "⚡", title: "Instant HMR", desc: "WebSocket-based with branded dev overlay. See changes in milliseconds." },
            { icon: "📁", title: "File-based routing", desc: "Intuitive app/ directory. Static, dynamic, catch-all — just create a file." },
            { icon: "🛤️", title: "Clean server/ convention", desc: "API routes, loaders, actions — all separate. Never mix UI and backend again." },
            { icon: "🏝️", title: "Islands Architecture", desc: "Partial hydration for minimal JavaScript. Ship only what the browser needs." },
            { icon: "🚀", title: "Smart caching", desc: "LRU + SWR + TTL + tag invalidation. ICacheAdapter for Redis in production." },
            { icon: "🔍", title: "SEO first", desc: "Auto sitemaps, Open Graph, robots.txt. Perfect Lighthouse scores by default." },
            { icon: "🐛", title: "Error system", desc: "defineError, cascade boundaries, beautiful error pages. Never show a blank screen." },
            { icon: "📦", title: "Redis ready", desc: "Distributed cache via @velix/cache-redis. Multi-instance HMR with Pub/Sub." },
            { icon: "🤖", title: "AI native", desc: "agent.md + Cursor rules out of the box. Every template is AI-ready." }
          ].map((f, i) => (
            <div key={i} className="bg-[#111211] p-8 hover:bg-[#131513] transition-colors">
              <div className="w-10 h-10 border border-[#1e201e] rounded-lg flex items-center justify-center text-[20px] mb-6 bg-[#0a0a0a]">
                {f.icon}
              </div>
              <h3 className="text-[#e8ebe5] font-bold text-[15px] mb-2">{f.title}</h3>
              <p className="text-[#6b7068] text-[13px] leading-[1.6]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5 - Code showcase */}
      <section className="py-24 flex flex-col items-center w-full px-6">
        <h2 className="text-[2.5rem] font-bold text-[#e8ebe5] mb-16">Look how clean it is.</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-[1100px]">
          <div className="bg-[#0d0f0d] border border-[#1e201e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e201e] flex justify-between items-center">
              <span className="text-[#6b7068] text-[13px] font-mono">server/loaders/blog.loader.ts</span>
            </div>
            <div className="p-6 font-mono text-[13px] leading-loose whitespace-pre overflow-x-auto text-[#e8ebe5]">
<span className="text-[#c084fc]">import</span> {"{ defineLoader, NotFoundError }"} <span className="text-[#c084fc]">from</span> <span className="text-[#86efac]">'velix/server'</span>

<span className="text-[#c084fc]">export const</span> <span className="text-[#2563EB]">blogLoader</span> = <span className="text-[#2563EB]">defineLoader</span>(<span className="text-[#c084fc]">async</span> {"({ params }) => {"}
  <span className="text-[#c084fc]">const</span> post = <span className="text-[#c084fc]">await</span> db.post.findUnique{"({"}
    where: {"{ slug: params.slug }"}
  {"})"}
  <span className="text-[#c084fc]">if</span> {"(!post) "}<span className="text-[#c084fc]">throw new</span> NotFoundError()
  <span className="text-[#c084fc]">return</span> {"{ post }"}
{"})"}
            </div>
          </div>
          
          <div className="bg-[#0d0f0d] border border-[#1e201e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e201e] flex justify-between items-center">
              <span className="text-[#6b7068] text-[13px] font-mono">app/blog/[slug].tsx</span>
            </div>
            <div className="p-6 font-mono text-[13px] leading-loose whitespace-pre overflow-x-auto text-[#e8ebe5]">
<span className="text-[#c084fc]">import</span> {"{ blogLoader }"} <span className="text-[#c084fc]">from</span> <span className="text-[#86efac]">'~/server/loaders/blog.loader'</span>
<span className="text-[#c084fc]">import type</span> {"{ InferLoaderData }"} <span className="text-[#c084fc]">from</span> <span className="text-[#86efac]">'velix'</span>

<span className="text-[#c084fc]">export const</span> loader = blogLoader

<span className="text-[#c084fc]">export default function</span> BlogPost{"({"}
  data
{"}: {"}
  data: <span className="text-[#67e8f9]">InferLoaderData</span>&lt;<span className="text-[#67e8f9]">typeof</span> loader&gt;
{"}) {"}
  <span className="text-[#c084fc]">return</span> &lt;article&gt;{"{data.post.title}"}&lt;/article&gt;
{"}"}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - CTA */}
      <section className="py-32 flex flex-col items-center justify-center text-center relative bg-[#0d0f0d] border-t border-[#1e201e] w-full">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.03),transparent_60%)]" />
        <h2 className="text-[3rem] font-bold text-[#e8ebe5] mb-4 z-10">Ready to ship?</h2>
        <p className="text-[#6b7068] mb-10 max-w-[400px] z-10 text-[15px]">Join developers building with Velix.<br/>No credit card. No lock-in. Just code.</p>
        
        <div className="z-10 flex flex-col items-center">
          <button onClick={handleCopy} className="group relative bg-[#2563EB] hover:bg-[#1D4ED8] text-[#0a0a0a] font-mono font-bold text-[16px] md:text-[18px] py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all flex items-center gap-3 cursor-pointer">
            {copied ? "✓ Copied!" : "$ npx create-velix-app@latest"}
          </button>
          <p className="text-[#6b7068] text-[13px] mt-6">Or: npm create velix-app@latest &middot; pnpm create velix-app</p>
        </div>
      </section>
    </main>
  );
}
`;
}

function generateNavbar(useTailwind: boolean): string {
  if (!useTailwind) {
    return `export default function Navbar() { return <nav style={{ padding: "1.25rem 2.5rem", borderBottom: "1px solid #1e201e", display: "flex", justifyContent: "space-between", backgroundColor: "#0a0a0a" }}><div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#2563EB" }} /><strong style={{ color: "#e8ebe5" }}>Velix</strong></div></nav>; }`;
  }
  return `export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-[rgba(10,10,10,0.85)] backdrop-blur-[12px] border-b border-[#1e201e] px-6 md:px-10 py-4 md:py-5">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span className="font-bold text-[#e8ebe5] text-lg">Velix</span>
          <span className="text-[#6b7068] bg-[#1e201e] px-2 py-0.5 rounded-full text-xs hidden sm:inline-block">v5.3</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-[#e8ebe5] text-sm transition-colors">Home</a>
          <a href="#" className="text-[#6b7068] hover:text-[#e8ebe5] text-sm transition-colors">Blog</a>
          <a href="#" className="text-[#6b7068] hover:text-[#e8ebe5] text-sm transition-colors">Dashboard</a>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <a href="https://github.com/Velixteam/velix" className="text-[#6b7068] hover:text-[#e8ebe5] transition-colors">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <a href="#" className="bg-[#2563EB] text-[#0a0a0a] font-bold px-4 md:px-5 py-2 rounded-md hover:opacity-90 transition-opacity text-sm md:text-base">Deploy</a>
        </div>
      </div>
    </nav>
  );
}
`;
}

function generateFooter(useTailwind: boolean): string {
  if (!useTailwind) {
    return `export default function Footer() { return <footer style={{ padding: "2rem", borderTop: "1px solid #1e201e", textAlign: "center", color: "#6b7068", fontSize: "12px", backgroundColor: "#0a0a0a" }}>© 2026 Florynx Labs</footer>; }`;
  }
  return `export default function Footer() {
  return (
    <footer className="border-t border-[#1e201e] bg-[#0a0a0a]">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="font-bold text-[#e8ebe5] text-lg">Velix</span>
            </div>
            <p className="text-[#6b7068] text-sm mb-4">The full-stack React framework.</p>
            <p className="text-[#6b7068] text-xs">Built by Florynx Labs</p>
          </div>
          <div>
            <h4 className="text-[#e8ebe5] font-semibold mb-4">Framework</h4>
            <ul className="flex flex-col gap-3 text-sm text-[#6b7068]">
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Docs</a></li>
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Getting Started</a></li>
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Examples</a></li>
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#e8ebe5] font-semibold mb-4">Community</h4>
            <ul className="flex flex-col gap-3 text-sm text-[#6b7068]">
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">GitHub</a></li>
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Issues</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#e8ebe5] font-semibold mb-4">Deploy</h4>
            <ul className="flex flex-col gap-3 text-sm text-[#6b7068]">
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Velix Cloud</a></li>
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Status</a></li>
              <li><a href="#" className="hover:text-[#e8ebe5] transition-colors">Roadmap</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#1e201e] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#6b7068] text-[13px]">© 2026 Florynx Labs · Velix v5.3 · MIT License</p>
          <div className="flex gap-6 text-[#6b7068] text-[13px]">
            <a href="#" className="hover:text-[#e8ebe5] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#e8ebe5] transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
`;
}

function generateBlogTemplate(dir: string, useTailwind: boolean) {
  function write(filePath: string, content: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  // app/blog/page.tsx
  fs.mkdirSync(path.join(dir, 'app', 'blog'), { recursive: true });
  write(path.join(dir, 'app', 'blog', 'page.tsx'), `export const metadata = {
  title: "Blog",
  description: "Latest articles from our team",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen ${useTailwind ? 'bg-[#0a0a0a] text-[#e8ebe5]' : ''}">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <header className="mb-16 border-b border-[#1e201e] pb-12">
          <h1 className="text-6xl font-black tracking-tighter mb-4 ${useTailwind ? 'text-[#e8ebe5]' : ''}">Journal</h1>
          <p className="text-xl text-[#6b7068] max-w-lg">Thoughts on software, design, and building the future with Velix.</p>
        </header>

        <div className="grid gap-12">
          {[
            { id: "1", slug: "hello-world", title: "The future of React is Velix", date: "Mar 21, 2026", excerpt: "Exploring the seamless synergy between React 19 and the Velix engine." },
            { id: "2", slug: "modern-styling", title: "Styling with purpose", date: "Mar 18, 2026", excerpt: "How we use Tailwind and CSS variables to create stunning dark mode interfaces." }
          ].map((post) => (
            <article key={post.id} className="group relative">
              <span className="text-sm font-bold text-[#2563EB] mb-2 block uppercase tracking-widest">{post.date}</span>
              <h2 className="text-3xl font-bold mb-4 group-hover:text-[#2563EB] transition-colors">
                <a href={"/blog/post/" + post.slug}>{post.title}</a>
              </h2>
              <p className="text-[#6b7068] leading-relaxed mb-6 text-lg">{post.excerpt}</p>
              <a href={"/blog/id/" + post.id} className="text-sm font-semibold text-[#6b7068] hover:text-[#e8ebe5] transition-colors border-b border-[#1e201e] pb-1 inline-block">Read full ID route &rarr;</a>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
`);

  // app/blog/post/[slug]/page.tsx
  fs.mkdirSync(path.join(dir, 'app', 'blog', 'post', '[slug]'), { recursive: true });
  write(path.join(dir, 'app', 'blog', 'post', '[slug]', 'page.tsx'), `export default function BlogPost({ params }: { params: { slug: string } }) {
  return (
    <article className="min-h-screen ${useTailwind ? 'bg-[#0a0a0a] text-[#e8ebe5]' : ''}">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <a href="/blog" className="text-[#2563EB] font-bold mb-8 block hover:translate-x-[-4px] transition-transform w-fit">&larr; Back to Journal</a>
        <header className="mb-12">
           <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight capitalize">{params.slug.replace(/-/g, ' ')}</h1>
        </header>
        <div className="prose prose-invert max-w-none">
          <p className="text-xl leading-relaxed text-[#6b7068] mb-8">
            This article explores <strong>{params.slug}</strong> in depth. In Velix v5, dynamic routing is handled at the edge, providing near-instantaneous page transitions and perfect SEO out of the box.
          </p>
          <div className="bg-[#111211] p-8 rounded-2xl border border-[#1e201e] italic text-[#6b7068]">
            "Design is not just what it looks like and feels like. Design is how it works."
          </div>
        </div>
      </div>
    </article>
  );
}
`);

  // app/blog/id/[id]/page.tsx
  fs.mkdirSync(path.join(dir, 'app', 'blog', 'id', '[id]'), { recursive: true });
  write(path.join(dir, 'app', 'blog', 'id', '[id]', 'page.tsx'), `export default function BlogIdPost({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen ${useTailwind ? 'bg-[#0a0a0a] text-[#e8ebe5]' : ''} flex items-center justify-center">
      <div className="max-w-xl text-center p-12 bg-[#111211] backdrop-blur-3xl rounded-3xl border border-[#1e201e]">
        <span className="bg-[rgba(37,99,235,0.1)] text-[#2563EB] px-4 py-1 rounded-full text-sm font-bold mb-6 inline-block">ID ROUTE</span>
        <h1 className="text-4xl font-black mb-4">Post Reference: #{params.id}</h1>
        <p className="text-[#6b7068] mb-8 text-lg">Looking for a specific record? Velix allows you to mix route patterns seamlessly.</p>
        <a href="/blog" className="text-[#2563EB] hover:underline font-semibold">Back to Blog</a>
      </div>
    </main>
  );
}
`);
}

function write(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

main().catch(err => {
  console.error(`  ${pc.red('✖')} ${err.message}`);
  process.exit(1);
});

