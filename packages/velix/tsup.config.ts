import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'index.ts',
    'server/index.ts',
    'client/index.ts',
    'config.ts',
    'runtime/start-dev.ts',
    'runtime/start-prod.ts',
    'build/index.ts',
    'islands/index.ts',
  ],
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
  external: ['sharp', 'react', 'react-dom'],
});
