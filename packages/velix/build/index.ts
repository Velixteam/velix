/**
 * Velix v5 Build System
 * Deterministic production build with typed manifest and hashed assets.
 */

import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadConfig, resolvePaths } from '../config.js';
import { buildRouteTree } from '../router/index.js';
import { ensureDir, cleanDir, findFiles, formatBytes } from '../utils.js';
import logger from '../logger.js';
import { VERSION } from '../version.js';
import { pluginManager, loadPlugins, PluginHooks } from '../plugins/index.js';
import {
  ManifestSchema,
  compileTailwindHashed,
  type VelixManifest,
  type RouteManifestEntry,
  type AssetManifestEntry,
} from '@teamvelix/velix-core';

export interface BuildOptions {
  projectRoot?: string;
  outDir?: string;
  minify?: boolean;
  sourcemap?: boolean;
}

/**
 * Build the Velix application for production.
 */
export async function build(options: BuildOptions = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const config = await loadConfig(projectRoot);
  const resolved = resolvePaths(config, projectRoot);

  // Load plugins and run config hook
  await loadPlugins(projectRoot, config);
  await pluginManager.runHook(PluginHooks.CONFIG, config);

  const outDir = options.outDir || resolved.resolvedOutDir;
  const startTime = Date.now();

  logger.logo();
  logger.info('Building for production...');
  logger.blank();

  // 1. Clean output directory FIRST before generating any output
  cleanDir(outDir);

  const serverOutDir = path.join(outDir, 'server');
  const clientOutDir = path.join(outDir, 'client');
  const publicOutDir = path.join(outDir, 'public');
  ensureDir(serverOutDir);
  ensureDir(clientOutDir);
  ensureDir(publicOutDir);

  // 2. Compile Tailwind CSS directly into dist/public/tailwind.<hash8>.css
  const manifestStyles: string[] = [];
  const appGlobals = path.join(resolved.resolvedAppDir, 'globals.css');
  const publicTailwind = path.join(resolved.resolvedPublicDir, 'tailwind.css');

  if (fs.existsSync(appGlobals) || fs.existsSync(publicTailwind)) {
    try {
      const tailwindRes = compileTailwindHashed(projectRoot, {
        input: fs.existsSync(appGlobals) ? appGlobals : publicTailwind,
        outDir,
        minify: options.minify ?? config.build.minify,
      });
      manifestStyles.push(tailwindRes.hashedUrl);
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('Tailwind build failed', error);
      throw error;
    }
  }

  // Also include any user-declared stylesheets from config.styles
  if (config.styles && Array.isArray(config.styles)) {
    for (const s of config.styles) {
      if (typeof s === 'string' && !manifestStyles.includes(s)) {
        manifestStyles.push(s);
      }
    }
  }

  // Run build:start hook
  await pluginManager.runHook(PluginHooks.BUILD_START, config, projectRoot);

  // 3. Copy public directory to dist/public (excluding unhashed or old tailwind.css)
  const publicDir = resolved.resolvedPublicDir;
  if (fs.existsSync(publicDir)) {
    copyDirPublicFiltered(publicDir, publicOutDir);
    logger.success('Static assets copied');
  }

  // Inventory assets in dist/public for manifest
  const assets: Record<string, AssetManifestEntry> = {};
  function inventoryAssets(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        inventoryAssets(full);
      } else if (entry.isFile()) {
        const relPosix = '/' + path.relative(publicOutDir, full).replace(/\\/g, '/');
        const content = fs.readFileSync(full);
        const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
        assets[relPosix] = {
          size: content.length,
          hash,
        };
      }
    }
  }
  inventoryAssets(publicOutDir);

  const appDir = resolved.resolvedAppDir;
  const routes = buildRouteTree(appDir);

  // Collect source files for server bundle
  const sourceFiles = findFiles(appDir, /\.(tsx?|jsx?)$/);

  if (sourceFiles.length === 0) {
    logger.warn('No source files found in app/ directory');
    return;
  }

  // 4. Build server bundle
  try {
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
  } catch (err: unknown) {
    const error = err as Error;
    logger.error('Server build failed', error);
    process.exit(1);
  }

  // Build route manifest entries
  const manifestRoutes: Record<string, RouteManifestEntry> = {};
  for (const r of routes.appRoutes) {
    const relFromApp = path.relative(appDir, r.filePath).replace(/\.(tsx?|jsx?)$/, '.js');
    const serverFilePath = path.join('server', 'app', relFromApp).replace(/\\/g, '/');
    // Also check direct server/relFromApp
    const serverFileCandidate = fs.existsSync(path.join(outDir, serverFilePath))
      ? serverFilePath
      : path.join('server', relFromApp).replace(/\\/g, '/');

    const layoutPaths = collectLayouts(r.filePath, appDir);
    const layoutsRel = layoutPaths.map(lp => {
      const relLp = path.relative(appDir, lp).replace(/\.(tsx?|jsx?)$/, '.js');
      const cand1 = path.join('server', 'app', relLp).replace(/\\/g, '/');
      return fs.existsSync(path.join(outDir, cand1)) ? cand1 : path.join('server', relLp).replace(/\\/g, '/');
    });

    manifestRoutes[r.path] = {
      serverFile: serverFileCandidate,
      layouts: layoutsRel,
      clientChunks: [],
      css: [],
    };
  }

  // 5. Build client bundle (client components and islands)
  const candidateDirs = [
    appDir,
    path.join(projectRoot, 'components'),
    path.join(projectRoot, 'islands'),
  ];
  const allClientCandidates: string[] = [];
  for (const d of candidateDirs) {
    if (fs.existsSync(d)) {
      allClientCandidates.push(...findFiles(d, /\.(tsx?|jsx?)$/));
    }
  }

  const clientFiles = allClientCandidates.filter(f => {
    try {
      const content = fs.readFileSync(f, 'utf-8');
      return /^\s*(['"])use (?:client|island)\1/m.test(content);
    } catch {
      return false;
    }
  });

  const manifestIslands: Record<string, string> = {};

  if (clientFiles.length > 0) {
    try {
      const clientResult = await esbuild.build({
        entryPoints: clientFiles,
        outdir: clientOutDir,
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: ['es2022'],
        minify: options.minify ?? config.build.minify,
        sourcemap: options.sourcemap ?? config.build.sourcemap,
        splitting: config.build.splitting ?? true,
        jsx: 'automatic',
        logLevel: 'silent',
        external: ['react', 'react-dom'],
        treeShaking: true,
        legalComments: 'none',
        drop: options.minify ?? config.build.minify ? ['console', 'debugger'] : [],
        entryNames: '[name]-[hash]',
        chunkNames: 'chunks/[name]-[hash]',
        metafile: true,
      });

      // Map islands to their hashed outputs
      if (clientResult.metafile) {
        for (const [outPath, outData] of Object.entries(clientResult.metafile.outputs)) {
          if (outData.entryPoint) {
            const entryFile = path.resolve(projectRoot, outData.entryPoint);
            const compName = path.basename(entryFile, path.extname(entryFile));
            const hashedRel = path.relative(clientOutDir, path.resolve(projectRoot, outPath)).replace(/\\/g, '/');
            manifestIslands[compName] = `/client/${hashedRel}`;
          }
        }
      }

      logger.success(`Client bundle built (${clientFiles.length} component${clientFiles.length > 1 ? 's' : ''})`);
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('Client build failed', error);
      process.exit(1);
    }
  }

  // 6. Compute Build ID (deterministic hash of all generated artefacts)
  const allGeneratedFiles: string[] = [];
  function collectFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collectFiles(full);
      else if (entry.isFile() && entry.name !== 'manifest.json') allGeneratedFiles.push(full);
    }
  }
  collectFiles(outDir);
  allGeneratedFiles.sort();

  const buildHasher = crypto.createHash('sha256');
  for (const f of allGeneratedFiles) {
    buildHasher.update(path.relative(outDir, f));
    buildHasher.update(fs.readFileSync(f));
  }
  const buildId = buildHasher.digest('hex').slice(0, 16);

  // 7. Write dist/manifest.json
  const manifest: VelixManifest = {
    schemaVersion: 1,
    buildId,
    version: VERSION,
    routes: manifestRoutes,
    islands: manifestIslands,
    styles: manifestStyles,
    assets,
  };

  // Strict validation with Zod
  ManifestSchema.parse(manifest);

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

  // Run build:end hook
  await pluginManager.runHook(PluginHooks.BUILD_END, { time: elapsed });
}

// ============================================================================
// Helpers
// ============================================================================

function collectLayouts(pageFilePath: string, appDir: string): string[] {
  const layouts: string[] = [];
  const normalizedAppDir = path.resolve(appDir);
  let current = path.dirname(path.resolve(pageFilePath));

  while (true) {
    for (const ext of ['.tsx', '.jsx', '.ts', '.js']) {
      const layoutPath = path.join(current, `layout${ext}`);
      if (fs.existsSync(layoutPath)) {
        layouts.unshift(layoutPath);
        break;
      }
    }
    if (path.resolve(current) === normalizedAppDir) break;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return layouts;
}

function copyDirPublicFiltered(src: string, dest: string) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    // Skip unhashed tailwind.css or old tailwind hashes from public/
    if (entry.name === 'tailwind.css' || /^tailwind\.[a-f0-9]{8}\.css$/.test(entry.name)) {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirPublicFiltered(srcPath, destPath);
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
