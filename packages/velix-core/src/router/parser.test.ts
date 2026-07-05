import { describe, it, expect, vi } from 'vitest';
import { createRoutePattern, extractParams } from './parser.js';

describe('Router Parser', () => {
  it('creates pattern for simple route', () => {
    const pattern = createRoutePattern('/about');
    expect(pattern.test('/about')).toBe(true);
    expect(pattern.test('/about/me')).toBe(false);
  });

  it('creates pattern for dynamic segment', () => {
    const pattern = createRoutePattern('/users/:id');
    expect(pattern.test('/users/123')).toBe(true);
    expect(pattern.test('/users/')).toBe(false);
  });

  it('creates pattern for catch-all segment', () => {
    const pattern = createRoutePattern('/docs/*');
    expect(pattern.test('/docs/hello/world')).toBe(true);
    expect(pattern.test('/docs')).toBe(false);
  });

  it('extracts dynamic parameters', () => {
    const pattern = createRoutePattern('/dashboard/:id');
    const match = '/dashboard/456'.match(pattern);
    const params = extractParams('/dashboard/:id', match!);
    expect(params).toEqual({ id: '456' });
  });

  it('extracts catch-all parameters', () => {
    const pattern = createRoutePattern('/blog/*slug');
    const match = '/blog/2023/10/my-post'.match(pattern);
    const params = extractParams('/blog/*slug', match!);
    expect(params).toEqual({ slug: '2023/10/my-post' });
  });
});
