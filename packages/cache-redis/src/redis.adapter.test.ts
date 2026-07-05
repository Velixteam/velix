import { describe, it, expect, beforeEach, vi } from 'vitest';
// @ts-ignore — ioredis-mock n'a pas de types parfaits mais est compatible
import RedisMock from 'ioredis-mock';
import { RedisCacheAdapter } from './redis.adapter.js';

// ioredis-mock simule Redis en mémoire — pas de connexion réseau nécessaire
function createAdapter(prefix = 'velix:') {
  const client = new RedisMock();
  return new RedisCacheAdapter({ client, keyPrefix: prefix });
}

describe('RedisCacheAdapter', () => {
  let adapter: RedisCacheAdapter;

  beforeEach(() => {
    adapter = createAdapter();
  });

  // ── get ──────────────────────────────────────────────────────────────────

  it('get retourne null si la clé est absente', async () => {
    const result = await adapter.get('missing');
    expect(result).toBeNull();
  });

  it('get retourne la valeur si la clé est présente', async () => {
    await adapter.set('user:1', { name: 'Alice', age: 30 });
    const result = await adapter.get<{ name: string; age: number }>('user:1');
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  // ── set & TTL ────────────────────────────────────────────────────────────

  it('set stocke la valeur avec TTL — expire après la durée', async () => {
    vi.useFakeTimers();
    const mockClient = new RedisMock();
    const ttlAdapter = new RedisCacheAdapter({ client: mockClient, keyPrefix: 'test:' });

    await ttlAdapter.set('expiring-key', 'temp-value', { ttl: 1000 });

    // Valeur présente immédiatement
    let val = await ttlAdapter.get('expiring-key');
    expect(val).toBe('temp-value');

    // Après expiration : ioredis-mock respecte PX
    await mockClient.pexpire('test:expiring-key', -1); // force expire
    val = await ttlAdapter.get('expiring-key');
    expect(val).toBeNull();

    vi.useRealTimers();
  });

  it('set avec tags indexe correctement la clé dans le tag Set', async () => {
    const mockClient = new RedisMock();
    const tagAdapter = new RedisCacheAdapter({ client: mockClient, keyPrefix: 'velix:' });

    await tagAdapter.set('product:42', { title: 'Laptop' }, { tags: ['products', 'featured'] });

    const membersProducts = await mockClient.smembers('velix:tag:products');
    const membersFeatured = await mockClient.smembers('velix:tag:featured');

    expect(membersProducts).toContain('velix:product:42');
    expect(membersFeatured).toContain('velix:product:42');
  });

  // ── deleteByTag ──────────────────────────────────────────────────────────

  it('deleteByTag supprime toutes les clés associées au tag atomiquement', async () => {
    await adapter.set('page:home', 'home', { tags: ['pages'] });
    await adapter.set('page:about', 'about', { tags: ['pages'] });
    await adapter.set('config:theme', 'dark', { tags: ['config'] });

    await adapter.deleteByTag('pages');

    expect(await adapter.get('page:home')).toBeNull();
    expect(await adapter.get('page:about')).toBeNull();
    // La clé hors du tag 'pages' doit rester intacte
    expect(await adapter.get('config:theme')).toBe('dark');
  });

  // ── deleteByPrefix ───────────────────────────────────────────────────────

  it('deleteByPrefix supprime les bonnes clés via SCAN sans toucher aux autres', async () => {
    await adapter.set('route:/home', 'home');
    await adapter.set('route:/about', 'about');
    await adapter.set('route:/blog', 'blog');
    await adapter.set('api:products', ['p1', 'p2']);

    await adapter.deleteByPrefix('route:');

    expect(await adapter.get('route:/home')).toBeNull();
    expect(await adapter.get('route:/about')).toBeNull();
    expect(await adapter.get('route:/blog')).toBeNull();
    // Les clés hors préfixe doivent rester
    expect(await adapter.get('api:products')).toEqual(['p1', 'p2']);
  });

  // ── clear ────────────────────────────────────────────────────────────────

  it('clear supprime toutes les clés préfixées velix:', async () => {
    const mockClient = new RedisMock();
    const a1 = new RedisCacheAdapter({ client: mockClient, keyPrefix: 'velix:' });
    const a2 = new RedisCacheAdapter({ client: mockClient, keyPrefix: 'other:' });

    await a1.set('key1', 'v1');
    await a1.set('key2', 'v2');
    await a2.set('key3', 'v3'); // Préfixe différent — ne doit pas être supprimé

    await a1.clear();

    expect(await a1.get('key1')).toBeNull();
    expect(await a1.get('key2')).toBeNull();
    expect(await a2.get('key3')).toBe('v3');
  });

  // ── has ──────────────────────────────────────────────────────────────────

  it('has retourne true si la clé existe', async () => {
    await adapter.set('exists', 42);
    expect(await adapter.has('exists')).toBe(true);
  });

  it('has retourne false si la clé n\'existe pas', async () => {
    expect(await adapter.has('ghost')).toBe(false);
  });
});
