# Velix Pack Configuration

Velix Pack works with zero-config by default. Options can be customized in `velix.config.ts`:

```typescript
import { defineConfig } from '@teamvelix/velix';

export default defineConfig({
  build: {
    target: 'es2022',
    minify: true,
    sourcemap: true,
    outDir: '.velix',
  },
});
```

## CLI Flags

- `--pack`: Enable Velix Pack engine for `dev` or `build`.
- `--analyze`: Print bundle breakdown and cache hit ratio.
- `--debug`: Display detailed module graph output.
- `--profile`: Output build timing breakdown.
