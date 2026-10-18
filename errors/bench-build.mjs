#!/usr/bin/env node
/**
 * Velix build/dev benchmark.
 *
 *   node scripts/bench-build.mjs <project-dir> [--runs 3]
 *
 * Measures, on a real project (website/, templates/my-saas, your own app):
 *   - dev cold start : `velix dev` with no compiled CSS      -> time until "Ready in …"
 *   - dev warm start : `velix dev` with CSS from a prior run -> time until "Ready in …"
 *   - build          : `velix build` wall-clock time
 * and prints min / median per scenario so before/after comparisons are easy.
 * Run it once on `main` and once on your branch, then compare the two tables.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) ?? '.');
const runs = Number(args[args.indexOf('--runs') + 1]) || 3;
const css = path.join(dir, 'public', 'tailwind.css');
const isWin = process.platform === 'win32';

if (!fs.existsSync(path.join(dir, 'package.json'))) {
  console.error(`No package.json in ${dir}`);
  process.exit(1);
}

const stats = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return { min: s[0], median: s[Math.floor(s.length / 2)], max: s[s.length - 1] };
};
const fmt = (ms) => `${(ms / 1000).toFixed(2)}s`;

function kill(child) {
  if (isWin) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  else child.kill('SIGKILL');
}

/** Start `velix dev`, resolve with the wall-clock time until the server prints "Ready in". */
function devStart(timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const child = spawn('pnpm', ['exec', 'velix', 'dev'], { cwd: dir, shell: true, env: { ...process.env, FORCE_COLOR: '0' } });
    const timer = setTimeout(() => { kill(child); reject(new Error('dev server did not become ready in time')); }, timeoutMs);
    const onData = (buf) => {
      if (/Ready in/i.test(buf.toString())) {
        clearTimeout(timer);
        const elapsed = Date.now() - started;
        kill(child);
        setTimeout(() => resolve(elapsed), 500); // let the process tree die before the next run
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('error', reject);
  });
}

function build() {
  const started = Date.now();
  const r = spawnSync('pnpm', ['exec', 'velix', 'build'], { cwd: dir, shell: true, encoding: 'utf-8' });
  if (r.status !== 0) throw new Error(`velix build failed:\n${r.stderr || r.stdout}`);
  return Date.now() - started;
}

const results = { 'dev cold start': [], 'dev warm start': [], 'build': [] };

for (let i = 0; i < runs; i++) {
  process.stdout.write(`run ${i + 1}/${runs}: `);
  fs.rmSync(css, { force: true });
  results['dev cold start'].push(await devStart());
  results['dev warm start'].push(await devStart()); // CSS from the cold run is still on disk
  results['build'].push(build());
  console.log('done');
}

console.log(`\nProject: ${dir}\n`);
console.log('scenario'.padEnd(18), 'min'.padStart(8), 'median'.padStart(8), 'max'.padStart(8));
for (const [name, xs] of Object.entries(results)) {
  const s = stats(xs);
  console.log(name.padEnd(18), fmt(s.min).padStart(8), fmt(s.median).padStart(8), fmt(s.max).padStart(8));
}
