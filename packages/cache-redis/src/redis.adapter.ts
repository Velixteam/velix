import Redis from 'ioredis';
import type { RedisCacheAdapterOptions, StoredEntry } from './types.js';

// ============================================================================
// ICacheAdapter — inline pour éviter la dépendance circulaire et permettre
// à @velix/cache-redis d'être utilisable sans velix-core installé
// ============================================================================

export interface ICacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByTag(tag: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

export type CacheSetOptions = {
  /** TTL en millisecondes */
  ttl?: number;
  /** Tags pour l'invalidation groupée */
  tags?: string[];
};

// ============================================================================
// Script Lua inline pour deleteByTag — atomicité garantie
// ============================================================================

const DELETE_BY_TAG_LUA = `
local keys = redis.call('SMEMBERS', KEYS[1])
if #keys > 0 then
  redis.call('DEL', unpack(keys))
end
redis.call('DEL', KEYS[1])
return #keys
`;

// ============================================================================
// RedisCacheAdapter
// ============================================================================

/**
 * Adaptateur de cache Redis pour Velix.
 * Implémente ICacheAdapter via ioredis.
 *
 * @example
 * ```ts
 * import { RedisCacheAdapter } from '@velix/cache-redis';
 * import { defineConfig } from 'velix';
 *
 * export default defineConfig({
 *   cache: {
 *     adapter: new RedisCacheAdapter({ url: process.env.REDIS_URL }),
 *   }
 * });
 * ```
 */
export class RedisCacheAdapter implements ICacheAdapter {
  private redis: Redis;
  private prefix: string;
  private defaultTTL?: number;

  constructor(options: RedisCacheAdapterOptions = {}) {
    this.redis = options.client ?? new Redis(options.url ?? 'redis://localhost:6379');
    this.prefix = options.keyPrefix ?? 'velix:';
    this.defaultTTL = options.defaultTTL;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private key(k: string): string {
    return `${this.prefix}${k}`;
  }

  private tagKey(tag: string): string {
    return `${this.prefix}tag:${tag}`;
  }

  // ── ICacheAdapter ─────────────────────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(this.key(key));
    if (!raw) return null;
    try {
      const entry = JSON.parse(raw) as StoredEntry<T>;
      return entry.value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheSetOptions = {}): Promise<void> {
    const entry: StoredEntry<T> = {
      value,
      tags: options.tags ?? [],
    };
    const serialized = JSON.stringify(entry);
    const k = this.key(key);
    const ttlMs = options.ttl ?? this.defaultTTL;

    if (ttlMs) {
      await this.redis.set(k, serialized, 'PX', ttlMs);
    } else {
      await this.redis.set(k, serialized);
    }

    // Indexer la clé dans chaque tag (Redis Set pour invalidation rapide)
    if (options.tags?.length) {
      await Promise.all(
        options.tags.map(tag => this.redis.sadd(this.tagKey(tag), k))
      );
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.key(key));
  }

  async deleteByTag(tag: string): Promise<void> {
    // Script Lua atomique — évite les race conditions entre SMEMBERS et DEL
    await this.redis.eval(DELETE_BY_TAG_LUA, 1, this.tagKey(tag));
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    // SCAN non-bloquant — ne jamais utiliser KEYS en production
    const fullPrefix = this.key(prefix);
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor, 'MATCH', `${fullPrefix}*`, 'COUNT', 100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }

  async clear(): Promise<void> {
    // SCAN + DELETE toutes les clés avec le préfixe Velix (non-bloquant)
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor, 'MATCH', `${this.prefix}*`, 'COUNT', 100
      );
      cursor = nextCursor;
      if (keys.length > 0) await this.redis.del(...keys);
    } while (cursor !== '0');
  }

  async has(key: string): Promise<boolean> {
    return (await this.redis.exists(this.key(key))) === 1;
  }

  /**
   * Ferme proprement les connexions Redis.
   * À appeler au shutdown de l'application.
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }

  /**
   * Expose l'instance Redis sous-jacente pour les cas avancés.
   */
  getClient(): Redis {
    return this.redis;
  }
}
