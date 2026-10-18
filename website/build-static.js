/**
 * Static Build Script for Vercel
 * 1. Starts Velix dev server temporarily
 * 2. Fetches all page routes as HTML
 * 3. Saves them to out/ directory
 * 4. Copies public assets
 * 5. Stops server
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT_DIR = path.join(__dirname, 'out');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = 3000;

const ROUTES = ['/', '/docs', '/compare'];

function cleanDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

async function waitForServer(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Server did not start in time');
}

async function main() {
  console.log('⚡ Velix Static Build');
  console.log('─'.repeat(40));

  // 1. Clean output
  cleanDir(OUT_DIR);
  console.log('✔ Cleaned output directory');

  // 2. Start temp server
  console.log('ℹ Starting temporary server...');
  const isWin = process.platform === 'win32';
  const serverProc = spawn('node', [
    './node_modules/@teamvelix/cli/dist/index.js', 'dev'
  ], {
    cwd: __dirname,
    stdio: 'pipe',
    env: { ...process.env, PORT: String(PORT) },
    shell: true,
    detached: !isWin,
  });

  let serverOutput = '';
  serverProc.stdout.on('data', d => { serverOutput += d.toString(); });
  serverProc.stderr.on('data', d => { serverOutput += d.toString(); });

  try {
    await waitForServer(`http://localhost:${PORT}`);
    console.log('✔ Server ready');

    // 3. Fetch and save all routes
    for (const route of ROUTES) {
      const url = `http://localhost:${PORT}${route}`;
      const res = await fetch(url);
      const html = await res.text();

      // Determine output path
      const outPath = route === '/'
        ? path.join(OUT_DIR, 'index.html')
        : path.join(OUT_DIR, route.slice(1), 'index.html');

      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log(`✔ Pre-rendered: ${route} → ${path.relative(__dirname, outPath)}`);
    }

    // 4. Copy public assets
    copyDir(PUBLIC_DIR, OUT_DIR);
    console.log('✔ Static assets copied');

    // 5. Summary
    console.log('─'.repeat(40));
    console.log(`✔ Static build complete → ${path.relative(__dirname, OUT_DIR)}/`);

  } finally {
    // Kill server and all child processes
    try { serverProc.kill('SIGTERM'); } catch {}
    // Cross-platform force kill
    const isWin = process.platform === 'win32';
    try {
      if (isWin) {
        spawn('taskkill', ['/pid', String(serverProc.pid), '/f', '/t'], { shell: true, stdio: 'ignore' });
      } else {
        process.kill(-serverProc.pid, 'SIGKILL');
      }
    } catch {}
    // Force exit after cleanup
    setTimeout(() => process.exit(0), 500);
  }
}

main().catch(err => {
  console.error('✖ Build failed:', err.message);
  process.exit(1);
});
