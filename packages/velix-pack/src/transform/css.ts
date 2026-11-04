import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import postcss from 'postcss';
import loadPostcssConfig from 'postcss-load-config';
import { Resolver } from '../resolver/index.js';
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

const POSTCSS_CONFIG_FILES = [
  'postcss.config.js',
  'postcss.config.cjs',
  'postcss.config.mjs',
  'postcss.config.ts',
  'postcss.config.cts',
  'postcss.config.mts',
  '.postcssrc',
  '.postcssrc.json',
  '.postcssrc.js',
  '.postcssrc.cjs',
  '.postcssrc.mjs',
  '.postcssrc.yaml',
  '.postcssrc.yml',
  '.postcssrc.ts',
  '.postcssrc.cts',
  '.postcssrc.mts',
];

/** Ignore comments before scanning for Tailwind at-rules. */
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

/** Resolve only a project-local Tailwind CLI. Never invoke npx. */
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

function parseImportSpecifier(params: string): string | null {
  const match = params.trim().match(
    /^(?:url\(\s*)?(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)?/i
  );
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

/**
 * Collect local CSS imports for dependency graph/HMR tracking.
 * Bare package imports, Tailwind's package import and remote URLs are left
 * to the CSS compiler; only project files become graph dependencies.
 */
export function extractCssImports(
  content: string,
  filePath: string,
  resolver: Resolver
): string[] {
  const root = postcss.parse(content, { from: filePath });
  const imports = new Set<string>();

  root.walkAtRules('import', atRule => {
    const specifier = parseImportSpecifier(atRule.params);
    if (!specifier) return;

    if (
      specifier === 'tailwindcss' ||
      specifier.startsWith('http://') ||
      specifier.startsWith('https://') ||
      specifier.startsWith('//') ||
      specifier.startsWith('data:') ||
      (!specifier.startsWith('.') && !specifier.startsWith('/'))
    ) {
      return;
    }

    const resolved = resolver.resolve(specifier, filePath);
    if (!resolved) {
      throw atRule.error(
        `Cannot resolve local CSS import "${specifier}" from ${filePath}`,
        { plugin: 'velix-pack' }
      );
    }
    if (path.extname(resolved).toLowerCase() !== '.css') {
      throw atRule.error(
        `CSS import "${specifier}" must resolve to a .css file (resolved: ${resolved})`,
        { plugin: 'velix-pack' }
      );
    }
    imports.add(resolved);
  });

  return [...imports];
}

function hasPostcssConfig(projectRoot: string): boolean {
  if (POSTCSS_CONFIG_FILES.some(file => fs.existsSync(path.join(projectRoot, file)))) {
    return true;
  }

  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return false;

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return Boolean(packageJson.postcss);
  } catch {
    return false;
  }
}

async function applyPostcss(
  content: string,
  inputPath: string,
  projectRoot: string
): Promise<string> {
  if (!hasPostcssConfig(projectRoot)) return content;

  let config;
  try {
    config = await loadPostcssConfig(
      {},
      { env: process.env.NODE_ENV ?? 'development' },
      projectRoot
    );
  } catch (error) {
    throw new Error(
      `[velix-pack] Failed to load PostCSS config for ${inputPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  try {
    const result = await postcss(config.plugins).process(content, {
      ...config.options,
      from: inputPath,
      to: inputPath,
      map: false,
    });
    return result.css;
  } catch (error) {
    throw new Error(
      `[velix-pack] PostCSS processing failed for ${inputPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function transformCSS(
  filePath: string,
  content: string,
  resolver?: Resolver
): Promise<TransformResultCSS> {
  const projectRoot = process.cwd();
  const inputPath = path.resolve(projectRoot, filePath);
  const cssResolver = resolver ?? new Resolver({ projectRoot });

  // Parse CSS even when Tailwind is absent: imports are still dependencies
  // and must participate in incremental rebuilds and HMR.
  const imports = extractCssImports(content, inputPath, cssResolver);
  let code = content;

  if (hasTailwindDirectives(content)) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`[velix-pack] CSS input file does not exist: ${inputPath}`);
    }

    const cli = resolveTailwindCli(projectRoot);
    const cacheRoot = path.join(projectRoot, '.velix', 'cache', 'pack');
    fs.mkdirSync(cacheRoot, { recursive: true });

    // Keep the temporary input beside the source so relative @import and
    // @source paths retain their original resolution semantics.
    const tempInput = path.join(
      path.dirname(inputPath),
      `.${path.basename(inputPath, '.css')}.${crypto.randomUUID()}.velix.css`
    );
    const tempDir = fs.mkdtempSync(path.join(cacheRoot, 'css-'));
    const outputPath = path.join(tempDir, 'compiled.css');

    try {
      fs.writeFileSync(tempInput, content, 'utf8');
      const result = spawnSync(
        process.execPath,
        [cli.bin, '-i', tempInput, '-o', outputPath],
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

      code = fs.readFileSync(outputPath, 'utf8');
    } finally {
      fs.rmSync(tempInput, { force: true });
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  code = await applyPostcss(code, inputPath, projectRoot);
  return { code, imports, type: 'shared' };
}
