import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheManager, revalidatePath, revalidateTag, unstable_cache } from '../actions/revalidation.js';

describe('Cache & Revalidation', () => {
  beforeEach(() => {
    cacheManager.clear();
    vi.useFakeTimers();
  });

  describe('CacheManager', () => {
    it('should store and retrieve data', () => {
      cacheManager.set('/api/data', { foo: 'bar' });
      expect(cacheManager.get('/api/data')).toEqual({ foo: 'bar' });
      expect(cacheManager.has('/api/data')).toBe(true);
    });

    it('should clear all data', () => {
      cacheManager.set('/api/data', { foo: 'bar' });
      cacheManager.clear();
      expect(cacheManager.has('/api/data')).toBe(false);
    });
  });

  describe('revalidatePath', () => {
    it('should remove path from cache', () => {
      cacheManager.set('/blog', { posts: [] });
      revalidatePath('/blog');
      expect(cacheManager.has('/blog')).toBe(false);
    });
  });

  describe('revalidateTag', () => {
    it('should remove all paths with the specified tag', () => {
      cacheManager.set('/post/1', { id: 1 }, ['posts', 'post-1']);
      cacheManager.set('/post/2', { id: 2 }, ['posts', 'post-2']);
      cacheManager.set('/about', { content: 'about' }, ['about']);

      revalidateTag('posts');

      expect(cacheManager.has('/post/1')).toBe(false);
      expect(cacheManager.has('/post/2')).toBe(false);
      expect(cacheManager.has('/about')).toBe(true);
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

    it('should revalidate after specified time', async () => {
      const fetchData = async () => 'data';
      const cachedFetch = unstable_cache(fetchData, ['time-key'], { revalidate: 10 });

      await cachedFetch();
      expect(cacheManager.has('time-key')).toBe(true);

      vi.advanceTimersByTime(10001);

      expect(cacheManager.has('time-key')).toBe(false);
    });
  });
});
