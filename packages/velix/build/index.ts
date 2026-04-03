/**
 * Velix v5 Build System
 * Production build using esbuild
 */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { loadConfig, resolvePaths } from '../config.js';
import { buildRouteTree } from '../router/index.js';
import { ensureDir, cleanDir, findFiles, formatBytes, formatTime } from '../utils.js';
import logger from '../logger.js';

export interface BuildOptions {
  projectRoot?: string;
  outDir?: string;
  minify?: boolean;
  sourcemap?: boolean;
}

/**
 * Build the Velix application for production
 */
export async function build(options: BuildOptions = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const config = await loadConfig(projectRoot);
  const resolved = resolvePaths(config, projectRoot);

  const outDir = options.outDir || resolved.resolvedOutDir;
  const startTime = Date.now();

  logger.logo();
  logger.info('Building for production...');
  logger.blank();

  // Clean output directory
  cleanDir(outDir);

  const appDir = resolved.resolvedAppDir;
  const routes = buildRouteTree(appDir);

  // Collect all source files
  const sourceFiles = findFiles(appDir, /\.(tsx?|jsx?)$/);

  if (sourceFiles.length === 0) {
    logger.warn('No source files found in app/ directory');
    return;
  }

  // Build server bundle
  try {
    const serverOutDir = path.join(outDir, 'server');
    ensureDir(serverOutDir);

    await esbuild.build({
      entryPoints: sourceFiles,
      outdir: serverOutDir,
      bundle: false,
      format: 'esm',
      platform: 'node',
      target: config.build.target,
      minify: options.minify ?? config.build.minify,
      sourcemap: options.sourcemap ?? config.build.sourcemap,
      jsx: 'automatic',
      logLevel: 'silent',
      treeShaking: true,
      legalComments: 'none',
    });

    logger.success('Server bundle built');
  } catch (err: any) {
    logger.error('Server build failed', err);
    process.exit(1);
  }

  // Build client bundle (client components and islands)
  try {
    const clientOutDir = path.join(outDir, 'client');
    ensureDir(clientOutDir);

    const clientFiles = sourceFiles.filter(f => {
      const content = fs.readFileSync(f, 'utf-8');
      const firstLine = content.split('\n')[0]?.trim();
      return firstLine === "'use client'" || firstLine === '"use client"' ||
             firstLine === "'use island'" || firstLine === '"use island"';
    });

    if (clientFiles.length > 0) {
      await esbuild.build({
        entryPoints: clientFiles,
        outdir: clientOutDir,
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: ['es2022'],
        minify: options.minify ?? config.build.minify,
        sourcemap: options.sourcemap ?? config.build.sourcemap,
        splitting: config.build.splitting,
        jsx: 'automatic',
        logLevel: 'silent',
        external: ['react', 'react-dom'],
        treeShaking: true,
        legalComments: 'none',
        drop: options.minify ?? config.build.minify ? ['console', 'debugger'] : [],
        chunkNames: 'chunks/[name]-[hash]',
      });

      logger.success(`Client bundle built (${clientFiles.length} components)`);
    }
  } catch (err: any) {
    logger.error('Client build failed', err);
    process.exit(1);
  }

  // Copy public directory
  const publicDir = resolved.resolvedPublicDir;
  if (fs.existsSync(publicDir)) {
    const publicOutDir = path.join(outDir, 'public');
    ensureDir(publicOutDir);
    copyDirRecursive(publicDir, publicOutDir);
    logger.success('Static assets copied');
  }

  // Generate build manifest
  const manifest = {
    version: '5.0.0',
    buildTime: new Date().toISOString(),
    routes: routes.appRoutes.map(r => ({
      path: r.path,
      type: r.path.includes(':') ? 'dynamic' : 'static',
    })),
    api: routes.api.map(r => ({ path: r.path })),
  };

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const elapsed = Date.now() - startTime;
  const totalSize = getDirSize(outDir);

  logger.blank();
  logger.divider();
  logger.blank();

  // Log routes
  routes.appRoutes.forEach(r => {
    const type = r.path.includes(':') || r.path.includes('*') ? 'dynamic' : 'static';
    logger.route(r.path, type);
  });
  routes.api.forEach(r => logger.route(r.path, 'api'));

  logger.blank();
  logger.build({ time: elapsed });
  logger.info(`Output: ${outDir} (${formatBytes(totalSize)})`);
  logger.blank();
}

// ============================================================================
// Helpers
// ============================================================================

function copyDirRecursive(src: string, dest: string) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function getDirSize(dir: string): number {
  let size = 0;
  if (!fs.existsSync(dir)) return size;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) size += getDirSize(fullPath);
    else size += fs.statSync(fullPath).size;
  }
  return size;
}

export default { build };
