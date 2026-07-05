/**
 * @velix/cache-redis — Redis cache adapter for Velix
 *
 * @example
 * ```ts
 * import { RedisCacheAdapter } from '@velix/cache-redis';
 * import { defineConfig } from 'velix';
 *
 * export default defineConfig({
 *   cache: {
 *     adapter: new RedisCacheAdapter({
 *       url: process.env.REDIS_URL ?? 'redis://localhost:6379',
 *     }),
 *   },
 * });
 * ```
 */

export { RedisCacheAdapter } from './redis.adapter.js';
export type { RedisCacheAdapterOptions, StoredEntry } from './types.js';
export type { ICacheAdapter, CacheSetOptions } from './redis.adapter.js';
