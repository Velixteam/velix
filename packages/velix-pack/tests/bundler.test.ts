import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ModuleGraph } from '../src/graph/module-graph.js';
import { Bundler } from '../src/bundler/index.js';

const roots: string[] = [];

function createProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'velix-pack-bundler-'));
  roots.push(root);
  const app = path.join(root, 'app');
  fs.mkdirSync(app, { recursive: true });
  return { root, app };
}

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('Bundler', () => {
  it('bundles local server modules and keeps Node packages external', async () => {
    const { root, app } = createProject();
    const page = path.join(app, 'page.ts');
    const helper = path.join(app, 'helper.ts');
    fs.writeFileSync(page, "import { answer } from './helper.js'; export const value = answer;");
    fs.writeFileSync(helper, 'export const answer = 42;');

    const graph = new ModuleGraph(root);
    graph.addModule(page, 'server');
    graph.addModule(helper, 'shared');
    graph.updateDependencies(page, [helper]);

    await new Bundler({ projectRoot: root, outDir: path.join(root, 'dist'), sourcemap: false }).bundle(graph);

    const output = path.join(root, 'dist/server/app/page.js');
    expect(fs.existsSync(output)).toBe(true);
    const code = fs.readFileSync(output, 'utf8');
    expect(code).toContain('42');
    expect(code).not.toContain("from './helper.js'");
  });

  it('creates shared browser chunks for client entry points', async () => {
    const { root, app } = createProject();
    const first = path.join(app, 'first.ts');
    const second = path.join(app, 'second.ts');
    const shared = path.join(app, 'shared.ts');
    fs.writeFileSync(first, "import { value } from './shared.js'; console.log(value);");
    fs.writeFileSync(second, "import { value } from './shared.js'; console.log(value + 1);");
    fs.writeFileSync(shared, 'export const value = 7;');

    const graph = new ModuleGraph(root);
    graph.addModule(first, 'client');
    graph.addModule(second, 'client');
    graph.addModule(shared, 'shared');
    graph.updateDependencies(first, [shared]);
    graph.updateDependencies(second, [shared]);

    await new Bundler({ projectRoot: root, outDir: path.join(root, 'dist'), sourcemap: false }).bundle(graph);

    const clientDir = path.join(root, 'dist/client');
    const files = fs.readdirSync(clientDir, { recursive: true }).map(String);
    expect(files.some(file => file.startsWith('chunks/'))).toBe(true);
    expect(files.some(file => file.includes('first-'))).toBe(true);
    expect(files.some(file => file.includes('second-'))).toBe(true);
  });
});
