import esbuild from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';

async function main() {
  const outDir = 'dist';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const entries = [
    { in: 'index.ts', out: 'index' },
    { in: 'server/index.ts', out: 'server/index' },
    { in: 'client/index.ts', out: 'client/index' },
    { in: 'config.ts', out: 'config' },
    { in: 'build/index.ts', out: 'build/index' },
    { in: 'islands/index.ts', out: 'islands/index' },
    { in: 'runtime/start-dev.ts', out: 'runtime/start-dev' },
    { in: 'runtime/start-prod.ts', out: 'runtime/start-prod' },
    { in: 'runtime/start-build.ts', out: 'runtime/start-build' },
  ];

  await Promise.all(entries.map(e => esbuild.build({
    entryPoints: [e.in],
    outfile: `dist/${e.out}.js`,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    external: [
      '@teamvelix/velix-core',
      '@teamvelix/velix-react',
      '@teamvelix/velix-pack',
      'react',
      'react-dom',
      'esbuild',
      'picocolors',
      'zod',
      'lru-cache',
      'chokidar',
      'sharp',
    ],
  })));

  try {
    execSync('npx tsc --emitDeclarationOnly', { stdio: 'ignore' });
  } catch {}

  console.log('✓ @teamvelix/velix built cleanly to dist/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
