/**
 * Velix Static Renderer
 * Run with: npx tsx build-render.ts
 * 
 * 1. Scans app/ for all page.tsx files
 * 2. Starts Velix server
 * 3. Fetches all page routes as HTML
 * 4. Saves them to out/ directory
 * 5. Copies public assets
 * 6. Exits
 */

import { createServer } from '@teamvelix/velix/server';
import { pluginManager, PluginHooks } from '@teamvelix/velix';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const OUT_DIR = path.join(projectRoot, 'out');
const PUBLIC_DIR = path.join(projectRoot, 'public');
const APP_DIR = path.join(projectRoot, 'app');

/**
 * Recursively scan the app/ directory for page.tsx files
 * and convert them to URL routes.
 * 
 *   app/page.tsx           → /
 *   app/docs/page.tsx      → /docs
 *   app/docs/routing/page.tsx → /docs/routing
 *   app/compare/page.tsx   → /compare
 */
function discoverRoutes(dir: string, base = ''): string[] {
  const routes: string[] = [];
  if (!fs.existsSync(dir)) return routes;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // Check if this directory has a page.tsx / page.jsx
  const hasPage = entries.some(e => 
    !e.isDirectory() && /^page\.(tsx|jsx|ts|js)$/.test(e.name)
  );

  if (hasPage) {
    routes.push(base || '/');
  }

  // Recurse into subdirectories
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
      const subBase = `${base}/${entry.name}`;
      routes.push(...discoverRoutes(path.join(dir, entry.name), subBase));
    }
  }

  return routes;
}

function cleanDir(dir: string) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

async function main() {
  console.log('⚡ Velix Static Build');
  console.log('─'.repeat(40));

  // 0. Discover routes
  const ROUTES = discoverRoutes(APP_DIR);
  console.log(`ℹ Discovered ${ROUTES.length} route(s): ${ROUTES.join(', ')}`);

  // 1. Clean output
  cleanDir(OUT_DIR);
  console.log('✔ Cleaned output directory');

  // 2. Start Velix server directly (no CLI layer) on dedicated build port
  console.log('ℹ Starting Velix server...');
  process.env.PORT = process.env.PORT || '3009';
  const { server, config } = await createServer({ projectRoot, mode: 'production' }) as any;

  // Run build:start hook (e.g., Tailwind CSS build)
  console.log('ℹ Running build hooks...');
  await pluginManager.runHook(PluginHooks.BUILD_START);

  const addr = server.address();
  const port = (typeof addr === 'object' && addr?.port) ? addr.port : (process.env.PORT || 3009);
  const host = config?.server?.host || 'localhost';
  const baseUrl = `http://${host}:${port}`;

  // Give server a moment to fully initialize
  await new Promise(r => setTimeout(r, 1000));
  console.log(`✔ Server ready at ${baseUrl}`);

  // 3. Fetch and save all routes
  let rendered = 0;
  let failed = 0;
  for (const route of ROUTES) {
    try {
      const res = await fetch(`${baseUrl}${route}`);
      const html = await res.text();

      const outPath = route === '/'
        ? path.join(OUT_DIR, 'index.html')
        : path.join(OUT_DIR, route.slice(1), 'index.html');

      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log(`✔ Pre-rendered: ${route} → ${path.relative(projectRoot, outPath)}`);
      rendered++;
    } catch (err: any) {
      console.error(`✖ Failed to render ${route}: ${err.message}`);
      failed++;
    }
  }

  // 4. Copy public assets
  copyDir(PUBLIC_DIR, OUT_DIR);
  console.log('✔ Static assets copied');

  // 5. Summary
  console.log('─'.repeat(40));
  console.log(`✔ Static build complete → out/ (${rendered} rendered, ${failed} failed)`);

  // 6. Shutdown
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000);
}

main().catch(err => {
  console.error('✖ Build failed:', err.message);
  process.exit(1);
});
