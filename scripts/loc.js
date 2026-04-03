#!/usr/bin/env node

/**
 * Velix LOC (Lines of Code) Counter
 * Counts total lines and lines per file type across the project.
 *
 * Usage: node scripts/loc.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.velix', '.next', 'coverage']);
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function walk(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (EXTENSIONS.includes(ext)) {
        results.push({ path: fullPath, ext });
      }
    }
  }

  return results;
}

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

// --- Main ---
const files = walk(ROOT);

const counts = { total: 0 };
for (const ext of EXTENSIONS) {
  counts[ext] = 0;
}

for (const file of files) {
  const lines = countLines(file.path);
  counts.total += lines;
  counts[file.ext] += lines;
}

const label = (ext) => ext.replace('.', '').toUpperCase();

console.log('');
console.log('  ▲ Velix — Lines of Code');
console.log('  ──────────────────────────────');
console.log(`  Total lines:  ${counts.total}`);
console.log('');
for (const ext of EXTENSIONS) {
  if (counts[ext] > 0) {
    console.log(`  ${label(ext).padEnd(5)} ${counts[ext]}`);
  }
}
console.log(`  Files:        ${files.length}`);
console.log('');
