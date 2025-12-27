
/**
 * Minimal Template - Bare minimum FlexiReact setup
 */

import type { TemplateFiles } from './index.js';

export function minimalTemplate(projectName: string, options: { styling?: 'tailwind' | 'css' } = {}): TemplateFiles {
  const isTailwind = options.styling === 'tailwind';

  return {
    'package.json': JSON.stringify({
      name: projectName,
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: {
        dev: isTailwind ? 'npm run css && flexireact dev' : 'flexireact dev',
        build: isTailwind ? 'npm run css && flexireact build' : 'flexireact build',
        start: 'flexireact start',
        ...(isTailwind ? { css: 'tailwindcss -i ./styles.css -o ./public/styles.css --minify' } : {}),
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        '@flexireact/core': '^4.0.0',
        ...(isTailwind ? { 'clsx': '^2.1.0', 'tailwind-merge': '^2.2.0' } : {}),
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
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules', '.flexi'],
    }, null, 2),

    ...(isTailwind ? {
      'postcss.config.js': `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`,
      'styles.css': `@import "tailwindcss";`,
    } : {}),

    'flexireact.config.js': `export default {
  server: { port: 3000 }${isTailwind ? ',\n  styles: ["/styles.css"]' : ''}
};
`,

    'routes/(public)/home.tsx': isTailwind ? `import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center font-sans">
      <h1 className="text-4xl font-bold mb-4">
        Welcome to FlexiReact
      </h1>
      <p className="text-gray-500">
        Edit <code className="bg-gray-100 px-1 py-0.5 rounded">routes/(public)/home.tsx</code> to get started.
      </p>
    </div>
  );
}
` : `import React from 'react';

export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        Welcome to FlexiReact
      </h1>
      <p style={{ color: '#666' }}>
        Edit <code>routes/(public)/home.tsx</code> to get started.
      </p>
    </div>
  );
}
`,

    'public/.gitkeep': '',

    '.gitignore': `node_modules/
.flexi/
dist/
public/styles.css
*.log
`,
  };
}
