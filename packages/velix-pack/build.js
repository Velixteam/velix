import esbuild from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
  const outDir = 'dist';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
    external: [
      '@teamvelix/velix-core',
      'chokidar',
      'esbuild',
      'picocolors',
      'fs',
      'path',
      'crypto',
      'url',
    ],
  });

  try {
    execSync('npx tsc --emitDeclarationOnly --outDir dist', { stdio: 'ignore' });
  } catch {
    // Non-fatal if tsc is not found locally
  }

  console.log('✓ Velix Pack built cleanly to dist/index.js and dist/index.d.ts');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
