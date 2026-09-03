import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheManager } from '../src/cache/index.js';

describe('Velix Pack Cache Manager', () => {
  const projectRoot = process.cwd();
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager(projectRoot);
  });

  afterEach(() => {
    cache.clear();
  });

  it('should handle cache set, hit, miss, and invalidation', () => {
    const id = 'app/test.tsx';
    const hash = 'hash123';

    expect(cache.get(id, hash)).toBeNull();

    cache.set(id, {
      hash,
      code: 'console.log("hello");',
      imports: [],
      type: 'client',
      timestamp: Date.now(),
    });

    const hit = cache.get(id, hash);
    expect(hit).not.toBeNull();
    expect(hit?.code).toBe('console.log("hello");');

    // Miss on hash mismatch
    expect(cache.get(id, 'different-hash')).toBeNull();

    // Invalidation
    cache.invalidate(id);
    expect(cache.get(id, hash)).toBeNull();
  });
});
