#!/usr/bin/env tsx
/**
 * scripts/check-imports.ts
 *
 * CI guard: resolve every relative import inside website/app and
 * templates/*/app; fail loudly if any target file is absent from the
 * git index (i.e. untracked or gitignored).
 *
 * Usage:
 *   pnpm tsx scripts/check-imports.ts
 *   # or in CI: node --loader ts-node/esm scripts/check-imports.ts
 *
 * Exit code 1 when at least one import cannot be resolved.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// 1. Collect git-tracked files
// ---------------------------------------------------------------------------

const trackedFiles = new Set<string>(
  execSync('git ls-files', { cwd: ROOT })
    .toString()
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean)
    .map((f) => path.resolve(ROOT, f))
);

// ---------------------------------------------------------------------------
// 2. Directories to scan
// ---------------------------------------------------------------------------

const SCAN_ROOTS: string[] = [
  path.join(ROOT, 'website', 'app'),
  // templates glob
  ...fs
    .readdirSync(path.join(ROOT, 'templates'))
    .filter((d) => {
      try {
        return fs.statSync(path.join(ROOT, 'templates', d)).isDirectory();
      } catch {
        return false;
      }
    })
    .map((d) => path.join(ROOT, 'templates', d, 'app')),
].filter((p) => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
});

// ---------------------------------------------------------------------------
// 3. Parse relative imports from a file
// ---------------------------------------------------------------------------

const IMPORT_RE = /(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"](\.[^'"]+)['"]/g;
const SUPPORTED_EXTS = ['.tsx', '.ts', '.jsx', '.js'];

function resolveImport(fromFile: string, importPath: string): string | null {
  const base = path.resolve(path.dirname(fromFile), importPath);

  // Exact match first
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;

  // Try known extensions
  for (const ext of SUPPORTED_EXTS) {
    const candidate = base + ext;
    if (fs.existsSync(candidate)) return candidate;
  }

  // Try index files
  for (const ext of SUPPORTED_EXTS) {
    const candidate = path.join(base, `index${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

// ---------------------------------------------------------------------------
// 4. Walk directory, collect TypeScript/TSX files
// ---------------------------------------------------------------------------

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .velix, dist
      if (['node_modules', '.velix', 'dist', '.next', '.cache'].includes(entry.name)) continue;
      results.push(...walk(full));
    } else if (SUPPORTED_EXTS.some((e) => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 5. Check imports
// ---------------------------------------------------------------------------

let errors = 0;
let checked = 0;

for (const scanRoot of SCAN_ROOTS) {
  const files = walk(scanRoot);
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf-8');
    let match: RegExpExecArray | null;
    IMPORT_RE.lastIndex = 0;
    while ((match = IMPORT_RE.exec(src)) !== null) {
      const importPath = match[1];
      // Skip CSS and asset imports
      if (/\.(css|scss|less|sass|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|otf)$/.test(importPath)) continue;

      const resolved = resolveImport(file, importPath);
      checked++;

      if (!resolved) {
        console.error(
          `\x1b[31m[check-imports] MISSING FILE\x1b[0m\n` +
          `  Import: "${importPath}"\n` +
          `  From:   ${path.relative(ROOT, file)}\n` +
          `  Resolved path does not exist on disk.\n`
        );
        errors++;
        continue;
      }

      if (!trackedFiles.has(resolved)) {
        console.error(
          `\x1b[31m[check-imports] UNTRACKED FILE\x1b[0m\n` +
          `  Import: "${importPath}"\n` +
          `  From:   ${path.relative(ROOT, file)}\n` +
          `  Target: ${path.relative(ROOT, resolved)}\n` +
          `  File exists on disk but is NOT in git index (check .gitignore).\n`
        );
        errors++;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Report
// ---------------------------------------------------------------------------

if (errors > 0) {
  console.error(`\x1b[31m✖ check-imports: ${errors} broken import(s) found (${checked} total checked)\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\x1b[32m✔ check-imports: all ${checked} relative imports resolved successfully\x1b[0m`);
}
