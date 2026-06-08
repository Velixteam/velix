import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'node18',
    platform: 'node',
    splitting: true,
    treeshake: true,
    minify: process.env.NODE_ENV === 'production',
    shims: true,
  }
]);
