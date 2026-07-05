import { describe, it, expect, vi } from 'vitest';
import { RequestDeduplicator } from './deduplicator.js';

describe('RequestDeduplicator', () => {
  it('deduplicates multiple simultaneous calls to the same key', async () => {
    const deduplicator = new RequestDeduplicator();
    const mockFn = vi.fn().mockImplementation(async () => {
      return new Promise(resolve => setTimeout(() => resolve('data'), 50));
    });

    // 10 appels simultanés
    const promises = Array.from({ length: 10 }).map(() => deduplicator.dedupe('test-key', mockFn));
    const results = await Promise.all(promises);

    expect(results).toEqual(Array(10).fill('data'));
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('calls fn again after first resolution', async () => {
    const deduplicator = new RequestDeduplicator();
    const mockFn = vi.fn().mockResolvedValue('data');

    await deduplicator.dedupe('key2', mockFn);
    await deduplicator.dedupe('key2', mockFn);

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('propagates errors to all callers', async () => {
    const deduplicator = new RequestDeduplicator();
    const error = new Error('failed');
    const mockFn = vi.fn().mockImplementation(async () => {
      return new Promise((_, reject) => setTimeout(() => reject(error), 50));
    });

    const promises = Array.from({ length: 3 }).map(() => deduplicator.dedupe('fail-key', mockFn));
    
    await expect(Promise.all(promises)).rejects.toThrow('failed');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
