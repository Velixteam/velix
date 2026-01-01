import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.flexi'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', 'templates']
    }
  }
});
