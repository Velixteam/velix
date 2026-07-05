import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VelixCache } from './index.js';
import type { ICacheAdapter } from './adapter.js';

describe('VelixCache', () => {
  let cache: VelixCache;

  beforeEach(() => {
    cache = new VelixCache();
  });

  it('revalidatePath invalidates correct keys', async () => {
    const mockAdapter = {
      deleteByPrefix: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      deleteByTag: vi.fn(),
      clear: vi.fn(),
      has: vi.fn(),
    } as unknown as ICacheAdapter;
    
    const customCache = new VelixCache(mockAdapter);
    await customCache.revalidatePath('/about');

    expect(mockAdapter.deleteByPrefix).toHaveBeenCalledWith('route:/about');
  });

  it('revalidateTag invalidates by tag', async () => {
    const mockAdapter = {
      deleteByPrefix: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      deleteByTag: vi.fn(),
      clear: vi.fn(),
      has: vi.fn(),
    } as unknown as ICacheAdapter;

    const customCache = new VelixCache(mockAdapter);
    await customCache.revalidateTag('my-tag');

    expect(mockAdapter.deleteByTag).toHaveBeenCalledWith('my-tag');
  });

  it('unstable_cache returns cached value on 2nd call', async () => {
    const mockFn = vi.fn().mockResolvedValue('computed');
    const cachedFn = cache.unstable_cache(mockFn, ['compute', '1']);

    const res1 = await cachedFn();
    expect(res1).toBe('computed');
    expect(mockFn).toHaveBeenCalledTimes(1);

    const res2 = await cachedFn();
    expect(res2).toBe('computed');
    expect(mockFn).toHaveBeenCalledTimes(1); // Not called again
  });
});
