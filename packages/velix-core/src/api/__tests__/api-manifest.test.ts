import { describe, it, expect } from 'vitest';
import { filePathToRoute, handleApiRequest, type ApiRoute } from '../manifest.js';

describe('API Manifest – filePathToRoute pattern generation', () => {
  const serverDir = '/server';

  it('converts users.ts → /api/users, no params, not catchAll', () => {
    const route = filePathToRoute('/server/api/users.ts', serverDir);
    expect(route.pattern).toBe('/api/users');
    expect(route.params).toEqual([]);
    expect(route.isCatchAll).toBe(false);
  });

  it('converts users.[id].ts → /api/users/:id, params: [id]', () => {
    const route = filePathToRoute('/server/api/users.[id].ts', serverDir);
    expect(route.pattern).toBe('/api/users/:id');
    expect(route.params).toEqual(['id']);
    expect(route.isCatchAll).toBe(false);
  });

  it('converts auth/[...slug].ts → /api/auth/*, isCatchAll: true', () => {
    const route = filePathToRoute('/server/api/auth/[...slug].ts', serverDir);
    expect(route.pattern).toBe('/api/auth/*');
    expect(route.params).toEqual(['slug']);
    expect(route.isCatchAll).toBe(true);
  });

  it('converts posts.[id].comments.ts → /api/posts/:id/comments', () => {
    const route = filePathToRoute('/server/api/posts.[id].comments.ts', serverDir);
    expect(route.pattern).toBe('/api/posts/:id/comments');
    expect(route.params).toEqual(['id']);
    expect(route.isCatchAll).toBe(false);
  });
});

describe('API Manifest – handleApiRequest', () => {
  it('returns null if no route matches', async () => {
    const req = new Request('http://localhost/api/unknown');
    const manifest: ApiRoute[] = [
      { pattern: '/api/users', filePath: '', params: [], isCatchAll: false },
    ];
    const res = await handleApiRequest(req, manifest);
    expect(res).toBeNull();
  });

  it('returns null when manifest is empty', async () => {
    const req = new Request('http://localhost/api/users', { method: 'POST' });
    const res = await handleApiRequest(req, []);
    expect(res).toBeNull();
  });
});
