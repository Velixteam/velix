# @velix/cache-redis

Redis cache adapter for Velix — implements `ICacheAdapter` via [ioredis](https://github.com/redis/ioredis).

## Installation

```bash
pnpm add @velix/cache-redis ioredis
```

## Usage

```ts
// velix.config.ts
import { defineConfig } from 'velix';
import { RedisCacheAdapter } from '@velix/cache-redis';

export default defineConfig({
  cache: {
    adapter: new RedisCacheAdapter({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    }),
  },
});
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | `'redis://localhost:6379'` | URL de connexion Redis |
| `client` | `Redis` | — | Instance ioredis pré-configurée (prioritaire sur `url`) |
| `keyPrefix` | `string` | `'velix:'` | Préfixe appliqué à toutes les clés |
| `defaultTTL` | `number` | `undefined` | TTL par défaut en millisecondes |

## Features

- **TTL natif Redis** via la commande `PX` (précision milliseconde)
- **Invalidation par tag** avec un Set Redis par tag, suppression **atomique** via script Lua
- **Suppression par préfixe** via `SCAN` non-bloquant (ne jamais utiliser `KEYS` en prod)
- **Clear sélectif** : supprime uniquement les clés `velix:*`, sans impacter les autres apps

## Cache Tag Invalidation

```ts
import { VelixCache } from 'velix';
import { RedisCacheAdapter } from '@velix/cache-redis';

const cache = new VelixCache(new RedisCacheAdapter({ url: process.env.REDIS_URL }));

// Stocker avec des tags
await cache.unstable_cache(fetchProducts, ['products'], {
  tags: ['products', 'featured'],
  revalidate: 300, // 5 minutes
})();

// Invalider tous les produits (ex: après un webhook CMS)
await cache.revalidateTag('products');
```

## Architecture

Ce package est volontairement indépendant de `velix-core` pour permettre son utilisation
dans des contextes non-Velix. Il expose sa propre copie de l'interface `ICacheAdapter`.

```
@velix/cache-redis
├── src/
│   ├── redis.adapter.ts  ← Implémentation principale
│   ├── types.ts          ← Types exportés
│   ├── index.ts          ← Point d'entrée
│   └── lua/
│       ├── delete-by-tag.lua     ← Script Lua atomique (référence)
│       └── delete-by-prefix.lua  ← Script Lua (référence)
```
