
/**
 * Default Template - Full-featured FlexiReact v4 setup
 * 
 * Structure:
 * - app/          : Layout, components, styles, providers
 * - routes/       : FlexiReact v4 file-based routing
 * - lib/          : Utilities
 * - public/       : Static assets
 */

import type { TemplateFiles } from './index.js';

export function defaultTemplate(projectName: string, options: { styling?: 'tailwind' | 'css' } = {}): TemplateFiles {
  const isTailwind = options.styling !== 'css';

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
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        '@flexireact/core': '^4.1.0',
        'lucide-react': '^0.468.0',
        clsx: '^2.1.0',
        'tailwind-merge': '^2.2.0',
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        typescript: '^5.3.0',
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
          '@/components/*': ['./app/components/*'],
          '@/lib/*': ['./lib/*'],
        },
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules', '.flexi', 'public'],
    }, null, 2),

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
  favicon: '/favicon.svg',
  server: {
    port: 3000,
  },
  islands: { enabled: true },
};

export default config;
`,

    // ========================================================================
    // App Directory - Layout, Components, Styles
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
        <link rel="icon" href="/favicon.svg" />
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

    // Components - UI
    'app/components/ui/Button.tsx': `import React from 'react';
import { cn } from '@/lib/utils'; // Keep utility usage

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
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
        ? "'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed'"
        : "'btn'"};
  
  const variants = {
    primary: ${isTailwind ? "'bg-primary text-black hover:bg-primary/90'" : "'btn-primary'"},
    secondary: ${isTailwind ? "'bg-secondary text-white hover:bg-secondary/80'" : "'btn-secondary'"},
    ghost: ${isTailwind ? "'hover:bg-white/5'" : "'btn-ghost'"},
    outline: ${isTailwind ? "'border border-border hover:bg-white/5 hover:border-primary'" : "'btn-outline'"},
  };

  const sizes = {
    sm: ${isTailwind ? "'px-3 py-1.5 text-sm'" : "'btn-sm'"},
    md: ${isTailwind ? "'px-4 py-2 text-sm'" : "'btn-md'"},
    lg: ${isTailwind ? "'px-6 py-3 text-base'" : "'btn-lg'"},
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

    'app/components/ui/Card.tsx': `import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        ${isTailwind ? "'rounded-xl border border-border p-6 transition-all hover:border-primary/50'" : "'card'"},
        {
          ...(isTailwind ? {
            'bg-card': variant === 'default',
            'bg-white/5 backdrop-blur-xl': variant === 'glass',
          } : {})
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(${isTailwind ? "'mb-4'" : "'card-header'"}, className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn(${isTailwind ? "'text-lg font-semibold'" : "'card-title'"}, className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(${isTailwind ? "'text-muted-foreground'" : "'card-content'"}, className)} {...props} />;
}
`,

    'app/components/ui/index.ts': `export { Button } from './Button';
export { Card, CardHeader, CardTitle, CardContent } from './Card';
`,

    // Components - Layout
    'app/components/layout/Navbar.tsx': `import React from 'react';
import { Zap, Github } from 'lucide-react';

export function Navbar() {
  return (
    <header className="${isTailwind ? 'sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl' : 'navbar'}">
      <nav className="${isTailwind ? 'container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl' : 'navbar-container'}">
        <a href="/" className="${isTailwind ? 'flex items-center gap-2' : 'navbar-brand'}">
          <div className="${isTailwind ? 'w-8 h-8 bg-primary rounded-lg flex items-center justify-center' : 'logo-container'}">
            <Zap className="${isTailwind ? 'w-5 h-5 text-black' : 'logo-icon'}" />
          </div>
          <span className="${isTailwind ? 'font-semibold text-lg' : 'brand-text'}">FlexiReact</span>
        </a>
        
        <div className="${isTailwind ? 'flex items-center gap-6' : 'navbar-links'}">
          <a href="/" className="${isTailwind ? 'text-sm text-muted-foreground hover:text-foreground transition-colors' : 'nav-link'}">Home</a>
          <a href="/about" className="${isTailwind ? 'text-sm text-muted-foreground hover:text-foreground transition-colors' : 'nav-link'}">About</a>
          <a href="/blog" className="${isTailwind ? 'text-sm text-muted-foreground hover:text-foreground transition-colors' : 'nav-link'}">Blog</a>
          <a 
            href="https://github.com/flexireact/flexireact" 
            target="_blank"
            className="${isTailwind ? 'text-sm text-muted-foreground hover:text-foreground transition-colors' : 'nav-link'}"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </nav>
    </header>
  );
}
`,

    'app/components/layout/Footer.tsx': `import React from 'react';

export function Footer() {
  return (
    <footer className="${isTailwind ? 'border-t border-border py-8 mt-auto' : 'footer'}">
      <div className="${isTailwind ? 'container mx-auto px-4 text-center text-sm text-muted-foreground max-w-6xl' : 'footer-container'}">
        <p>Built with FlexiReact v4 • {new Date().getFullYear()}</p>
        <p className="${isTailwind ? 'mt-2' : ''}">
          <a href="https://discord.gg/rFSZxFtpAA" target="_blank" rel="noopener noreferrer" className="${isTailwind ? 'text-primary hover:underline' : 'link'}">
            Join our Discord Community 💬
          </a>
        </p>
      </div>
    </footer>
  );
}
`,

    'app/components/layout/index.ts': `export { Navbar } from './Navbar';
export { Footer } from './Footer';
`,

    'app/components/index.ts': `export * from './ui';
export * from './layout';
`,

    // Providers
    'app/providers/ThemeProvider.tsx': `'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // For classic CSS body class handling could be added here if needed
  if (${!isTailwind}) {
    useEffect(() => {
      document.body.className = theme;
    }, [theme]);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
`,

    // Styles
    'app/styles/globals.css': isTailwind ? `@import "tailwindcss";

/* FlexiReact v4 Theme */
@theme {
  /* Colors */
  --color-background: #0a0a0a;
  --color-foreground: #fafafa;
  --color-primary: #00FF9C;
  --color-secondary: #1a1a1a;
  --color-muted: #71717a;
  --color-muted-foreground: #a1a1aa;
  --color-border: #27272a;
  --color-card: #18181b;
  
  /* Typography */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  
  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-foreground);
  -webkit-font-smoothing: antialiased;
}
` : `/* Modern CSS Variables */
:root {
  --bg-color: #0a0a0a;
  --text-color: #ffffff;
  --primary-color: #00FF9C;
  --border-color: #333;
  --card-bg: #18181b;
  --muted-text: #a1a1aa;
}

body {
  background: var(--bg-color);
  color: var(--text-color);
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Structural Classes */
.app-body { min-height: 100vh; display: flex; flex-direction: column; }
.main-content { flex: 1; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; border-radius: 8px; font-weight: 600; text-decoration: none; cursor: pointer; border: none; transition: all 0.2s; }
.btn-primary { background: var(--primary-color); color: #000; }
.btn-primary:hover { opacity: 0.9; }
.btn-outline { border: 1px solid var(--border-color); color: white; background: transparent; }
.btn-outline:hover { border-color: var(--primary-color); }
.btn-ghost { background: transparent; color: white; }
.btn-ghost:hover { background: rgba(255,255,255,0.1); }
.btn-sm { font-size: 0.8rem; padding: 5px 10px; }
.btn-lg { font-size: 1.2rem; padding: 15px 30px; }

/* Navbar */
.navbar { border-bottom: 1px solid var(--border-color); padding: 15px 0; background: rgba(10,10,10,0.8); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 50; }
.navbar-container { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.navbar-brand { display: flex; align-items: center; gap: 10px; font-weight: bold; font-size: 1.2rem; color: white; text-decoration: none; }
.logo-container { width: 32px; height: 32px; background: var(--primary-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.logo-icon { color: black; width: 20px; height: 20px; }
.navbar-links { display: flex; gap: 20px; }
.nav-link { color: var(--muted-text); text-decoration: none; font-weight: 500; font-size: 0.9rem; }
.nav-link:hover { color: white; }

/* Footer */
.footer { border-top: 1px solid var(--border-color); padding: 40px 0; margin-top: auto; text-align: center; color: var(--muted-text); font-size: 0.9rem; }
.footer-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.link { color: var(--primary-color); text-decoration: none; }
.link:hover { text-decoration: underline; }

/* Cards */
.card { border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; background: var(--card-bg); transition: border-color 0.2s; }
.card:hover { border-color: rgba(0, 255, 156, 0.5); }
.card-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 10px; margin-top: 0; }
.card-content { color: var(--muted-text); }
.feature-icon { margin-bottom: 15px; color: var(--primary-color); }

/* Home Page Specifics */
.home-page { text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: calc(100vh - 8rem); }
.badge { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 99px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; color: var(--muted-text); margin-bottom: 30px; }
.page-title { font-size: 4rem; line-height: 1.1; margin-bottom: 20px; font-weight: 800; letter-spacing: -0.02em; }
.highlight { background: linear-gradient(to right, var(--primary-color), #00D68F); -webkit-background-clip: text; color: transparent; }
.subtitle { font-size: 1.25rem; color: var(--muted-text); max-width: 600px; margin: 0 auto 40px; line-height: 1.6; }
.actions { display: flex; gap: 15px; justify-content: center; }
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 60px; text-align: left; width: 100%; max-width: 900px; }
`,

    'lib/utils.ts': `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,

    // ========================================================================
    // Routes Directory - FlexiReact v4 Routing
    // ========================================================================

    'routes/(public)/home.tsx': `import React from 'react';
import { Button } from '@/app/components/ui';
import { Zap, Box, Palette, Lock } from 'lucide-react';

export const metadata = {
  title: 'FlexiReact v4 - The Modern React Framework',
  description: 'Build fast, modern web apps with FlexiReact v4',
};

export default function HomePage() {
  return (
    <div className="${isTailwind ? 'flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4' : 'home-page'}">
      <div className="${isTailwind ? 'max-w-4xl mx-auto text-center space-y-8' : 'container'}">
        {/* Badge */}
        <div className="${isTailwind ? 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm' : 'badge'}">
          <span className="${isTailwind ? 'relative flex h-2 w-2' : ''}">
             {/* Badge dot logic simplified for css mode */}
            {${isTailwind} && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
            <span className="${isTailwind ? 'relative inline-flex rounded-full h-2 w-2 bg-primary' : 'badge-dot'}"></span>
          </span>
          <span className="${isTailwind ? 'text-muted-foreground' : ''}">Introducing FlexiReact v4.0</span>
        </div>

        {/* Heading */}
        <h1 className="${isTailwind ? 'text-5xl md:text-7xl font-bold tracking-tight' : 'page-title'}">
          The React Framework
          <br />
          <span className="${isTailwind ? 'bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent' : 'highlight'}">
            for the Web
          </span>
        </h1>

        {/* Description */}
        <p className="${isTailwind ? 'text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed' : 'subtitle'}">
          FlexiReact enables you to create full-stack web applications with TypeScript${isTailwind ? ", Tailwind CSS," : ""}, and modern tooling.
        </p>

        {/* CTA Buttons */}
        <div className="${isTailwind ? 'flex flex-col sm:flex-row gap-4 justify-center pt-4' : 'actions'}">
          <Button size="lg" className="${isTailwind ? 'text-base' : ''}">
            Get Started →
          </Button>
          <Button variant="outline" size="lg" className="${isTailwind ? 'text-base' : ''}">
            Learn More
          </Button>
        </div>

        {/* Features Grid */}
        <div className="${isTailwind ? 'grid grid-cols-2 md:grid-cols-4 gap-4 pt-16 max-w-3xl mx-auto' : 'features-grid'}">
          <Feature icon={<Zap size={24} />} label="Fast Refresh" />
          <Feature icon={<Box size={24} />} label="File Routing" />
          <Feature icon={<Palette size={24} />} label="${isTailwind ? 'Tailwind CSS' : 'Modern CSS'}" />
          <Feature icon={<Lock size={24} />} label="TypeScript" />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label }: any) {
  return (
    <div className="${isTailwind ? 'flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-white/5 hover:bg-white/10 transition-colors' : 'feature-card'}">
      <span className="${isTailwind ? 'text-primary' : 'feature-icon'}">{icon}</span>
      <span className="${isTailwind ? 'text-sm font-medium' : 'feature-label'}">{label}</span>
    </div>
  );
}
`,

    'routes/(public)/about.tsx': `import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui';

export const metadata = {
  title: 'About - FlexiReact',
};

export default function AboutPage() {
  return (
    <div className="${isTailwind ? 'container mx-auto px-4 py-16 max-w-3xl' : 'container'}">
      <h1 className="${isTailwind ? 'text-4xl font-bold mb-8' : 'page-title'}">About FlexiReact</h1>
      
      <Card className="${isTailwind ? 'mb-6' : ''}">
        <CardHeader>
          <CardTitle>What is FlexiReact?</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            FlexiReact is a modern React framework designed for building fast, 
            scalable web applications. It combines the best features of popular 
            frameworks with a flexible, intuitive API.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="${isTailwind ? 'space-y-2' : 'feature-list'}">
            <li>✓ Server-Side Rendering (SSR)</li>
            <li>✓ Static Site Generation (SSG)</li>
            <li>✓ Islands Architecture</li>
            <li>✓ File-based Routing</li>
            <li>✓ TypeScript Support</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
`,

    'routes/blog/index.tsx': `import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui';

export const metadata = {
  title: 'Blog - FlexiReact',
};

const posts = [
  { slug: 'getting-started', title: 'Getting Started', excerpt: 'Learn how to build your first app...' },
  { slug: 'routing', title: 'File-based Routing', excerpt: 'Deep dive into the router...' },
  { slug: 'islands', title: 'Islands Architecture', excerpt: 'Partial hydration for performance...' },
];

export default function BlogPage() {
  return (
    <div className="${isTailwind ? 'container mx-auto px-4 py-16 max-w-6xl' : 'container'}">
      <h1 className="${isTailwind ? 'text-4xl font-bold mb-8' : 'page-title'}">Blog</h1>
      
      <div className="${isTailwind ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'features-grid'}">
        {posts.map((post) => (
          <a key={post.slug} href={\`/blog/\${post.slug}\`} style={{ textDecoration: 'none' }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{post.excerpt}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
`,

    'routes/blog/[slug].tsx': `import React from 'react';
import { Button } from '@/app/components/ui';

interface BlogPostProps {
  params: { slug: string };
}

export default function BlogPost({ params }: BlogPostProps) {
  return (
    <div className="${isTailwind ? 'container mx-auto px-4 py-16 max-w-3xl' : 'container'}">
      <div className="mb-8">
        <Button variant="ghost" size="sm" href="/blog">← Back to Blog</Button>
      </div>
      
      <h1 className="${isTailwind ? 'text-4xl font-bold mb-4' : 'page-title'}">Blog Post: {params.slug}</h1>
      
      <p className="${isTailwind ? 'text-muted-foreground mb-8' : 'subtitle'}">
        This is a dynamic route. The slug parameter is: <code className="${isTailwind ? 'text-primary' : 'highlight'}">{params.slug}</code>
      </p>
      
      <div className="prose prose-invert">
        <p>
          This page demonstrates dynamic routing in FlexiReact v4. 
          The [slug].tsx file creates a dynamic route that matches any path under /blog/.
        </p>
      </div>
    </div>
  );
}
`,

    // API routes
    'routes/api/hello.ts': `export async function GET() {
  return Response.json({
    message: 'Hello from FlexiReact API!',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({
    received: body,
    message: 'POST request received',
  });
}
`,

    // ========================================================================
    // Public Directory
    // ========================================================================

    'public/favicon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00FF9C"/>
      <stop offset="100%" style="stop-color:#00D68F"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="#0a0a0a"/>
  <text x="50" y="68" font-family="system-ui" font-size="50" font-weight="900" fill="url(#grad)" text-anchor="middle">F</text>
</svg>`,

    'public/.gitkeep': '',

    // ========================================================================
    // Git
    // ========================================================================

    '.gitignore': `# Dependencies
node_modules/
.pnpm-store/

# Build
.flexi/
dist/
public/styles.css

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
`,
  };
}
