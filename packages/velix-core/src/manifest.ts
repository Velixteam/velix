/**
 * Velix Manifest Definition & Loader
 * Strict Zod schema and loader for dist/manifest.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';
import { VERSION } from './version.js';

// ============================================================================
// Manifest Schemas
// ============================================================================

export const RouteManifestEntrySchema = z.object({
  serverFile: z.string(),
  layouts: z.array(z.string()).default([]),
  clientChunks: z.array(z.string()).default([]),
  css: z.array(z.string()).default([]),
});

export const AssetManifestEntrySchema = z.object({
  size: z.number().int().nonnegative(),
  hash: z.string(),
});

export const ManifestSchema = z.object({
  schemaVersion: z.number().int().positive().default(1),
  buildId: z.string(),
  version: z.string(),
  routes: z.record(z.string(), RouteManifestEntrySchema),
  islands: z.record(z.string(), z.string()),
  styles: z.array(z.string()),
  assets: z.record(z.string(), AssetManifestEntrySchema),
});

export type RouteManifestEntry = z.infer<typeof RouteManifestEntrySchema>;
export type AssetManifestEntry = z.infer<typeof AssetManifestEntrySchema>;
export type VelixManifest = z.infer<typeof ManifestSchema>;

/**
 * Validates untrusted data against ManifestSchema.
 * Throws a formatted ZodError if invalid.
 */
export function parseManifest(data: unknown): VelixManifest {
  return ManifestSchema.parse(data);
}

// ============================================================================
// Manifest Loader
// ============================================================================

export interface LoadManifestOptions {
  outDir?: string;
  appDir?: string;
  config?: {
    styles?: string[];
    [key: string]: unknown;
  };
}

/**
 * Single deterministic loader for the asset manifest.
 *
 * In production:
 *   Reads `dist/manifest.json`, validates it with Zod, and verifies that every
 *   referenced file actually exists on disk. Refuses to start if anything is missing.
 *
 * In development:
 *   Constructs an in-memory manifest of the exact same schema from the source tree.
 */
export async function loadAssetManifest(
  mode: 'development' | 'production',
  projectRoot: string,
  options: LoadManifestOptions = {}
): Promise<VelixManifest> {
  const root = path.resolve(projectRoot);

  if (mode === 'production') {
    const outDir = options.outDir ? path.resolve(root, options.outDir) : path.join(root, 'dist');
    const manifestPath = path.join(outDir, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(
        `[velix:manifest] Production manifest not found: "${manifestPath}".\n` +
        `The production server cannot start without a build manifest. Run "velix build" first.`
      );
    }

    let parsedJson: unknown;
    try {
      const content = fs.readFileSync(manifestPath, 'utf8');
      parsedJson = JSON.parse(content);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`[velix:manifest] Failed to read or parse "${manifestPath}": ${msg}`);
    }

    const manifest = parseManifest(parsedJson);

    // Verify all referenced files on disk (Fail loudly!)
    const missing: string[] = [];

    // 1. Verify route server files and layouts
    for (const [routePath, route] of Object.entries(manifest.routes)) {
      const serverFile = path.join(outDir, route.serverFile);
      if (!fs.existsSync(serverFile)) {
        missing.push(`Route "${routePath}" server file: ${route.serverFile} (looked in ${serverFile})`);
      }
      for (const layout of route.layouts) {
        const layoutFile = path.join(outDir, layout);
        if (!fs.existsSync(layoutFile)) {
          missing.push(`Layout file: ${layout} (looked in ${layoutFile})`);
        }
      }
      for (const chunk of route.clientChunks) {
        const chunkFile = path.join(outDir, chunk);
        if (!fs.existsSync(chunkFile)) {
          missing.push(`Client chunk: ${chunk} (looked in ${chunkFile})`);
        }
      }
    }

    // 2. Verify islands
    for (const [islandName, islandPath] of Object.entries(manifest.islands)) {
      const rel = islandPath.startsWith('/') ? islandPath.slice(1) : islandPath;
      const islandFile = path.join(outDir, rel);
      if (!fs.existsSync(islandFile)) {
        missing.push(`Island "${islandName}" client file: ${islandPath} (looked in ${islandFile})`);
      }
    }

    // 3. Verify styles
    for (const style of manifest.styles) {
      const rel = style.startsWith('/') ? style.slice(1) : style;
      const styleFile = path.join(outDir, 'public', rel);
      if (!fs.existsSync(styleFile)) {
        missing.push(`Stylesheet: ${style} (looked in ${styleFile})`);
      }
    }

    // 4. Verify assets
    for (const assetPath of Object.keys(manifest.assets)) {
      const rel = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
      const assetFile = path.join(outDir, 'public', rel);
      if (!fs.existsSync(assetFile)) {
        missing.push(`Static asset: ${assetPath} (looked in ${assetFile})`);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `[velix:manifest] Manifest references missing build artefacts:\n` +
        missing.map((m) => `  ✖ ${m}`).join('\n') +
        `\nRun "velix build" to regenerate missing artefacts.`
      );
    }

    return manifest;
  }

  // ── Development Mode ─────────────────────────────────────────────────────────
  const appDir = options.appDir ? path.resolve(root, options.appDir) : path.join(root, 'app');

  // Discover routes
  const routes: Record<string, RouteManifestEntry> = {};
  if (fs.existsSync(appDir)) {
    const scanDir = (dir: string, routeSegments: string[] = []) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let hasPage = false;
      let pageFile = '';

      for (const entry of entries) {
        if (entry.isFile()) {
          const name = entry.name.replace(/\.(tsx?|jsx?)$/, '');
          if (name === 'page') {
            hasPage = true;
            pageFile = path.join(dir, entry.name);
          }
        }
      }

      if (hasPage) {
        const routePath = '/' + routeSegments.join('/');
        const normalized = routePath === '//' ? '/' : routePath;
        routes[normalized] = {
          serverFile: path.relative(root, pageFile),
          layouts: collectLayoutsDev(pageFile, appDir, root),
          clientChunks: [],
          css: [],
        };
      }

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDir(path.join(dir, entry.name), [...routeSegments, entry.name]);
        }
      }
    };

    scanDir(appDir);
  }

  // Discover islands in components/, app/, islands/
  const islands: Record<string, string> = {};
  const searchDirs = [
    path.join(root, 'components'),
    path.join(root, 'app'),
    path.join(root, 'islands'),
  ];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const scanIslands = (current: string) => {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanIslands(full);
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          try {
            const content = fs.readFileSync(full, 'utf8');
            if (/^\s*(['"])use (?:client|island)\1/m.test(content)) {
              const compName = entry.name.replace(/\.(tsx?|jsx?)$/, '');
              islands[compName] = `/__velix/islands/${compName}.js`;
            }
          } catch {}
        }
      }
    };
    scanIslands(dir);
  }

  // Styles
  const styles: string[] = [];
  const publicTailwind = path.join(root, 'public', 'tailwind.css');
  const appGlobals = path.join(root, 'app', 'globals.css');
  if (fs.existsSync(publicTailwind) || fs.existsSync(appGlobals)) {
    styles.push('/tailwind.css');
  }
  if (options.config?.styles && Array.isArray(options.config.styles)) {
    for (const s of options.config.styles) {
      if (typeof s === 'string' && !styles.includes(s)) {
        styles.push(s);
      }
    }
  }

  // Assets in public/
  const assets: Record<string, AssetManifestEntry> = {};
  const publicDir = path.join(root, 'public');
  if (fs.existsSync(publicDir)) {
    const scanAssets = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanAssets(full);
        } else if (entry.isFile()) {
          const relPosix = '/' + path.relative(publicDir, full).replace(/\\/g, '/');
          const size = fs.statSync(full).size;
          assets[relPosix] = { size, hash: 'dev' };
        }
      }
    };
    scanAssets(publicDir);
  }

  const devManifest: VelixManifest = {
    schemaVersion: 1,
    buildId: 'dev-' + crypto.randomBytes(4).toString('hex'),
    version: VERSION,
    routes,
    islands,
    styles,
    assets,
  };

  // Validate to ensure dev and prod manifest share the exact same schema
  return parseManifest(devManifest);
}

function collectLayoutsDev(pageFilePath: string, appDir: string, projectRoot: string): string[] {
  const layouts: string[] = [];
  const normalizedAppDir = path.resolve(appDir);
  let current = path.dirname(path.resolve(pageFilePath));

  while (true) {
    for (const ext of ['.tsx', '.jsx', '.ts', '.js']) {
      const layoutPath = path.join(current, `layout${ext}`);
      if (fs.existsSync(layoutPath)) {
        layouts.unshift(path.relative(projectRoot, layoutPath));
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
