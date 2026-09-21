import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheManager, revalidatePath, revalidateTag, unstable_cache } from '../actions/revalidation.js';

describe('Cache & Revalidation', () => {
  beforeEach(async () => {
    await cacheManager.clear();
    vi.useFakeTimers();
  });

  describe('CacheManager', () => {
    it('should store and retrieve data', async () => {
      await cacheManager.set('/api/data', { foo: 'bar' });
      expect(await cacheManager.get('/api/data')).toEqual({ foo: 'bar' });
      expect(await cacheManager.has('/api/data')).toBe(true);
    });

    it('should clear all data', async () => {
      await cacheManager.set('/api/data', { foo: 'bar' });
      await cacheManager.clear();
      expect(await cacheManager.has('/api/data')).toBe(false);
    });
  });

  describe('revalidatePath', () => {
    it('should remove path from cache', async () => {
      await cacheManager.set('route:/blog', { posts: [] });
      await revalidatePath('/blog');
      expect(await cacheManager.has('route:/blog')).toBe(false);
    });
  });

  describe('revalidateTag', () => {
    it('should remove all paths with the specified tag', async () => {
      await cacheManager.set('/post/1', { id: 1 }, { tags: ['posts', 'post-1'] });
      await cacheManager.set('/post/2', { id: 2 }, { tags: ['posts', 'post-2'] });
      await cacheManager.set('/about', { content: 'about' }, { tags: ['about'] });

      await revalidateTag('posts');

      expect(await cacheManager.has('/post/1')).toBe(false);
      expect(await cacheManager.has('/post/2')).toBe(false);
      expect(await cacheManager.has('/about')).toBe(true);
    });
  });

  describe('unstable_cache', () => {
    it('should cache function results', async () => {
      let callCount = 0;
      const fetchData = async () => {
        callCount++;
        return 'data';
      };

      const cachedFetch = unstable_cache(fetchData, ['test-key']);

      await cachedFetch();
      await cachedFetch();

      expect(callCount).toBe(1);
    });

    it('should store cached entries', async () => {
      const fetchData = async () => 'data';
      const cachedFetch = unstable_cache(fetchData, ['time-key'], { revalidate: 10 });

      await cachedFetch();
      expect(await cacheManager.has('time-key')).toBe(true);
    });
  });
});
