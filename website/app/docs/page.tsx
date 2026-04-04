export const metadata = {
  title: "Documentation - Velix Framework",
  description: "Learn how to build modern web applications with Velix. Guides for routing, server actions, API routes, middleware, and more.",
};

function SidebarLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <a href={href} className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${active ? "text-velix-cyan bg-velix-cyan/5 font-medium" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}`}>
      {children}
    </a>
  );
}

function Sidebar() {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="sticky top-24 space-y-6">
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-3">Getting Started</h4>
          <div className="space-y-0.5">
            <SidebarLink href="#getting-started" active>Introduction</SidebarLink>
            <SidebarLink href="#installation">Installation</SidebarLink>
            <SidebarLink href="#project-structure">Project Structure</SidebarLink>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-3">Core Concepts</h4>
          <div className="space-y-0.5">
            <SidebarLink href="#routing">Routing</SidebarLink>
            <SidebarLink href="#layouts">Layouts</SidebarLink>
            <SidebarLink href="#metadata">Metadata &amp; SEO</SidebarLink>
            <SidebarLink href="#styling">Styling</SidebarLink>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-3">Server</h4>
          <div className="space-y-0.5">
            <SidebarLink href="#server-actions">Server Actions</SidebarLink>
            <SidebarLink href="#api-routes">API Routes</SidebarLink>
            <SidebarLink href="#middleware">Middleware</SidebarLink>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-3">Advanced</h4>
          <div className="space-y-0.5">
            <SidebarLink href="#islands">Islands Architecture</SidebarLink>
            <SidebarLink href="#plugins">Plugins</SidebarLink>
            <SidebarLink href="#deployment">Deployment</SidebarLink>
            <SidebarLink href="#examples">Examples</SidebarLink>
          </div>
        </div>
      </nav>
    </aside>
  );
}

function CodeBlock({ filename, children }: { filename?: string; children: string }) {
  return (
    <div className="code-block my-6">
      {filename && <div className="px-4 py-2 border-b border-white/5 text-xs text-slate-500 font-mono">{filename}</div>}
      <pre className="font-mono text-sm leading-relaxed"><code>{children}</code></pre>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-20 scroll-mt-24">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 pb-4 border-b border-white/5">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-400 leading-relaxed mb-4">{children}</p>;
}

function IC({ children }: { children: React.ReactNode }) {
  return <code className="text-sm px-1.5 py-0.5 rounded bg-velix-dark text-velix-cyan font-mono border border-white/5">{children}</code>;
}

function Callout({ type, children }: { type: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const styles = { info: "border-velix-accent/30 bg-velix-accent/5", warning: "border-yellow-500/30 bg-yellow-500/5", tip: "border-velix-cyan/30 bg-velix-cyan/5" };
  const icons = { info: "ℹ️", warning: "⚠️", tip: "💡" };
  return (
    <div className={`border-l-4 ${styles[type]} rounded-r-xl p-4 my-6`}>
      <div className="flex items-start gap-3">
        <span>{icons[type]}</span>
        <div className="text-sm text-slate-300 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-white/5 bg-velix-deep">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <span className="text-xs font-semibold tracking-widest uppercase text-velix-cyan mb-3 block">Documentation</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Velix Framework Docs</h1>
          <p className="text-lg text-slate-400 max-w-2xl">Everything you need to build modern full-stack React applications with Velix v5.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-12">
        <Sidebar />
        <div className="flex-1 min-w-0 max-w-3xl">

          <Section id="getting-started" title="Getting Started">
            <P>Velix is a modern full-stack React framework designed for speed and developer experience. It combines the best ideas from Next.js, Remix, and Astro into a cohesive package: file-based routing, server actions, API routes, Islands architecture, and zero configuration.</P>
            <Callout type="tip">Velix requires <strong>Node.js 18+</strong> and works best with <strong>React 19</strong>.</Callout>
          </Section>

          <Section id="installation" title="Installation">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Start</h3>
            <P>Create a new Velix project with a single command:</P>
            <CodeBlock filename="Terminal">{`npx create-velix-app my-app
cd my-app
npm run dev`}</CodeBlock>
            <P>This scaffolds a complete project with TypeScript, Tailwind CSS v4, and example pages. Your dev server starts at <IC>http://localhost:3000</IC>.</P>

            <h3 className="text-lg font-semibold text-white mb-4 mt-10">Using the CLI</h3>
            <P>For more control, use the Velix CLI:</P>
            <CodeBlock filename="Terminal">{`npx @teamvelix/cli create my-app`}</CodeBlock>
            <P>The CLI lets you choose a template (default, minimal, or with shadcn/ui), and optionally includes component scaffolding.</P>

            <h3 className="text-lg font-semibold text-white mb-4 mt-10">Manual Installation</h3>
            <P>Add Velix to an existing project:</P>
            <CodeBlock filename="Terminal">{`npm install @teamvelix/velix react react-dom`}</CodeBlock>
            <P>Add scripts to your <IC>package.json</IC>:</P>
            <CodeBlock filename="package.json">{`{
  "scripts": {
    "dev": "velix dev",
    "build": "velix build",
    "start": "velix start"
  }
}`}</CodeBlock>
          </Section>

          <Section id="project-structure" title="Project Structure">
            <P>A typical Velix project looks like this:</P>
            <CodeBlock>{`my-app/
├── app/
│   ├── globals.css          # Global styles + Tailwind theme
│   ├── layout.tsx           # Root layout (wraps all pages)
│   ├── page.tsx             # Home page (/)
│   ├── about/
│   │   └── page.tsx         # About page (/about)
│   └── blog/
│       ├── page.tsx         # Blog index (/blog)
│       └── [slug]/
│           └── page.tsx     # Dynamic blog post (/blog/:slug)
├── server/
│   ├── api/
│   │   └── hello.ts         # API route (/api/hello)
│   ├── actions/
│   │   └── auth.ts          # Server actions
│   └── middleware.ts         # Request middleware
├── components/              # Reusable components
├── public/                  # Static assets
├── velix.config.ts          # Velix configuration
├── package.json
└── tsconfig.json`}</CodeBlock>
          </Section>

          <Section id="routing" title="Routing">
            <P>Velix uses file-based routing. Every <IC>page.tsx</IC> file inside the <IC>app/</IC> directory becomes a route automatically.</P>

            <h3 className="text-lg font-semibold text-white mb-4">Basic Routes</h3>
            <CodeBlock>{`app/page.tsx           →  /
app/about/page.tsx     →  /about
app/blog/page.tsx      →  /blog
app/contact/page.tsx   →  /contact`}</CodeBlock>

            <h3 className="text-lg font-semibold text-white mb-4 mt-10">Dynamic Routes</h3>
            <P>Use bracket notation for dynamic segments:</P>
            <CodeBlock filename="app/blog/[slug]/page.tsx">{`export default function BlogPost({ params }) {
  return <h1>Post: {params.slug}</h1>;
}`}</CodeBlock>

            <h3 className="text-lg font-semibold text-white mb-4 mt-10">Catch-All Routes</h3>
            <P>Use spread notation to match any number of segments:</P>
            <CodeBlock filename="app/docs/[...path]/page.tsx">{`export default function DocsPage({ params }) {
  // /docs/a/b/c → params.path = ["a", "b", "c"]
  return <div>Path: {params.path.join("/")}</div>;
}`}</CodeBlock>
          </Section>

          <Section id="layouts" title="Layouts">
            <P>Layouts wrap pages and persist across navigation. Define a <IC>layout.tsx</IC> in any directory to apply it to all nested routes.</P>
            <CodeBlock filename="app/layout.tsx">{`import "./globals.css";

export const metadata = {
  title: "My App",
  description: "Built with Velix",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`}</CodeBlock>
            <Callout type="info">Nested layouts compose automatically. A layout in <IC>app/blog/layout.tsx</IC> wraps all pages under <IC>/blog/*</IC> while still being wrapped by the root layout.</Callout>
          </Section>

          <Section id="metadata" title="Metadata & SEO">
            <P>Export a <IC>metadata</IC> object from any page or layout to define SEO meta tags, Open Graph data, and more.</P>
            <CodeBlock filename="app/page.tsx">{`export const metadata = {
  title: "Home - My App",
  description: "Welcome to my Velix app",
  openGraph: {
    title: "My App",
    description: "Built with Velix v5",
    image: "/og-image.png",
  },
  robots: "index, follow",
};

export default function HomePage() {
  return <h1>Hello World</h1>;
}`}</CodeBlock>
          </Section>

          <Section id="styling" title="Styling">
            <P>Velix ships with Tailwind CSS v4 pre-configured. Define your theme in <IC>app/globals.css</IC> using the <IC>@theme</IC> directive.</P>
            <CodeBlock filename="app/globals.css">{`@import "tailwindcss";

@theme {
  --color-brand: #2563EB;
  --color-accent: #22D3EE;
  --font-sans: 'Inter', system-ui, sans-serif;
}`}</CodeBlock>
            <P>Then use your custom colors anywhere with Tailwind classes like <IC>bg-brand</IC> or <IC>text-accent</IC>.</P>
          </Section>

          <Section id="server-actions" title="Server Actions">
            <P>Server actions let you call server-side functions directly from your React components. No API routes needed — just define a function and call it.</P>

            <h3 className="text-lg font-semibold text-white mb-4">Creating an Action</h3>
            <CodeBlock filename="server/actions/notes.ts">{`import { serverAction } from "velix/server";

export const createNote = serverAction(async (data) => {
  const note = await db.notes.create({
    title: data.title,
    content: data.content,
  });
  return { success: true, note };
});`}</CodeBlock>

            <h3 className="text-lg font-semibold text-white mb-4 mt-10">Using in Components</h3>
            <CodeBlock filename="app/notes/page.tsx">{`import { createNote } from "../../server/actions/notes";

export default function NotesPage() {
  return (
    <form action={createNote}>
      <input name="title" placeholder="Note title" />
      <textarea name="content" placeholder="Content..." />
      <button type="submit">Create Note</button>
    </form>
  );
}`}</CodeBlock>
            <Callout type="tip">Server actions are type-safe and run exclusively on the server. They're perfect for form submissions, database mutations, and authenticated operations.</Callout>
          </Section>

          <Section id="api-routes" title="API Routes">
            <P>Create API endpoints by exporting HTTP method handlers from files in <IC>server/api/</IC>.</P>
            <CodeBlock filename="server/api/users.ts">{`// GET /api/users
export function GET(req) {
  const role = req.query?.role;
  const users = db.users.findAll({ role });
  return { users, count: users.length };
}

// POST /api/users
export function POST(req) {
  const user = db.users.create(req.body);
  return { user, message: "User created" };
}

// DELETE /api/users
export function DELETE(req) {
  const id = req.query?.id;
  db.users.delete(id);
  return { message: "User deleted" };
}`}</CodeBlock>
            <Callout type="info">The <IC>req</IC> object includes <IC>req.query</IC>, <IC>req.body</IC>, <IC>req.params</IC>, and <IC>req.headers</IC>. Return any object and it will be serialized as JSON.</Callout>
          </Section>

          <Section id="middleware" title="Middleware">
            <P>Middleware runs before every request. Use it for logging, authentication, CORS headers, or any request/response transformation.</P>
            <CodeBlock filename="server/middleware.ts">{`export default async function middleware(req, res, next) {
  const start = Date.now();

  // Authentication check
  if (req.url.startsWith("/api/admin")) {
    const token = req.headers.authorization;
    if (!verifyToken(token)) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
  }

  // Add headers
  res.setHeader("X-Request-Id", crypto.randomUUID());

  await next();

  console.log(\`\${req.method} \${req.url} - \${Date.now() - start}ms\`);
}`}</CodeBlock>
          </Section>

          <Section id="islands" title="Islands Architecture">
            <P>Velix ships zero JavaScript to the client by default. Only components explicitly marked as interactive ("islands") get hydrated in the browser.</P>
            <CodeBlock filename="app/page.tsx">{`// This component is server-rendered only (no JS shipped)
export default function HomePage() {
  return (
    <main>
      <h1>Static content — zero JS</h1>

      {/* Only this component gets hydrated */}
      <InteractiveCounter client:load />

      <p>More static content below</p>
    </main>
  );
}`}</CodeBlock>

            <h3 className="text-lg font-semibold text-white mb-4 mt-10">Hydration Directives</h3>
            <P>Control when islands are hydrated:</P>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/10"><th className="text-left py-3 px-4 text-slate-400 font-medium">Directive</th><th className="text-left py-3 px-4 text-slate-400 font-medium">Behavior</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  <tr><td className="py-3 px-4"><IC>client:load</IC></td><td className="py-3 px-4 text-slate-400">Hydrate immediately on page load</td></tr>
                  <tr><td className="py-3 px-4"><IC>client:visible</IC></td><td className="py-3 px-4 text-slate-400">Hydrate when visible in viewport</td></tr>
                  <tr><td className="py-3 px-4"><IC>client:idle</IC></td><td className="py-3 px-4 text-slate-400">Hydrate when browser is idle</td></tr>
                  <tr><td className="py-3 px-4"><IC>client:media</IC></td><td className="py-3 px-4 text-slate-400">Hydrate on media query match</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="plugins" title="Plugins">
            <P>Extend Velix with plugins. Plugins can hook into the build process, add middleware, register API routes, or modify the dev server.</P>
            <CodeBlock filename="velix.config.ts">{`import { defineConfig } from "@teamvelix/velix";
import analytics from "velix-plugin-analytics";
import sitemap from "velix-plugin-sitemap";

export default defineConfig({
  plugins: [
    analytics({ trackingId: "G-XXXXXXX" }),
    sitemap({ hostname: "https://myapp.com" }),
  ],
});`}</CodeBlock>
          </Section>

          <Section id="deployment" title="Deployment">
            <P>Velix builds to standard Node.js output. Deploy anywhere that runs Node.js 18+.</P>

            <h3 className="text-lg font-semibold text-white mb-4">Build for Production</h3>
            <CodeBlock filename="Terminal">{`npm run build    # Build optimized production bundle
npm run start    # Start production server`}</CodeBlock>

            <h3 className="text-lg font-semibold text-white mb-4 mt-10">Vercel</h3>
            <P>Deploy to Vercel with zero configuration:</P>
            <CodeBlock filename="Terminal">{`npm i -g vercel
vercel`}</CodeBlock>

            <h3 className="text-lg font-semibold text-white mb-4 mt-10">Docker</h3>
            <CodeBlock filename="Dockerfile">{`FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`}</CodeBlock>
          </Section>

          <Section id="examples" title="Examples">
            <P>Explore real-world examples built with Velix:</P>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Blog Starter", description: "Full-featured blog with markdown, categories, and RSS" },
                { name: "E-Commerce", description: "Product catalog with cart, checkout, and payments" },
                { name: "SaaS Dashboard", description: "Admin dashboard with auth, CRUD, and charts" },
                { name: "API Backend", description: "REST API with database, auth, and rate limiting" },
              ].map((example, i) => (
                <a key={i} href="#" className="p-5 rounded-xl bg-velix-dark/40 border border-white/5 hover:border-velix-cyan/20 transition-all group">
                  <h4 className="text-sm font-semibold text-white group-hover:text-velix-cyan transition-colors mb-1">{example.name}</h4>
                  <p className="text-xs text-slate-500">{example.description}</p>
                </a>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
