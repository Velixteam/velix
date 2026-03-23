import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // Core package
    'packages/velix/index': 'packages/velix/index.ts',
    'packages/velix/server/index': 'packages/velix/server/index.ts',
    'packages/velix/client/index': 'packages/velix/client/index.ts',
    'packages/velix/config': 'packages/velix/config.ts',
    'packages/velix/runtime/start-dev': 'packages/velix/runtime/start-dev.ts',
    'packages/velix/runtime/start-prod': 'packages/velix/runtime/start-prod.ts',
    'packages/velix/build/index': 'packages/velix/build/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
  platform: 'node',
  splitting: false,
  shims: true,
});
