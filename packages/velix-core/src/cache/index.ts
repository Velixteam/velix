import type { ICacheAdapter, CacheSetOptions } from './adapter.js';
import { MemoryCacheAdapter } from './adapters/memory.adapter.js';
import { RequestDeduplicator } from './deduplicator.js';

export type RevalidationType = 'path' | 'tag' | 'layout';

export class VelixCache {
  private adapter: ICacheAdapter;
  private deduplicator: RequestDeduplicator;

  constructor(adapter: ICacheAdapter = new MemoryCacheAdapter()) {
    this.adapter = adapter;
    this.deduplicator = new RequestDeduplicator();
  }

  async revalidatePath(path: string): Promise<void> {
    await this.adapter.deleteByPrefix(`route:${path}`);
  }

  async revalidateTag(tag: string): Promise<void> {
    await this.adapter.deleteByTag(tag);
  }

  // unstable_cache — avec déduplication
  unstable_cache<T>(
    fn: () => Promise<T>,
    keys: string[],
    options?: { tags?: string[]; revalidate?: number }
  ): () => Promise<T> {
    const key = keys.join(':');
    return async () => {
      const cached = await this.adapter.get<T>(key);
      if (cached !== null) return cached;

      const value = await this.deduplicator.dedupe(key, fn);
      await this.adapter.set(key, value, {
        ttl: options?.revalidate ? options.revalidate * 1000 : undefined,
        tags: options?.tags,
      });
      return value;
    };
  }
}

// ── Singleton instance for the framework ──

export const cacheManager = new VelixCache();

/**
 * Revalidate a specific path
 */
export async function revalidatePath(path: string, _type: RevalidationType = 'path'): Promise<void> {
  await cacheManager.revalidatePath(path);

  // Notify connected clients via HMR
  if (typeof global !== 'undefined' && (global as any).__VELIX_HMR_SERVER__) {
    (global as any).__VELIX_HMR_SERVER__.broadcast(JSON.stringify({
      type: 'revalidate',
      path,
      revalidationType: _type,
    }));
  }
}

/**
 * Revalidate all paths with a specific cache tag
 */
export async function revalidateTag(tag: string): Promise<void> {
  await cacheManager.revalidateTag(tag);

  // Notify connected clients
  if (typeof global !== 'undefined' && (global as any).__VELIX_HMR_SERVER__) {
    (global as any).__VELIX_HMR_SERVER__.broadcast(JSON.stringify({
      type: 'revalidate',
      tag,
    }));
  }
}

/**
 * Unstable cache wrapper (experimental)
 */
export function unstable_cache<T>(
  fn: () => Promise<T>,
  keys: string[],
  options?: { tags?: string[]; revalidate?: number }
): () => Promise<T> {
  return cacheManager.unstable_cache(fn, keys, options);
}
