import { describe, it, expect } from 'vitest';
import path from 'path';
import { ModuleGraph } from '../src/graph/module-graph.js';
import { CodeSplitter } from '../src/bundler/code-splitter.js';

describe('Velix Pack Code Splitter', () => {
  const projectRoot = process.cwd();

  it('should split route modules into separate chunks', () => {
    const graph = new ModuleGraph(projectRoot);
    const homePage = path.join(projectRoot, 'app/page.tsx');
    const dashboardPage = path.join(projectRoot, 'app/dashboard/page.tsx');
    const serverDb = path.join(projectRoot, 'server/db.ts');

    graph.addModule(homePage, 'client');
    graph.addModule(dashboardPage, 'client');
    graph.addModule(serverDb, 'server');

    const splitter = new CodeSplitter(graph);
    const chunks = splitter.splitIntoChunks();

    expect(chunks.length).toBeGreaterThanOrEqual(3);
    const chunkNames = chunks.map(c => c.name);
    expect(chunkNames).toContain('server-bundle');
    expect(chunkNames).toContain('route-home');
    expect(chunkNames).toContain('route-dashboard');
  });
});
