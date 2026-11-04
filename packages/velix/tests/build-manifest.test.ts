import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { collectClientAssetPaths } from '../build/index.js';

describe('collectClientAssetPaths', () => {
  it('registers emitted JavaScript and CSS outputs using manifest paths', () => {
    const projectRoot = path.resolve('/tmp/velix-manifest-fixture');
    const clientOutDir = path.join(projectRoot, 'dist', 'client');

    const result = collectClientAssetPaths([
      path.join(clientOutDir, 'page-ABC123.js'),
      path.join(clientOutDir, 'chunks', 'shared-DEF456.js'),
      path.join(clientOutDir, 'page-ABC123.css'),
      path.join(clientOutDir, 'assets', 'logo.svg'),
      path.join(projectRoot, 'dist', 'server', 'page.js'),
    ], projectRoot, clientOutDir);

    expect(result.chunks).toEqual([
      'client/chunks/shared-DEF456.js',
      'client/page-ABC123.js',
    ]);
    expect(result.css).toEqual(['/client/page-ABC123.css']);
  });

  it('deduplicates outputs and ignores paths outside the client directory', () => {
    const projectRoot = path.resolve('/tmp/velix-manifest-fixture');
    const clientOutDir = path.join(projectRoot, 'dist', 'client');
    const page = path.join(clientOutDir, 'page.js');

    const result = collectClientAssetPaths([
      page,
      page,
      path.join(projectRoot, 'outside', 'other.js'),
    ], projectRoot, clientOutDir);

    expect(result.chunks).toEqual(['client/page.js']);
    expect(result.css).toEqual([]);
  });
});
