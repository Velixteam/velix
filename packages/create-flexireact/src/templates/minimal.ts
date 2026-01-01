/**
 * Minimal Template - Bare FlexiReact setup
 */

import type { TemplateFiles } from './index.js';

export function minimalTemplate(projectName: string, options: { styling?: 'tailwind' | 'css' } = {}): TemplateFiles {
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
        lib: ['DOM', 'ES2022'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['node_modules'],
    }, null, 2),

    'flexireact.config.js': `export default { server: { port: 3000 } };
`,

    'pages/index.tsx': `import React from 'react';

export default function Home() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ color: '#00FF9C' }}>FlexiReact</h1>
      <p>Edit pages/index.tsx to start</p>
    </div>
  );
}
`,

    '.gitignore': `node_modules/
.flexi/
`,
  };
}
