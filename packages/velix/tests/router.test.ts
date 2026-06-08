import { describe, it, expect } from 'vitest';
import { matchRoute } from '../router/index.js';
import type { Route } from '../types.js';

describe('Router', () => {
  describe('matchRoute', () => {
    it('should match a static route exactly', () => {
      const routes: Route[] = [
        { type: 'page', path: '/', filePath: '', pattern: /^\/$/, segments: [] },
        { type: 'page', path: '/about', filePath: '', pattern: /^\/about$/, segments: ['about'] },
      ];

      const match = matchRoute('/about', routes);
      expect(match).not.toBeNull();
      expect(match?.path).toBe('/about');
      expect(match?.params).toEqual({});
    });

    it('should extract dynamic parameters', () => {
      const routes: Route[] = [
        { 
          type: 'page', 
          path: '/blog/:slug', 
          filePath: '', 
          pattern: /^\/blog\/([^/]+)$/, 
          segments: ['blog', ':slug'] 
        },
      ];

      const match = matchRoute('/blog/my-post', routes);
      expect(match).not.toBeNull();
      expect(match?.params).toEqual({ slug: 'my-post' });
    });

    it('should ignore query strings when matching', () => {
      const routes: Route[] = [
        { type: 'page', path: '/products', filePath: '', pattern: /^\/products$/, segments: ['products'] },
      ];

      const match = matchRoute('/products?sort=asc', routes);
      expect(match).not.toBeNull();
      expect(match?.path).toBe('/products');
    });

    it('should return null if no route matches', () => {
      const routes: Route[] = [
        { type: 'page', path: '/', filePath: '', pattern: /^\/$/, segments: [] },
      ];

      const match = matchRoute('/unknown', routes);
      expect(match).toBeNull();
    });
  });
});
