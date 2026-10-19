import { ModuleType } from '../types.js';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export interface TransformResultCSS {
  code: string;
  imports: string[];
  type: ModuleType;
}

/**
 * Detect if the CSS content contains Tailwind v4 directives (@import "tailwindcss")
 * or Tailwind v3 directives (@tailwind base/components/utilities)
 */
function hasTailwindDirectives(content: string): boolean {
  return (
    content.includes('@import "tailwindcss"') ||
    content.includes("@import 'tailwindcss'") ||
    /^@tailwind\s+(base|components|utilities)/m.test(content)
  );
}

interface TailwindCli { bin: string; name: string }

/** Walk up from `start` looking for node_modules/<pkg>/package.json. */
function findPackageDir(start: string, pkg: string): string | null {
  let dir = path.resolve(start);
  for (;;) {
    const candidate = path.join(dir, 'node_modules', pkg);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Resolve the locally installed Tailwind CLI (v4: @tailwindcss/cli, v3: tailwindcss) to a JS entry
 * point, so it can run with the current Node binary. No `npx`: it can hit the network, hang, or
 * pick a different version than the project depends on.
 */
function resolveTailwindCli(projectRoot: string): TailwindCli | null {
  for (const name of ['@tailwindcss/cli', 'tailwindcss']) {
    const dir = findPackageDir(projectRoot, name);
    if (!dir) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.tailwindcss ?? Object.values(pkg.bin ?? {})[0];
      if (typeof bin === 'string') return { bin: path.join(dir, bin), name };
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

export async function transformCSS(filePath: string, content: string): Promise<TransformResultCSS> {
  if (hasTailwindDirectives(content)) {
    const cwd = process.cwd();
    const cli = resolveTailwindCli(cwd);
    if (!cli) {
      throw new Error(
        `[velix-pack] ${filePath} uses Tailwind directives but no Tailwind CLI is installed. ` +
          `Install it: npm i -D tailwindcss @tailwindcss/cli`
      );
    }

    const outDir = path.join(cwd, '.velix', 'cache', 'pack');
    fs.mkdirSync(outDir, { recursive: true });
    const outputPath = path.join(outDir, 'tailwind.compiled.css');

    const result = spawnSync(process.execPath, [cli.bin, '-i', filePath, '-o', outputPath], {
      cwd,
      stdio: 'pipe',
      timeout: 120000,
    });

    if (result.status !== 0 || !fs.existsSync(outputPath)) {
      const detail = (result.stderr?.toString() || result.error?.message || '').trim();
      throw new Error(`[velix-pack] Tailwind (${cli.name}) failed on ${filePath}:\n${detail}`);
    }

    return { code: fs.readFileSync(outputPath, 'utf-8'), imports: [], type: 'shared' };
  }

  // Standard CSS pass-through
  return { code: content, imports: [], type: 'shared' };
}
