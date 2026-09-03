import { describe, it, expect } from 'vitest';
import path from 'path';
import { Resolver } from '../src/resolver/index.js';

describe('Velix Pack Resolver', () => {
  const projectRoot = process.cwd();
  const resolver = new Resolver({ projectRoot });

  it('should resolve relative imports with extensions', () => {
    const importer = path.join(projectRoot, 'packages/velix-pack/src/index.ts');
    const resolved = resolver.resolve('./types.js', importer);
    expect(resolved).not.toBeNull();
    expect(resolved?.replace(/\\/g, '/')).toContain('packages/velix-pack/src/types.ts');
  });

  it('should return null for external package imports', () => {
    const importer = path.join(projectRoot, 'packages/velix-pack/src/index.ts');
    const resolved = resolver.resolve('esbuild', importer);
    expect(resolved).toBeNull();
  });
});
