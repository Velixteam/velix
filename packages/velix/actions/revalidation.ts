/**
 * Velix v5 Revalidation & Cache Management
 * Inspired by Next.js revalidatePath and revalidateTag
 */

export type RevalidationType = 'path' | 'tag' | 'layout';

interface CacheEntry {
  path: string;
  tags: Set<string>;
  timestamp: number;
  data: any;
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private tagIndex = new Map<string, Set<string>>();

  set(path: string, data: any, tags: string[] = []): void {
    const entry: CacheEntry = {
      path,
      tags: new Set(tags),
      timestamp: Date.now(),
      data,
    };

    this.cache.set(path, entry);

    // Index by tags
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(path);
    });
  }

  get(path: string): any | null {
    const entry = this.cache.get(path);
    return entry ? entry.data : null;
  }

  revalidatePath(path: string): void {
    this.cache.delete(path);
  }

  revalidateTag(tag: string): void {
    const paths = this.tagIndex.get(tag);
    if (paths) {
      paths.forEach(path => this.cache.delete(path));
      this.tagIndex.delete(tag);
    }
  }

  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }

  has(path: string): boolean {
    return this.cache.has(path);
  }
}

export const cacheManager = new CacheManager();

/**
 * Revalidate a specific path
 * @example
 * ```ts
 * import { revalidatePath } from 'velix/actions';
 * 
 * await revalidatePath('/blog');
 * await revalidatePath('/blog/[slug]', 'layout');
 * ```
 */
export function revalidatePath(path: string, type: RevalidationType = 'path'): void {
  cacheManager.revalidatePath(path);
  
  // Notify connected clients via HMR
  if (typeof global !== 'undefined' && (global as any).__VELIX_HMR_SERVER__) {
    (global as any).__VELIX_HMR_SERVER__.broadcast(JSON.stringify({
      type: 'revalidate',
      path,
      revalidationType: type,
    }));
  }
}

/**
 * Revalidate all paths with a specific cache tag
 * @example
 * ```ts
 * import { revalidateTag } from 'velix/actions';
 * 
 * await revalidateTag('blog-posts');
 * ```
 */
export function revalidateTag(tag: string): void {
  cacheManager.revalidateTag(tag);

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
  return async () => {
    const cacheKey = keys.join(':');
    
    if (cacheManager.has(cacheKey)) {
      return cacheManager.get(cacheKey);
    }

    const result = await fn();
    cacheManager.set(cacheKey, result, options?.tags || []);

    if (options?.revalidate) {
      setTimeout(() => {
        cacheManager.revalidatePath(cacheKey);
      }, options.revalidate * 1000);
    }

    return result;
  };
}
