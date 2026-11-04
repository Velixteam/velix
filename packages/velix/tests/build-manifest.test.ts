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


import { collectRouteClientAssets } from '../build/index.js';

describe('collectRouteClientAssets', () => {
  it('keeps unrelated route entrypoints out while including reachable shared chunks and CSS', () => {
    const projectRoot = path.resolve('/tmp/velix-route-assets');
    const clientOutDir = path.join(projectRoot, 'dist', 'client');
    const dependencyMetafile = {
      inputs: {
        'app/alpha/page.tsx': { imports: [{ path: '../../components/alpha.js', external: true }] },
        'app/beta/page.tsx': { imports: [{ path: '../../components/beta.tsx' }] },
        'components/alpha.tsx': { imports: [{ path: './shared.tsx' }, { path: '../styles/alpha.css' }] },
        'components/beta.tsx': { imports: [{ path: './shared.tsx' }] },
        'components/shared.tsx': { imports: [] },
        'styles/alpha.css': { imports: [] },
      },
    };
    const clientMetafile = {
      outputs: {
        'dist/client/alpha-AAA.js': { entryPoint: 'components/alpha.tsx', inputs: { 'components/alpha.tsx': {}, 'components/shared.tsx': {} } },
        'dist/client/beta-BBB.js': { entryPoint: 'components/beta.tsx', inputs: { 'components/beta.tsx': {}, 'components/shared.tsx': {} } },
        'dist/client/chunks/shared-CCC.js': { inputs: { 'components/shared.tsx': {} } },
        'dist/client/alpha-DDD.css': { inputs: { 'styles/alpha.css': {} } },
      },
    };

    const result = collectRouteClientAssets([
      { path: '/alpha', sourceFiles: [path.join(projectRoot, 'app/alpha/page.tsx')] },
      { path: '/beta', sourceFiles: [path.join(projectRoot, 'app/beta/page.tsx')] },
    ], dependencyMetafile, clientMetafile, projectRoot, clientOutDir);

    expect(result['/alpha']).toEqual({
      clientChunks: ['client/alpha-AAA.js', 'client/chunks/shared-CCC.js'],
      css: ['/client/alpha-DDD.css'],
    });
    expect(result['/beta']).toEqual({
      clientChunks: ['client/beta-BBB.js', 'client/chunks/shared-CCC.js'],
      css: [],
    });
  });

  it('returns empty asset lists when a route has no reachable client inputs', () => {
    const projectRoot = path.resolve('/tmp/velix-route-assets');
    const result = collectRouteClientAssets([
      { path: '/server-only', sourceFiles: [path.join(projectRoot, 'app/server-only/page.tsx')] },
    ], { inputs: {} }, { outputs: {} }, projectRoot, path.join(projectRoot, 'dist/client'));

    expect(result['/server-only']).toEqual({ clientChunks: [], css: [] });
  });
});
