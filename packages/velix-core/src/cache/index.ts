/**
 * Velix v5 — Advanced Cache (VelixCache)
 *
 * Production-grade caching with:
 * - LRU eviction (configurable maxSize)
 * - TTL-based expiration
 * - Stale-while-revalidate (SWR) window
 * - Tag-based invalidation
 * - Type-safe generics
 */

export type RevalidationType = 'path' | 'tag' | 'layout';

export interface CacheOptions {
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Stale-while-revalidate window in milliseconds (after TTL expires) */
  swr?: number;
  /** Tags for group invalidation */
  tags?: string[];
}

interface CacheEntry<T> {
  key: string;
  value: T;
  tags: Set<string>;
  createdAt: number;
  ttl: number;
  swr: number;
  /** Doubly-linked list pointers for LRU */
  prev: CacheEntry<unknown> | null;
  next: CacheEntry<unknown> | null;
}

interface VelixCacheConfig {
  /** Maximum number of entries (default: 1000) */
  maxSize?: number;
  /** Default TTL in ms (default: 60_000 — 1 minute) */
  defaultTtl?: number;
  /** Default SWR window in ms (default: 10_000 — 10 seconds) */
  defaultSwr?: number;
}

export class VelixCache {
  private readonly maxSize: number;
  private readonly defaultTtl: number;
  private readonly defaultSwr: number;

  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly tagIndex = new Map<string, Set<string>>();

  // LRU doubly-linked list sentinel nodes
  private readonly head: CacheEntry<unknown>;
  private readonly tail: CacheEntry<unknown>;

  constructor(config: VelixCacheConfig = {}) {
    this.maxSize = config.maxSize ?? 1000;
    this.defaultTtl = config.defaultTtl ?? 60_000;
    this.defaultSwr = config.defaultSwr ?? 10_000;

    // Sentinel nodes for the doubly-linked list
    this.head = this.createSentinel('__HEAD__');
    this.tail = this.createSentinel('__TAIL__');
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /** Current number of entries */
  get size(): number {
    return this.store.size;
  }

  /**
   * Store a value with optional TTL, SWR, and tags.
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    // Remove existing entry if present (will be re-added at head)
    if (this.store.has(key)) {
      this.removeEntry(this.store.get(key)!);
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      tags: new Set(options?.tags ?? []),
      createdAt: Date.now(),
      ttl: options?.ttl ?? this.defaultTtl,
      swr: options?.swr ?? this.defaultSwr,
      prev: null,
      next: null,
    };

    // Add to store and move to head (most recently used)
    this.store.set(key, entry as CacheEntry<unknown>);
    this.addToHead(entry as CacheEntry<unknown>);

    // Update tag index
    for (const tag of entry.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }

    // Evict LRU entries if over capacity
    while (this.store.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * Get a cached value. Returns `null` if not found or expired beyond SWR window.
   *
   * @returns `{ value, stale }` — `stale` is true when the entry is past TTL but within SWR window.
   */
  get<T>(key: string): { value: T; stale: boolean } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.createdAt;

    // Past TTL + SWR → fully expired, remove
    if (age > entry.ttl + entry.swr) {
      this.removeEntry(entry);
      return null;
    }

    // Move to head (recently used)
    this.moveToHead(entry);

    const stale = age > entry.ttl;
    return { value: entry.value as T, stale };
  }

  /**
   * Simple get that returns only the value (ignoring staleness).
   * Returns `null` if not found or expired.
   */
  getValue<T>(key: string): T | null {
    const result = this.get<T>(key);
    return result ? result.value : null;
  }

  /** Check whether a key exists and is not expired */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /** Remove a specific key */
  delete(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    this.removeEntry(entry);
    return true;
  }

  /** Invalidate a specific path/key */
  revalidatePath(path: string): void {
    this.delete(path);
  }

  /** Invalidate all entries associated with a tag */
  revalidateTag(tag: string): void {
    const keys = this.tagIndex.get(tag);
    if (!keys) return;

    for (const key of keys) {
      const entry = this.store.get(key);
      if (entry) {
        this.removeEntry(entry);
      }
    }
    this.tagIndex.delete(tag);
  }

  /** Clear all entries */
  invalidateAll(): void {
    this.store.clear();
    this.tagIndex.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /** Get cache stats for debugging/monitoring */
  stats(): { size: number; maxSize: number; tags: number } {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      tags: this.tagIndex.size,
    };
  }

  // ── Internal LRU operations ──

  private createSentinel(key: string): CacheEntry<unknown> {
    return {
      key,
      value: null,
      tags: new Set(),
      createdAt: 0,
      ttl: 0,
      swr: 0,
      prev: null,
      next: null,
    };
  }

  private addToHead(entry: CacheEntry<unknown>): void {
    entry.prev = this.head;
    entry.next = this.head.next;
    this.head.next!.prev = entry;
    this.head.next = entry;
  }

  private removeFromList(entry: CacheEntry<unknown>): void {
    if (entry.prev) entry.prev.next = entry.next;
    if (entry.next) entry.next.prev = entry.prev;
    entry.prev = null;
    entry.next = null;
  }

  private moveToHead(entry: CacheEntry<unknown>): void {
    this.removeFromList(entry);
    this.addToHead(entry);
  }

  private evictLRU(): void {
    const lru = this.tail.prev;
    if (lru && lru !== this.head) {
      this.removeEntry(lru);
    }
  }

  private removeEntry(entry: CacheEntry<unknown>): void {
    // Remove from linked list
    this.removeFromList(entry);
    // Remove from store
    this.store.delete(entry.key);
    // Remove from tag index
    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(entry.key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }
}

// ── Singleton instance for the framework ──

export const cacheManager = new VelixCache();

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
export function revalidatePath(path: string, _type: RevalidationType = 'path'): void {
  cacheManager.revalidatePath(path);

  // Notify connected clients via HMR
  if (typeof global !== 'undefined' && (global as unknown as { __VELIX_HMR_SERVER__?: { broadcast: (msg: string) => void } }).__VELIX_HMR_SERVER__) {
    (global as unknown as { __VELIX_HMR_SERVER__: { broadcast: (msg: string) => void } }).__VELIX_HMR_SERVER__.broadcast(JSON.stringify({
      type: 'revalidate',
      path,
      revalidationType: _type,
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
  if (typeof global !== 'undefined' && (global as unknown as { __VELIX_HMR_SERVER__?: { broadcast: (msg: string) => void } }).__VELIX_HMR_SERVER__) {
    (global as unknown as { __VELIX_HMR_SERVER__: { broadcast: (msg: string) => void } }).__VELIX_HMR_SERVER__.broadcast(JSON.stringify({
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

    const cached = cacheManager.get<T>(cacheKey);
    if (cached && !cached.stale) {
      return cached.value;
    }

    const result = await fn();
    cacheManager.set(cacheKey, result, {
      tags: options?.tags,
      ttl: options?.revalidate ? options.revalidate * 1000 : undefined,
    });

    return result;
  };
}
