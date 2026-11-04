import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ModuleType } from '../types.js';

export interface TransformResultCSS {
  code: string;
  imports: string[];
  type: ModuleType;
}

interface TailwindCli {
  bin: string;
  name: '@tailwindcss/cli' | 'tailwindcss';
}

/**
 * Ignore comments before scanning for Tailwind at-rules. This avoids false
 * positives when documentation/examples are embedded in CSS comments.
 */
function stripCssComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Detect common Tailwind v3 directives and the v4 package import. */
export function hasTailwindDirectives(content: string): boolean {
  const css = stripCssComments(content);
  const v4Import = /@import\s+(?:url\(\s*)?(['"])tailwindcss(?:\/[^'"]*)?\1\s*\)?\s*;/i;
  const v3Directive = /@tailwind\s+(?:base|components|utilities|screens|variants)\s*;/i;
  return v4Import.test(css) || v3Directive.test(css);
}

function findPackageDir(start: string, packageName: string): string | null {
  let directory = path.resolve(start);

  while (true) {
    const candidate = path.join(directory, 'node_modules', packageName);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;

    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

/**
 * Resolve only a project-local Tailwind CLI. Never use npx here: transforms
 * must be deterministic and must not download packages or access the network.
 */
function resolveTailwindCli(projectRoot: string): TailwindCli {
  for (const name of ['@tailwindcss/cli', 'tailwindcss'] as const) {
    const packageDir = findPackageDir(projectRoot, name);
    if (!packageDir) continue;

    const packageJsonPath = path.join(packageDir, 'package.json');
    let packageJson: { bin?: string | Record<string, string> };

    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (error) {
      throw new Error(
        `[velix-pack] Cannot read ${packageJsonPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const bin = typeof packageJson.bin === 'string'
      ? packageJson.bin
      : packageJson.bin?.tailwindcss ?? Object.values(packageJson.bin ?? {})[0];

    if (typeof bin !== 'string') continue;

    const binPath = path.resolve(packageDir, bin);
    if (fs.existsSync(binPath)) return { bin: binPath, name };
  }

  throw new Error(
    '[velix-pack] Tailwind directives were found, but no local Tailwind CLI is installed. ' +
    'For Tailwind v4 install "tailwindcss" and "@tailwindcss/cli"; ' +
    'for Tailwind v3 install "tailwindcss". Velix Pack never runs npx.'
  );
}

export async function transformCSS(filePath: string, content: string): Promise<TransformResultCSS> {
  if (!hasTailwindDirectives(content)) {
    return { code: content, imports: [], type: 'shared' };
  }

  const projectRoot = process.cwd();
  const inputPath = path.resolve(projectRoot, filePath);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`[velix-pack] CSS input file does not exist: ${inputPath}`);
  }

  const cli = resolveTailwindCli(projectRoot);
  const cacheRoot = path.join(projectRoot, '.velix', 'cache', 'pack');
  fs.mkdirSync(cacheRoot, { recursive: true });

  // Every transform gets a private directory: parallel transforms cannot
  // overwrite one another or accidentally read a previous compilation.
  const tempDir = fs.mkdtempSync(path.join(cacheRoot, 'css-'));
  const outputPath = path.join(tempDir, 'compiled.css');

  try {
    const result = spawnSync(
      process.execPath,
      [cli.bin, '-i', inputPath, '-o', outputPath],
      {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120_000,
        windowsHide: true,
      }
    );

    if (result.error || result.status !== 0) {
      const details = [result.stderr, result.stdout, result.error?.message]
        .filter(Boolean).join('\n').trim();
      throw new Error(
        `[velix-pack] Tailwind (${cli.name}) failed for ${filePath} ` +
        `(exit ${result.status ?? 'unknown'}):\n${details || 'No compiler output was provided.'}`
      );
    }

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error(`[velix-pack] Tailwind produced an empty CSS output for ${filePath}.`);
    }

    const code = fs.readFileSync(outputPath, 'utf8');
    return { code, imports: [], type: 'shared' };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
