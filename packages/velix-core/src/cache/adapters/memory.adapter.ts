import { LRUCache } from 'lru-cache';
import type { ICacheAdapter, CacheSetOptions } from '../adapter.js';

type CacheEntry<T> = {
  value: T;
  tags: string[];
  expiresAt: number | null;
}

export class MemoryCacheAdapter implements ICacheAdapter {
  private lru: LRUCache<string, CacheEntry<unknown>>;
  private tagIndex: Map<string, Set<string>> = new Map();

  constructor(options: { maxSize?: number } = {}) {
    this.lru = new LRUCache({ max: options.maxSize ?? 500 });
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.lru.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.lru.delete(key);
      return null;
    }
    return entry.value;
  }

  async set<T>(key: string, value: T, options: CacheSetOptions = {}): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      tags: options.tags ?? [],
      expiresAt: options.ttl ? Date.now() + options.ttl : null,
    };
    this.lru.set(key, entry as CacheEntry<unknown>);
    // Index par tag pour invalidation rapide
    options.tags?.forEach(tag => {
      if (!this.tagIndex.has(tag)) this.tagIndex.set(tag, new Set());
      this.tagIndex.get(tag)!.add(key);
    });
  }

  async delete(key: string): Promise<void> {
    this.lru.delete(key);
  }

  async deleteByTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag);
    if (!keys) return;
    keys.forEach(key => this.lru.delete(key));
    this.tagIndex.delete(tag);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of this.lru.keys()) {
      if (key.startsWith(prefix)) this.lru.delete(key);
    }
  }

  async clear(): Promise<void> {
    this.lru.clear();
    this.tagIndex.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.lru.has(key);
  }
}
