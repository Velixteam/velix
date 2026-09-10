import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm'],
  dts: false,
  sourcemap: true,
  clean: true,
  target: 'node18',
  platform: 'node',
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  external: [
    '@teamvelix/velix-pack',
    '@teamvelix/velix-core',
    '@teamvelix/velix',
    'esbuild',
    'chokidar',
    'picocolors',
    'prompts',
    'ora',
    'fsevents',
  ],
});
