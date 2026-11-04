import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compileTailwindHashed } from './tailwind.js';

const roots: string[] = [];

function createProject(options: { fail?: boolean; packageName?: string } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'velix-tailwind-'));
  roots.push(root);

  const input = path.join(root, 'app', 'globals.css');
  fs.mkdirSync(path.dirname(input), { recursive: true });
  fs.writeFileSync(input, '@import "tailwindcss";\n');

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
if (${Boolean(options.fail)}) {
  process.stderr.write('synthetic compiler failure');
  process.exit(2);
}
fs.writeFileSync(output, '/* compiled css */\\n.utility { color: red; }\\n');
`
  );

  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('compileTailwindHashed', () => {
  it('resolves the local v4 CLI and emits a content-addressed stylesheet', () => {
    const root = createProject();
    const result = compileTailwindHashed(root);

    expect(fs.existsSync(result.outputPath)).toBe(true);
    expect(result.hashedFileName).toMatch(/^tailwind\.[a-f0-9]{8}\.css$/);
    expect(fs.readFileSync(result.outputPath, 'utf8')).toContain('.utility');
  });

  it('falls back to the local v3 CLI when the v4 CLI is absent', () => {
    const root = createProject({ packageName: 'tailwindcss' });
    const result = compileTailwindHashed(root);

    expect(fs.existsSync(result.outputPath)).toBe(true);
  });

  it('fails clearly when no local CLI is installed instead of invoking npx', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'velix-tailwind-missing-'));
    roots.push(root);
    const input = path.join(root, 'app', 'globals.css');
    fs.mkdirSync(path.dirname(input), { recursive: true });
    fs.writeFileSync(input, '@import "tailwindcss";');

    expect(() => compileTailwindHashed(root)).toThrow(/No local Tailwind CLI found/);
  });

  it('surfaces compiler failures and removes temporary output files', () => {
    const root = createProject({ fail: true });

    expect(() => compileTailwindHashed(root)).toThrow(/synthetic compiler failure/);
    const publicDir = path.join(root, 'dist', 'public');
    expect(fs.readdirSync(publicDir).filter(file => file.endsWith('.tmp.css'))).toEqual([]);
  });

  it('reuses an existing hashed file for identical CSS', () => {
    const root = createProject();
    const first = compileTailwindHashed(root);
    const second = compileTailwindHashed(root);

    expect(second.outputPath).toBe(first.outputPath);
    expect(fs.readdirSync(path.join(root, 'dist', 'public'))).toEqual([first.hashedFileName]);
  });
});
