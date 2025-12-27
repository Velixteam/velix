
import type { TemplateFiles } from './index.js';

export function fullstackTemplate(projectName: string, options: { styling?: 'tailwind' | 'css' } = {}): TemplateFiles {
  const isTailwind = options.styling !== 'css'; // Default to Tailwind

  return {
    // ========================================================================
    // Config Files
    // ========================================================================

    'package.json': JSON.stringify({
      name: projectName,
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: {
        dev: isTailwind ? 'npm run css && flexireact dev' : 'flexireact dev',
        build: isTailwind ? 'npm run css && flexireact build' : 'flexireact build',
        start: 'flexireact start',
        ...(isTailwind ? { css: 'tailwindcss -i ./app/styles/globals.css -o ./public/styles.css --minify' } : {}),
        'db:generate': 'drizzle-kit generate',
        'db:migrate': 'drizzle-kit migrate',
        'db:studio': 'drizzle-kit studio',
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        '@flexireact/core': '^4.1.0',
        '@flexireact/flexiguard': '^1.0.0',
        'drizzle-orm': '^0.30.0',
        'better-sqlite3': '^9.4.0',
        'lucide-react': '^0.344.0',
        clsx: '^2.1.0',
        'tailwind-merge': '^2.2.0',
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        '@types/better-sqlite3': '^7.6.9',
        typescript: '^5.3.0',
        'drizzle-kit': '^0.20.14',
        ...(isTailwind ? {
          tailwindcss: '^4.0.0',
          '@tailwindcss/cli': '^4.0.0',
          '@tailwindcss/postcss': '^4.0.0',
        } : {}),
      },
    }, null, 2),

    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        lib: ['DOM', 'DOM.Iterable', 'ES2022'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        baseUrl: '.',
        paths: {
          '@/*': ['./*'],
        },
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules', '.flexi', 'public'],
    }, null, 2),

    'drizzle.config.ts': `import type { Config } from 'drizzle-kit';

export default {
  schema: './schema.ts',
  out: './drizzle',
  driver: 'better-sqlite',
  dbCredentials: {
    url: 'sqlite.db',
  },
} satisfies Config;
`,

    ...(isTailwind ? {
      'postcss.config.js': `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`,
    } : {}),

    'flexireact.config.js': `/** @type {import('@flexireact/core').FlexiConfig} */
const config = {
  styles: [
    '/styles.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
  ],
  server: {
    port: 3000,
  },
  islands: { enabled: true },
};

export default config;
`,

    // ========================================================================
    // Database & Auth
    // ========================================================================

    'schema.ts': `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  avatar: text('avatar'),
  role: text('role').default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const items = sqliteTable('items', {
  id: text('id').primaryKey(), // We'll manage IDs in app or use default random
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});
`,

    'lib/db.ts': `import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../schema';

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });
`,

    'lib/auth.ts': `import { createAuth } from '@flexireact/flexiguard';
import { DrizzleAdapter } from '@flexireact/flexiguard/adapters/drizzle';
import { db } from './db';
import * as schema from '../schema';

export const auth = createAuth({
  adapter: DrizzleAdapter({ db, schema }),
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  password: {
    minLength: 8,
  },
});
`,

    // ========================================================================
    // App Structure
    // ========================================================================

    'app/layout.tsx': `import React from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body className="${isTailwind ? 'bg-background text-foreground min-h-screen antialiased flex flex-col' : 'app-body'}">
        <Navbar />
        <main className="${isTailwind ? 'flex-1' : 'main-content'}">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
`,

    // ========================================================================
    // Routes
    // ========================================================================

    'routes/(public)/home.tsx': `import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { Shield, Database, Zap } from 'lucide-react';

export const metadata = {
  title: 'FlexiStack - Production Ready Starter',
  description: 'Fullstack React framework with Auth, Database, and API routes.',
};

export default function HomePage() {
  return (
    <div className="${isTailwind ? 'flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-16' : 'home-page'}">
      <div className="${isTailwind ? 'max-w-4xl mx-auto text-center space-y-8' : 'container'}">
        <div className="${isTailwind ? 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium' : 'badge'}">
          <span>🚀 Production Ready</span>
        </div>

        <h1 className="${isTailwind ? 'text-5xl md:text-7xl font-bold tracking-tight' : 'page-title'}">
          Build faster with
          <br />
          <span className="${isTailwind ? 'text-primary' : 'highlight'}">FlexiStack</span>
        </h1>

        <p className="${isTailwind ? 'text-xl text-muted-foreground max-w-2xl mx-auto' : 'subtitle'}">
          The ultimate starter with FlexiReact v4, FlexiGuard Auth, Drizzle ORM, and CRUD API examples.
        </p>

        <div className="${isTailwind ? 'flex gap-4 justify-center pt-4' : 'actions'}">
          <Button size="lg" href="/login">Get Started</Button>
          <Button variant="outline" size="lg" href="/dashboard">View Dashboard</Button>
        </div>

        <div className="${isTailwind ? 'grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 text-left' : 'features-grid'}">
          <Feature 
            icon={<Shield className="w-6 h-6 text-primary" />}
            title="Authentication"
            desc="Secure auth powered by FlexiGuard. Login, register, and session management ready to go."
          />
          <Feature 
            icon={<Database className="w-6 h-6 text-primary" />}
            title="Database"
            desc="Drizzle ORM with SQLite. Type-safe database queries, schemas, and migrations."
          />
          <Feature 
            icon={<Zap className="w-6 h-6 text-primary" />}
            title="API Routes"
            desc="Integrated API routes with CRUD operations. Build your backend alongside your UI."
          />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: any) {
  return (
    <div className="${isTailwind ? 'p-6 rounded-xl border border-border bg-card' : 'feature-card'}">
      <div className="${isTailwind ? 'mb-4' : 'feature-icon'}">{icon}</div>
      <h3 className="${isTailwind ? 'text-lg font-semibold mb-2' : 'feature-title'}">{title}</h3>
      <p className="${isTailwind ? 'text-muted-foreground' : 'feature-desc'}">{desc}</p>
    </div>
  );
}
`,

    'routes/(auth)/login.tsx': `import React from 'react';
import { Button } from '@/app/components/ui/Button';

export const metadata = {
  title: 'Login - FlexiStack',
};

export default function LoginPage() {
  return (
    <div className="${isTailwind ? 'flex items-center justify-center min-h-[calc(100vh-16rem)]' : 'auth-page'}">
      <div className="${isTailwind ? 'w-full max-w-md p-8 rounded-xl border border-border bg-card' : 'auth-card'}">
        <h1 className="${isTailwind ? 'text-2xl font-bold mb-6 text-center' : 'auth-title'}">Welcome Back</h1>
        <form className="space-y-4" action="/api/auth/login" method="POST">
          <div>
            <label className="${isTailwind ? 'block text-sm font-medium mb-1' : 'label'}">Email</label>
            <input 
              type="email" 
              name="email"
              className="${isTailwind ? 'w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none' : 'input'}" 
              placeholder="john@example.com"
              required 
            />
          </div>
          <div>
            <label className="${isTailwind ? 'block text-sm font-medium mb-1' : 'label'}">Password</label>
            <input 
              type="password" 
              name="password"
              className="${isTailwind ? 'w-full px-3 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none' : 'input'}" 
              placeholder="••••••••"
              required 
            />
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
        </form>
        <p className="${isTailwind ? 'mt-4 text-center text-sm text-muted-foreground' : 'auth-footer'}">
          Don't have an account? <a href="/register" className="text-primary hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
`,

    'routes/(app)/dashboard.tsx': `import React from 'react';
import { Button } from '@/app/components/ui/Button';

// Mock data fetch - in real implementation this uses internal API or DB call
async function getItems() {
  // In a real SSR environment, you would call your DB here directly
  // const items = await db.select().from(schema.items).where(...)
  return [
    { id: '1', content: 'Review pull requests', completed: true },
    { id: '2', content: 'Update documentation', completed: false },
    { id: '3', content: 'Launch v4.0', completed: false },
  ];
}

export const metadata = {
  title: 'Dashboard - FlexiStack',
};

export default async function DashboardPage() {
  // const session = await auth.getSession();
  // if (!session) return redirect('/login');
  
  const user = { name: 'Demo User', email: 'demo@example.com' };
  const items = await getItems();

  return (
    <div className="${isTailwind ? 'container mx-auto px-4 py-8' : 'dashboard-page'}">
      <div className="${isTailwind ? 'flex items-center justify-between mb-8' : 'dashboard-header'}">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button variant="outline">Sign Out</Button>
        </form>
      </div>

      <div className="${isTailwind ? 'grid grid-cols-1 lg:grid-cols-3 gap-8' : 'dashboard-grid'}">
        {/* Profile Card */}
        <div className="${isTailwind ? 'p-6 rounded-xl border border-border bg-card h-fit' : 'dashboard-card'}">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                 {user.name.charAt(0)}
               </div>
               <div>
                 <div className="font-medium">{user.name}</div>
                 <div className="text-sm text-muted-foreground">{user.email}</div>
               </div>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-1">Role</div>
              <div className="inline-flex items-center px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                Admin
              </div>
            </div>
          </div>
        </div>
        
        {/* Todo List / Items (CRUD Example) */}
        <div className="${isTailwind ? 'col-span-1 lg:col-span-2 p-6 rounded-xl border border-border bg-card' : 'dashboard-card'}">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Tasks</h2>
            <form action="/api/items" method="POST" className="flex gap-2">
               <input 
                 type="text" 
                 name="content"
                 placeholder="New task..." 
                 className="${isTailwind ? 'px-3 py-1.5 rounded-lg bg-background border border-border text-sm focus:ring-1 focus:ring-primary outline-none' : 'input'}"
                 required
               />
               <Button size="sm">Add</Button>
            </form>
          </div>
          
          <div className="space-y-2">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="${isTailwind ? 'flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors' : 'list-item'}">
                  <div className="flex items-center gap-3">
                    <form action={\`/api/items/\${item.id}/toggle\`} method="POST">
                       <button className={\`w-5 h-5 rounded border flex items-center justify-center transition-colors \${item.completed ? 'bg-primary border-primary text-black' : 'border-muted-foreground'}\`}>
                         {item.completed && '✓'}
                       </button>
                    </form>
                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                      {item.content}
                    </span>
                  </div>
                  <form action={\`/api/items/\${item.id}/delete\`} method="POST">
                    <button className="text-muted-foreground hover:text-red-500 transition-colors">
                      <TrashIcon />
                    </button>
                  </form>
                </div>
              ))
            ) : (
               <p className="text-muted-foreground text-center py-8">No tasks yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}
`,

    // API Routes
    'routes/api/items/index.ts': `import { db } from '@/lib/db';
import { items } from '@/schema';
// import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  // const session = await getSession(req);
  // if (!session) return new Response('Unauthorized', { status: 401 });

  const formData = await req.formData();
  const content = formData.get('content') as string;
  const userId = 'demo-user-id'; // session.user.id

  if (!content) return new Response('Content required', { status: 400 });

  await db.insert(items).values({
    id: crypto.randomUUID(),
    userId,
    content,
  });

  // Redirect back to dashboard to refresh
  return new Response(null, { status: 302, headers: { Location: '/dashboard' } });
}
`,

    'routes/api/items/[id]/toggle.ts': `import { db } from '@/lib/db';
import { items } from '@/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // In real app, check user ID match
  const item = await db.select().from(items).where(eq(items.id, params.id)).get();
  
  if (item) {
    await db.update(items)
      .set({ completed: !item.completed })
      .where(eq(items.id, params.id));
  }

  return new Response(null, { status: 302, headers: { Location: '/dashboard' } });
}
`,

    'routes/api/items/[id]/delete.ts': `import { db } from '@/lib/db';
import { items } from '@/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await db.delete(items).where(eq(items.id, params.id));
  return new Response(null, { status: 302, headers: { Location: '/dashboard' } });
}
`,

    // ========================================================================
    // Components
    // ========================================================================

    'app/components/ui/Button.tsx': `import React from 'react';
import { cn } from '@/lib/utils'; // Keep utility usage, fallback implementation below if not tailwind

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  href,
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = ${isTailwind
        ? "'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'"
        : "'btn'"};
  
  const variants = {
    primary: ${isTailwind ? "'bg-primary text-black hover:bg-primary/90 focus:ring-primary'" : "'btn-primary'"},
    secondary: ${isTailwind ? "'bg-secondary text-secondary-foreground hover:bg-secondary/80'" : "'btn-secondary'"},
    outline: ${isTailwind ? "'border border-input hover:bg-accent hover:text-accent-foreground'" : "'btn-outline'"},
    ghost: ${isTailwind ? "'hover:bg-accent hover:text-accent-foreground'" : "'btn-ghost'"},
  };

  const sizes = {
    sm: ${isTailwind ? "'h-9 px-3 text-sm'" : "'btn-sm'"},
    md: ${isTailwind ? "'h-10 px-4 py-2'" : "'btn-md'"},
    lg: ${isTailwind ? "'h-11 px-8 text-lg'" : "'btn-lg'"},
  };

  const classes = cn(
    baseStyles,
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return <a href={href} className={classes}>{children}</a>;
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
`,

    'app/components/layout/Navbar.tsx': `import React from 'react';
import { Zap } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="${isTailwind ? 'border-b border-border bg-background' : 'navbar'}">
      <div className="${isTailwind ? 'container mx-auto px-4 h-16 flex items-center justify-between' : 'navbar-container'}">
        <a href="/" className="${isTailwind ? 'flex items-center gap-2 font-bold text-xl' : 'navbar-brand'}">
          <Zap className="text-primary" />
          <span>FlexiStack</span>
        </a>
        <div className="${isTailwind ? 'flex items-center gap-6' : 'navbar-links'}">
          <a href="/login" className="${isTailwind ? 'text-sm font-medium hover:text-primary transition-colors' : 'nav-link'}">Login</a>
          <a href="/register" className="${isTailwind ? 'text-sm font-medium hover:text-primary transition-colors' : 'nav-link'}">Register</a>
        </div>
      </div>
    </nav>
  );
}
`,

    'app/components/layout/Footer.tsx': `import React from 'react';

export function Footer() {
  return (
    <footer className="${isTailwind ? 'border-t border-border py-8 text-center text-sm text-muted-foreground' : 'footer'}">
      <p>© {new Date().getFullYear()} FlexiStack. Built with FlexiReact v4.</p>
    </footer>
  );
}
`,

    // ========================================================================
    // Styles & Utils
    // ========================================================================

    'app/styles/globals.css': isTailwind ? `@import "tailwindcss";

@theme {
  --color-background: #0a0a0a;
  --color-foreground: #ffffff;
  --color-primary: #00FF9C;
  --color-primary-foreground: #000000;
  --color-secondary: #27272a;
  --color-secondary-foreground: #ffffff;
  --color-muted: #27272a;
  --color-muted-foreground: #a1a1aa;
  --color-accent: #27272a;
  --color-accent-foreground: #ffffff;
  --color-border: #27272a;
  --color-input: #27272a;
  --color-card: #18181b;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: var(--color-background);
  color: var(--color-foreground);
}
` : `/* Modern CSS Variables */
:root {
  --bg-color: #0a0a0a;
  --text-color: #ffffff;
  --primary-color: #00FF9C;
  --border-color: #333;
}

body {
  background: var(--bg-color);
  color: var(--text-color);
  margin: 0;
  font-family: system-ui, sans-serif;
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.btn { display: inline-flex; padding: 10px 20px; border-radius: 6px; font-weight: 600; text-decoration: none; cursor: pointer; border: none; }
.btn-primary { background: var(--primary-color); color: #000; }
.btn-outline { border: 1px solid var(--border-color); color: white; background: transparent; }
.home-page { text-align: center; padding: 80px 20px; }
.page-title { font-size: 4rem; line-height: 1.1; margin-bottom: 20px; }
.highlight { color: var(--primary-color); }
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 60px; }
.feature-card { padding: 20px; border: 1px solid var(--border-color); border-radius: 10px; background: #111; }
.navbar { border-bottom: 1px solid var(--border-color); padding: 15px 0; }
.navbar-container { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.navbar-brand { display: flex; align-items: center; gap: 10px; font-weight: bold; font-size: 1.2rem; color: white; text-decoration: none; }
.nav-link { color: #888; text-decoration: none; font-weight: 500; }
.nav-link:hover { color: var(--primary-color); }
`,

    'lib/utils.ts': `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
  };
}

