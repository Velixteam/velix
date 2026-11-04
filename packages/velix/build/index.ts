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

type ClientMetafile = {
  inputs: Record<string, { imports?: Array<{ path: string; external?: boolean }> }>;
  outputs: Record<string, {
    inputs?: Record<string, unknown>;
    entryPoint?: string;
    imports?: Array<{ path: string; external?: boolean; kind?: string }>;
  }>;
};

/**
 * Resolve each route's client dependency closure against esbuild's metafile.
 * Shared chunks are included whenever their input modules are reachable from
 * the route, while unrelated route entrypoints are excluded.
 */
export function collectRouteClientAssets(
  routes: Array<{ path: string; sourceFiles: string[] }>,
  dependencyMetafile: Pick<ClientMetafile, 'inputs'>,
  clientMetafile: Pick<ClientMetafile, 'outputs'>,
  projectRoot: string,
  clientOutDir: string
): Record<string, { clientChunks: string[]; css: string[] }> {
  const inputByAbsolutePath = new Map<string, string>();
  for (const inputKey of Object.keys(dependencyMetafile.inputs)) {
    inputByAbsolutePath.set(path.resolve(projectRoot, inputKey), inputKey);
  }

  const outputAssets = Object.entries(clientMetafile.outputs).map(([outputKey, output]) => ({
    output,
    absolutePath: path.resolve(projectRoot, outputKey),
    inputKeys: Object.keys(output.inputs ?? {}),
    entryPoint: output.entryPoint,
  }));

  const result: Record<string, { clientChunks: string[]; css: string[] }> = {};

  for (const route of routes) {
    const reachable = new Set<string>();
    const pending = route.sourceFiles
      .map(file => inputByAbsolutePath.get(path.resolve(file)) ?? inputByAbsolutePath.get(path.resolve(projectRoot, path.relative(projectRoot, file))))
      .filter((key): key is string => Boolean(key));

    while (pending.length > 0) {
      const inputKey = pending.pop()!;
      if (reachable.has(inputKey)) continue;
      reachable.add(inputKey);

      const input = dependencyMetafile.inputs[inputKey];
      for (const imported of input?.imports ?? []) {
        // With bundle:false, esbuild marks preserved imports as external even
        // when they resolve to local project files. Match against the complete
        // server input set instead of dropping every import flagged external.
        const resolved = path.resolve(path.dirname(path.resolve(projectRoot, inputKey)), imported.path);
        const candidates = [
          resolved,
          ...['.tsx', '.ts', '.jsx', '.js', '.mts', '.mjs', '.cts', '.cjs'].map(ext => resolved + ext),
          ...['index.tsx', 'index.ts', 'index.jsx', 'index.js'].map(file => path.join(resolved, file)),
        ];
        const dependencyKey = candidates
          .map(candidate => inputByAbsolutePath.get(candidate))
          .find((key): key is string => Boolean(key));
        if (dependencyKey && !reachable.has(dependencyKey)) pending.push(dependencyKey);
      }
    }

    const chunks = new Set<string>();
    const css = new Set<string>();
    for (const emitted of outputAssets) {
      // Entry-point bundles belong only to the route that can reach that entry.
      // Shared non-entry chunks are selected by their reachable input modules.
      if (emitted.entryPoint) {
        const entryKey = inputByAbsolutePath.get(path.resolve(projectRoot, emitted.entryPoint));
        if (!entryKey || !reachable.has(entryKey)) continue;
      } else if (!emitted.inputKeys.some(inputKey => reachable.has(inputKey))) {
        continue;
      }
      const relative = path.relative(clientOutDir, emitted.absolutePath).split(path.sep).join('/');
      if (!relative || relative === '..' || relative.startsWith('../') || path.isAbsolute(relative)) continue;
      if (/\.css$/i.test(relative)) css.add('/client/' + relative);
      else if (/\.(?:m?js)$/i.test(relative)) chunks.add(path.posix.join('client', relative));
    }

    result[route.path] = {
      clientChunks: [...chunks].sort(),
      css: [...css].sort(),
    };
  }

  return result;
}

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
  let serverMetafile: ClientMetafile | undefined;

  // Include project components and islands in the server compilation graph as
  // well as app routes. With bundle:false, esbuild only emits declared entry
  // points, so omitting these directories leaves imported modules out of dist
  // and out of the metafile used to associate client assets with routes.
  const candidateDirs = [
    appDir,
    path.join(projectRoot, 'components'),
    path.join(projectRoot, 'islands'),
  ];
  const sourceFiles = [...new Set(candidateDirs
    .filter(dir => fs.existsSync(dir))
    .flatMap(dir => findFiles(dir, /\.(tsx?|jsx?)$/)))];

  if (sourceFiles.length === 0) {
    logger.warn('No source files found in app/ directory');
    return;
  }

  // 4. Build server bundle
  try {
    await esbuild.build({
      absWorkingDir: projectRoot,
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
      metafile: true,
    }).then(result => {
      serverMetafile = result.metafile;
      return result;
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
      // Populated from esbuild's output metafile after client bundling.
      clientChunks: [],
      css: [],
    };
  }


  // 5. Build client bundle (client components and islands)
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
  let clientMetafile: ClientMetafile | undefined;

  if (clientFiles.length > 0) {
    try {
      const clientResult = await esbuild.build({
        absWorkingDir: projectRoot,
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

      // Retain the metafile for route-level dependency mapping.
      clientMetafile = clientResult.metafile;

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

  // Route asset lists are finalized from the client metafile after bundling.

  if (serverMetafile && clientMetafile) {
    const routeAssets = collectRouteClientAssets(
      routes.appRoutes.map(route => ({
        path: route.path,
        sourceFiles: [route.filePath, ...collectLayouts(route.filePath, appDir)],
      })),
      serverMetafile,
      clientMetafile,
      projectRoot,
      clientOutDir
    );
    for (const [routePath, assets] of Object.entries(routeAssets)) {
      const routeManifest = manifestRoutes[routePath];
      if (routeManifest) {
        routeManifest.clientChunks = assets.clientChunks;
        routeManifest.css = assets.css;
      }
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


/**
 * Convert esbuild metafile output paths into manifest-safe client asset URLs.
 * Outputs outside clientOutDir are ignored to prevent publishing invalid paths.
 */
export function collectClientAssetPaths(
  outputPaths: string[],
  projectRoot: string,
  clientOutDir: string
): { chunks: string[]; css: string[] } {
  const chunks = new Set<string>();
  const css = new Set<string>();

  for (const outputPath of outputPaths) {
    const absoluteOutput = path.resolve(projectRoot, outputPath);
    const relativeOutput = path.relative(clientOutDir, absoluteOutput).split(path.sep).join('/');
    if (!relativeOutput || relativeOutput === '..' || relativeOutput.startsWith('../') || path.isAbsolute(relativeOutput)) {
      continue;
    }
    if (/\.css$/i.test(relativeOutput)) {
      css.add('/client/' + relativeOutput);
    } else if (/\.(?:m?js)$/i.test(relativeOutput)) {
      chunks.add(path.posix.join('client', relativeOutput));
    }
  }

  return { chunks: [...chunks].sort(), css: [...css].sort() };
}

export default { build };
