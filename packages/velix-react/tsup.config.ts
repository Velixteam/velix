import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/client.ts',
      'src/server.ts',
      'src/islands.ts',
      'src/actions.ts'
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
    external: ['react', 'react-dom', '@teamvelix/velix-core'],
  },
  {
    entry: {
      'hmr-client': 'src/hmr/hmr-client.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    target: 'es2022',
    platform: 'browser',
    bundle: true,
    minify: process.env.NODE_ENV === 'production',
  }
]);
