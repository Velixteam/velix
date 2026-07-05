import type Redis from 'ioredis';

/**
 * Options de configuration pour RedisCacheAdapter
 */
export type RedisCacheAdapterOptions = {
  /** URL de connexion Redis. Ex: 'redis://localhost:6379' */
  url?: string;
  /** Instance ioredis pré-configurée (prioritaire sur `url`) */
  client?: Redis;
  /** Préfixe pour toutes les clés Velix dans Redis. Défaut: 'velix:' */
  keyPrefix?: string;
  /** TTL par défaut en millisecondes. Défaut: undefined (pas d'expiration) */
  defaultTTL?: number;
};

/**
 * Structure interne stockée dans Redis (sérialisée en JSON)
 */
export type StoredEntry<T> = {
  value: T;
  tags: string[];
};
