import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from '../build/index.js';
import { loadAssetManifest } from '@teamvelix/velix-core';

const temporaryProjects: string[] = [];

afterEach(() => {
  for (const projectRoot of temporaryProjects.splice(0)) {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
});

describe('production build integration', () => {
  it('emits a loadable manifest with route-scoped client chunks and copied public assets', async () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'velix-production-build-'));
    temporaryProjects.push(projectRoot);

    const appDir = path.join(projectRoot, 'app');
    const componentsDir = path.join(projectRoot, 'components');
    const publicDir = path.join(projectRoot, 'public');
    const outDir = path.join(projectRoot, 'build-output');

    fs.mkdirSync(appDir, { recursive: true });
    fs.mkdirSync(componentsDir, { recursive: true });
    fs.mkdirSync(publicDir, { recursive: true });

    fs.writeFileSync(
      path.join(appDir, 'page.tsx'),
      "import Counter from '../components/Counter';\nexport default function Page() { return <main><h1>Production fixture</h1><Counter /></main>; }\n",
    );
    fs.writeFileSync(
      path.join(componentsDir, 'Counter.tsx'),
      "'use client';\nexport default function Counter() { return <button>Count</button>; }\n",
    );
    fs.writeFileSync(path.join(publicDir, 'health.txt'), 'velix-production-build-ok');

    await build({ projectRoot, outDir, minify: false, sourcemap: false });

    const manifest = await loadAssetManifest('production', projectRoot, { outDir });
    const route = manifest.routes['/'];

    expect(route).toBeDefined();
    expect(route.serverFile).toBe('server/app/page.js');
    expect(route.clientChunks).toHaveLength(1);
    expect(route.clientChunks[0]).toMatch(/^client\/Counter-.+\.js$/);
    expect(fs.existsSync(path.join(outDir, route.serverFile))).toBe(true);
    expect(fs.existsSync(path.join(outDir, route.clientChunks[0]))).toBe(true);
    expect(fs.readFileSync(path.join(outDir, 'public', 'health.txt'), 'utf8')).toBe('velix-production-build-ok');
    expect(manifest.buildId).toMatch(/^[a-f0-9]{16}$/);
  });
});
