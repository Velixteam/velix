/**
 * Architectural lint test
 * Verifies that velix-core contains ZERO React or React-DOM imports.
 * This ensures the core package remains framework-agnostic.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '__tests__') {
        continue;
      }
      results.push(...getAllTsFiles(fullPath));
    } else if (/\.tsx?$/.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

describe('velix-core architectural boundary', () => {
  const srcDir = path.resolve(__dirname, '..');
  const files = getAllTsFiles(srcDir);

  it('should have source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('should not import React in %s', (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const reactImport = /from\s+['"]react['"]/g;
    const reactDomImport = /from\s+['"]react-dom['"]/g;
    const requireReact = /require\s*\(\s*['"]react['"]\s*\)/g;
    const requireReactDom = /require\s*\(\s*['"]react-dom['"]\s*\)/g;

    const relativePath = path.relative(srcDir, filePath);

    expect(reactImport.test(content), `${relativePath} imports from 'react'`).toBe(false);
    expect(reactDomImport.test(content), `${relativePath} imports from 'react-dom'`).toBe(false);
    expect(requireReact.test(content), `${relativePath} requires 'react'`).toBe(false);
    expect(requireReactDom.test(content), `${relativePath} requires 'react-dom'`).toBe(false);
  });

  it('should not have react or react-dom in package.json dependencies', () => {
    const pkgPath = path.resolve(srcDir, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };

    expect(allDeps).not.toHaveProperty('react');
    expect(allDeps).not.toHaveProperty('react-dom');
  });
});
