import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { hasTailwindDirectives, transformCSS } from './css.js';

const originalCwd = process.cwd();
const projectRoots: string[] = [];

function createProject(options: {
  packageName?: '@tailwindcss/cli' | 'tailwindcss';
  failure?: 'exit' | 'empty';
} = {}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'velix-pack-css-'));
  projectRoots.push(root);
  process.chdir(root);

  const cssPath = path.join(root, 'src', 'styles.css');
  fs.mkdirSync(path.dirname(cssPath), { recursive: true });
  fs.writeFileSync(cssPath, '@import "tailwindcss";\n');

  const packageName = options.packageName ?? '@tailwindcss/cli';
  const packageDir = path.join(root, 'node_modules', packageName);
  fs.mkdirSync(packageDir, { recursive: true });
  fs.writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify({ bin: { tailwindcss: 'cli.cjs' } })
  );
  fs.writeFileSync(
    path.join(packageDir, 'cli.cjs'),
    `const fs = require('node:fs');
const args = process.argv.slice(2);
const output = args[args.indexOf('-o') + 1];
if (${options.failure === 'exit'}) {
  process.stderr.write('synthetic Tailwind failure');
  process.exit(3);
}
if (${options.failure !== 'empty'}) {
  fs.writeFileSync(output, '/* compiled */\\n.utility { color: red; }');
}
`
  );

  return cssPath;
}

afterEach(() => {
  process.chdir(originalCwd);
  for (const root of projectRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('hasTailwindDirectives', () => {
  it('detects Tailwind v4 imports with whitespace and url() syntax', () => {
    expect(hasTailwindDirectives('  @import   "tailwindcss";')).toBe(true);
    expect(hasTailwindDirectives("@import url('tailwindcss');")).toBe(true);
  });

  it('detects Tailwind v3 directives with flexible whitespace', () => {
    expect(hasTailwindDirectives('@tailwind   utilities;')).toBe(true);
    expect(hasTailwindDirectives('@tailwind base;')).toBe(true);
  });

  it('ignores Tailwind examples inside CSS comments', () => {
    expect(hasTailwindDirectives('/* @import "tailwindcss"; */ .card { color: red; }')).toBe(false);
  });

  it('does not classify ordinary CSS as Tailwind', () => {
    expect(hasTailwindDirectives('.card { color: red; }')).toBe(false);
  });
});

describe('transformCSS', () => {
  it('passes ordinary CSS through without requiring Tailwind', async () => {
    const result = await transformCSS('src/ordinary.css', '.card { color: red; }');
    expect(result.code).toBe('.card { color: red; }');
    expect(result.imports).toEqual([]);
    expect(result.type).toBe('shared');
  });

  it.each(['@tailwindcss/cli', 'tailwindcss'] as const)(
    'compiles with the local %s CLI',
    async packageName => {
      const cssPath = createProject({ packageName });
      const result = await transformCSS(cssPath, '@import "tailwindcss";');

      expect(result.code).toContain('.utility');
      expect(fs.existsSync(path.join(process.cwd(), '.velix', 'cache', 'pack'))).toBe(true);
      expect(fs.readdirSync(path.join(process.cwd(), '.velix', 'cache', 'pack'))).toEqual([]);
    }
  );

  it('fails with an actionable message when the CLI is missing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'velix-pack-css-missing-'));
    projectRoots.push(root);
    process.chdir(root);
    const cssPath = path.join(root, 'src', 'styles.css');
    fs.mkdirSync(path.dirname(cssPath), { recursive: true });
    fs.writeFileSync(cssPath, '@import "tailwindcss";');

    await expect(transformCSS(cssPath, '@import "tailwindcss";'))
      .rejects.toThrow(/no local Tailwind CLI is installed/i);
  });

  it('reports compiler failures and cleans its private temporary directory', async () => {
    const cssPath = createProject({ failure: 'exit' });

    await expect(transformCSS(cssPath, '@import "tailwindcss";'))
      .rejects.toThrow(/synthetic Tailwind failure/);

    expect(fs.readdirSync(path.join(process.cwd(), '.velix', 'cache', 'pack'))).toEqual([]);
  });

  it('rejects empty compiler output instead of returning stale CSS', async () => {
    const cssPath = createProject({ failure: 'empty' });

    await expect(transformCSS(cssPath, '@import "tailwindcss";'))
      .rejects.toThrow(/empty CSS output/);

    expect(fs.readdirSync(path.join(process.cwd(), '.velix', 'cache', 'pack'))).toEqual([]);
  });

  it('isolates concurrent transforms so outputs cannot overwrite each other', async () => {
    const cssPath = createProject();
    const [first, second] = await Promise.all([
      transformCSS(cssPath, '@import "tailwindcss";'),
      transformCSS(cssPath, '@import "tailwindcss";'),
    ]);

    expect(first.code).toBe(second.code);
    expect(fs.readdirSync(path.join(process.cwd(), '.velix', 'cache', 'pack'))).toEqual([]);
  });
});
