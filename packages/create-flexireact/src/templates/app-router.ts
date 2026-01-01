/**
 * App Router Template - Next.js style app/ directory
 */

import type { TemplateFiles } from './index.js';

export function appRouterTemplate(projectName: string): TemplateFiles {
  return {
    'package.json': JSON.stringify({
      name: projectName,
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'flexireact dev',
        build: 'flexireact build',
        start: 'flexireact start',
      },
      dependencies: {
        'react': '^19.2.1',
        'react-dom': '^19.2.1',
        '@flexireact/core': '^4.1.0',
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        'typescript': '^5.7.0',
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
        noEmit: true,
        baseUrl: '.',
        paths: { '@/*': ['./*'] },
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules', '.flexi'],
    }, null, 2),

    'flexireact.config.js': `export default {
  server: { port: 3000 },
  appDir: 'app',
};
`,

    'app/layout.tsx': `import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FlexiReact App</title>
        <style>{\`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; }
        \`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
`,

    'app/page.tsx': `import React from 'react';

export default function HomePage() {
  return (
    <main style={styles.main}>
      <div style={styles.logo}>F</div>
      <h1 style={styles.title}>FlexiReact App Router</h1>
      <p style={styles.text}>Next.js style routing with app/ directory</p>
      <div style={styles.links}>
        <a href="/dashboard" style={styles.link}>Dashboard →</a>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '20px',
  },
  logo: {
    width: '80px',
    height: '80px',
    background: '#00FF9C',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    fontWeight: 900,
    color: '#000',
    marginBottom: '30px',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '16px',
  },
  text: {
    color: '#888',
    marginBottom: '32px',
  },
  links: {
    display: 'flex',
    gap: '16px',
  },
  link: {
    color: '#00FF9C',
    textDecoration: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    background: 'rgba(0, 255, 156, 0.1)',
  },
};
`,

    'app/dashboard/page.tsx': `import React from 'react';

export default function DashboardPage() {
  return (
    <div style={{ padding: 40 }}>
      <a href="/" style={{ color: '#00FF9C', textDecoration: 'none' }}>← Back</a>
      <h1 style={{ marginTop: 30, marginBottom: 20 }}>Dashboard</h1>
      <p style={{ color: '#888' }}>This is a nested route: app/dashboard/page.tsx</p>
    </div>
  );
}
`,

    'app/api/hello/route.ts': `export async function GET() {
  return Response.json({ message: 'Hello from App Router API!' });
}
`,

    '.gitignore': `node_modules/
.flexi/
dist/
.env
`,
  };
}
