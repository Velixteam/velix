import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { VelixPack } from '../src/index.js';

const roots: string[] = [];

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'velix-pack-stats-'));
  roots.push(root);
  const app = path.join(root, 'app');
  fs.mkdirSync(app, { recursive: true });
  fs.writeFileSync(path.join(app, 'page.ts'), '"use client"; import { shared } from "./shared.js"; console.log(shared);');
  fs.writeFileSync(path.join(app, 'shared.ts'), 'export const shared = "shared-module-payload";');
  return { root, app };
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('VelixPack build statistics', () => {
  it('reports actual emitted client JavaScript bytes and file count', async () => {
    const { root, app } = fixture();
    const outDir = path.join(root, 'dist');
    const pack = new VelixPack({ projectRoot: root, appDir: app, outDir, sourcemap: false });

    const stats = await pack.build();
    const clientDir = path.join(outDir, 'client');
    const emitted = fs.readdirSync(clientDir, { recursive: true })
      .map(String)
      .filter(file => /\.(?:m?js)$/i.test(file));
    const actualBytes = emitted.reduce((total, file) => total + fs.statSync(path.join(clientDir, file)).size, 0);

    expect(stats.chunksCount).toBe(emitted.length);
    expect(stats.initialJsSize + stats.asyncJsSize).toBe(actualBytes);
    expect(stats.initialJsSize).toBeGreaterThan(0);
  });

  it('removes stale chunks when a subsequent build has no client entries', async () => {
    const { root, app } = fixture();
    const outDir = path.join(root, 'dist');
    const pack = new VelixPack({ projectRoot: root, appDir: app, outDir, sourcemap: false });
    await pack.build();

    fs.writeFileSync(path.join(app, 'page.ts'), 'export const serverPage = true;');
    await pack.build();

    const clientDir = path.join(outDir, 'client');
    const emitted = fs.existsSync(clientDir)
      ? fs.readdirSync(clientDir, { recursive: true }).map(String).filter(file => /\.(?:m?js)$/i.test(file))
      : [];
    expect(emitted).toEqual([]);
  });
});
