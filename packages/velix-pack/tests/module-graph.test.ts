import { describe, it, expect } from 'vitest';
import path from 'path';
import { ModuleGraph } from '../src/graph/module-graph.js';
import { isServerModule, isClientModule } from '../src/graph/boundary.js';

describe('Velix Pack Module Graph & Boundaries', () => {
  const projectRoot = process.cwd();

  it('should track dependencies and dependents correctly', () => {
    const graph = new ModuleGraph(projectRoot);
    const fileA = path.join(projectRoot, 'app/page.tsx');
    const fileB = path.join(projectRoot, 'components/Header.tsx');

    const modA = graph.addModule(fileA, 'client');
    const modB = graph.addModule(fileB, 'client');

    graph.updateDependencies(fileA, [fileB]);

    expect(modA.dependencies.has(graph.toRelativeId(fileB))).toBe(true);
    expect(modB.dependents.has(graph.toRelativeId(fileA))).toBe(true);
  });

  it('should detect server modules by path and directive', () => {
    expect(isServerModule('server/db.ts')).toBe(true);
    expect(isServerModule('app/page.tsx', "'use server'\nexport async function action() {}")).toBe(true);
    expect(isServerModule('app/page.tsx', "export default function Page() {}")).toBe(false);
  });

  it('should detect client modules by directive', () => {
    expect(isClientModule('app/page.tsx', "'use client'\nexport default function Page() {}")).toBe(true);
    expect(isClientModule('app/page.tsx', "'use island'\nexport default function Widget() {}")).toBe(true);
  });

  it('should detect boundary violations', () => {
    const graph = new ModuleGraph(projectRoot);
    const clientFile = path.join(projectRoot, 'app/profile/page.tsx');
    const serverFile = path.join(projectRoot, 'server/db.ts');

    graph.addModule(clientFile, 'client');
    graph.addModule(serverFile, 'server');
    graph.updateDependencies(clientFile, [serverFile]);

    const violations = graph.checkBoundaries();
    expect(violations.length).toBe(1);
    expect(violations[0].clientModule).toBe(graph.toRelativeId(clientFile));
    expect(violations[0].serverModule).toBe(graph.toRelativeId(serverFile));
  });
});
