import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryCacheAdapter } from './memory.adapter.js';

describe('MemoryCacheAdapter', () => {
  let adapter: MemoryCacheAdapter;

  beforeEach(() => {
    adapter = new MemoryCacheAdapter({ maxSize: 10 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null if key is absent', async () => {
    const value = await adapter.get('unknown');
    expect(value).toBeNull();
  });

  it('returns null if TTL expired', async () => {
    await adapter.set('key1', 'value1', { ttl: 1000 });
    let value = await adapter.get('key1');
    expect(value).toBe('value1');

    vi.advanceTimersByTime(1500);

    value = await adapter.get('key1');
    expect(value).toBeNull();
  });

  it('deleteByTag removes all tagged keys', async () => {
    await adapter.set('k1', 'v1', { tags: ['groupA'] });
    await adapter.set('k2', 'v2', { tags: ['groupA', 'groupB'] });
    await adapter.set('k3', 'v3', { tags: ['groupB'] });

    await adapter.deleteByTag('groupA');

    expect(await adapter.has('k1')).toBe(false);
    expect(await adapter.has('k2')).toBe(false);
    expect(await adapter.has('k3')).toBe(true);
  });

  it('deleteByPrefix removes correct keys', async () => {
    await adapter.set('route:/home', 'v1');
    await adapter.set('route:/about', 'v2');
    await adapter.set('other:/home', 'v3');

    await adapter.deleteByPrefix('route:');

    expect(await adapter.has('route:/home')).toBe(false);
    expect(await adapter.has('route:/about')).toBe(false);
    expect(await adapter.has('other:/home')).toBe(true);
  });
});
