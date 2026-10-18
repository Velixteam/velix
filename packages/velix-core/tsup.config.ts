import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';

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
    // treeshake is memory-intensive; only enable for production bundles
    treeshake: isProd,
    minify: isProd,
    shims: true,
  }
]);
