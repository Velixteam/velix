import type { TemplateFiles } from './index.js';

export function defaultTemplate(projectName: string, options: { styling?: 'tailwind' | 'css' } = {}): TemplateFiles {
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
  styles: ['/styles.css'],
};
`,

    'pages/index.tsx': `import React from 'react';

export default function HomePage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>F</div>
        <h1 style={styles.title}>Welcome to FlexiReact</h1>
        <p style={styles.subtitle}>
          Edit <code style={styles.code}>pages/index.tsx</code> to get started
        </p>
        <div style={styles.links}>
          <a href="https://github.com/aspect-dev/flexireact" style={styles.link}>GitHub</a>
          <a href="/about" style={styles.link}>About</a>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    textAlign: 'center',
    padding: '60px 40px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '500px',
  },
  logo: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #00FF9C 0%, #00D68F 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    fontWeight: 900,
    color: '#000',
    margin: '0 auto 30px',
  },
  title: { fontSize: '2.5rem', fontWeight: 700, color: '#fff', margin: '0 0 16px' },
  subtitle: { fontSize: '1.1rem', color: '#888', margin: '0 0 32px' },
  code: { background: 'rgba(0, 255, 156, 0.1)', color: '#00FF9C', padding: '4px 8px', borderRadius: '6px' },
  links: { display: 'flex', gap: '16px', justifyContent: 'center' },
  link: { color: '#00FF9C', textDecoration: 'none', padding: '12px 24px', borderRadius: '12px', background: 'rgba(0, 255, 156, 0.1)' },
};
`,

    'pages/about.tsx': `import React from 'react';

export default function AboutPage() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <a href="/" style={{ color: '#00FF9C', textDecoration: 'none' }}>Back</a>
      <h1 style={{ marginTop: 40 }}>About</h1>
      <p style={{ color: '#888' }}>FlexiReact - Modern React Framework</p>
    </div>
  );
}
`,

    'pages/api/hello.ts': `export async function GET() {
  return Response.json({ message: 'Hello from FlexiReact!' });
}
`,

    'public/styles.css': `* { box-sizing: border-box; margin: 0; padding: 0; }
`,

    'public/favicon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0a0a0a"/><text x="50" y="68" font-family="system-ui" font-size="50" font-weight="900" fill="#00FF9C" text-anchor="middle">F</text></svg>`,

    '.gitignore': `node_modules/
.flexi/
dist/
.env
`,
  };
}
