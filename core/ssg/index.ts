/**
 * FlexiReact Static Site Generation (SSG)
 * 
 * SSG pre-renders pages at build time, generating static HTML files.
 * This provides the fastest possible page loads and enables CDN caching.
 * 
 * Usage:
 * - Export getStaticProps() from a page to fetch data at build time
 * - Export getStaticPaths() for dynamic routes to specify which paths to pre-render
 * - Pages without these exports are rendered as static HTML
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { renderPage } from '../render/index.js';
import { ensureDir, cleanDir } from '../utils.js';

/**
 * SSG Build Result
 */
interface SSGPage {
  path: string;
  file: string;
  size: number;
}

interface SSGError {
  path: string;
  error: string;
}

export class SSGResult {
  pages: SSGPage[];
  errors: SSGError[];
  duration: number;

  constructor() {
    this.pages = [];
    this.errors = [];
    this.duration = 0;
  }

  addPage(pagePath: string, file: string, size: number) {
    this.pages.push({ path: pagePath, file, size });
  }

  addError(pagePath: string, error: Error) {
    this.errors.push({ path: pagePath, error: error.message });
  }

  get success() {
    return this.errors.length === 0;
  }

  get totalSize() {
    return this.pages.reduce((sum, p) => sum + p.size, 0);
  }
}

/**
 * Generates static pages for all routes
 */
export async function generateStaticSite(options: any) {
  const {
    routes,
    outDir,
    config,
    loadModule
  } = options;

  const result = new SSGResult();
  const startTime = Date.now();

  // Clean and create output directory
  const staticDir = path.join(outDir, 'static');
  cleanDir(staticDir);

  console.log('\n📦 Generating static pages...\n');

  for (const route of routes) {
    try {
      await generateRoutePage(route, staticDir, loadModule, result, config);
    } catch (error: any) {
      console.error(`  ✗ ${route.path}: ${error.message}`);
      result.addError(route.path, error as Error);
    }
  }

  result.duration = Date.now() - startTime;

  // Generate summary
  console.log('\n' + '─'.repeat(50));
  console.log(`  Generated ${result.pages.length} pages in ${result.duration}ms`);
  if (result.errors.length > 0) {
    console.log(`  ${result.errors.length} errors occurred`);
  }
  console.log('─'.repeat(50) + '\n');

  return result;
}

/**
 * Generates a single route's static page(s)
 */
async function generateRoutePage(route: any, outDir: string, loadModule: any, result: SSGResult, config: any) {
  const module = await loadModule(route.filePath);
  const Component = module.default;

  if (!Component) {
    throw new Error(`No default export in ${route.filePath}`);
  }

  // Check for getStaticPaths (dynamic routes)
  let paths = [{ params: {} }];
  
  if (route.path.includes(':') || route.path.includes('*')) {
    if (!module.getStaticPaths) {
      console.log(`  ⊘ ${route.path} (dynamic, no getStaticPaths)`);
      return;
    }

    const staticPaths = await module.getStaticPaths();
    paths = staticPaths.paths || [];

    if (staticPaths.fallback === false && paths.length === 0) {
      console.log(`  ⊘ ${route.path} (no paths to generate)`);
      return;
    }
  }

  // Generate page for each path
  for (const pathConfig of paths) {
    const params = pathConfig.params || {};
    const actualPath = substituteParams(route.path, params);

    try {
      // Get static props
      let props = { params };
      
      if (module.getStaticProps) {
        const staticProps = await module.getStaticProps({ params });
        
        if (staticProps.notFound) {
          console.log(`  ⊘ ${actualPath} (notFound)`);
          continue;
        }
        
        if (staticProps.redirect) {
          // Generate redirect HTML
          await generateRedirectPage(actualPath, staticProps.redirect, outDir, result);
          continue;
        }
        
        props = { ...props, ...staticProps.props };
      }

      // Render the page
      const html = await renderPage({
        Component,
        props,
        title: module.title || module.metadata?.title || 'FlexiReact App',
        meta: module.metadata || {},
        isSSG: true
      });

      // Write to file
      const filePath = getOutputPath(actualPath, outDir);
      ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, html);

      const size = Buffer.byteLength(html, 'utf8');
      result.addPage(actualPath, filePath, size);
      
      console.log(`  ✓ ${actualPath} (${formatSize(size)})`);

    } catch (error: any) {
      result.addError(actualPath, error as Error);
      console.error(`  ✗ ${actualPath}: ${error.message}`);
    }
  }
}

/**
 * Generates a redirect page
 */
async function generateRedirectPage(fromPath: string, redirect: any, outDir: string, result: SSGResult) {
  const { destination, permanent = false } = redirect;
  const statusCode = permanent ? 301 : 302;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${destination}">
  <link rel="canonical" href="${destination}">
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="${destination}">${destination}</a></p>
  <script>window.location.href = "${destination}";</script>
</body>
</html>`;

  const filePath = getOutputPath(fromPath, outDir);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, html);

  const size = Buffer.byteLength(html, 'utf8');
  result.addPage(fromPath, filePath, size);
  
  console.log(`  ↪ ${fromPath} → ${destination}`);
}

/**
 * Substitutes route params into path
 */
function substituteParams(routePath: string, params: Record<string, any>): string {
  let result = routePath;
  
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
    result = result.replace(`*${key}`, value);
  }
  
  return result;
}

/**
 * Gets the output file path for a route
 */
function getOutputPath(routePath: string, outDir: string): string {
  if (routePath === '/') {
    return path.join(outDir, 'index.html');
  }
  
  // Remove leading slash and add index.html
  const cleanPath = routePath.replace(/^\//, '');
  return path.join(outDir, cleanPath, 'index.html');
}

/**
 * Formats file size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Incremental Static Regeneration (ISR) support
 * Allows pages to be regenerated after a specified interval
 */
interface ISRCacheEntry {
  html: string;
  generatedAt: number;
  revalidateAfter: number | null;
}

export class ISRManager {
  cache: Map<string, ISRCacheEntry>;
  revalidating: Set<string>;
  defaultRevalidate: number;

  constructor(options: { defaultRevalidate?: number } = {}) {
    this.cache = new Map();
    this.revalidating = new Set();
    this.defaultRevalidate = options.defaultRevalidate || 60; // seconds
  }

  /**
   * Gets a cached page or regenerates it
   */
  async getPage(routePath: string, generator: () => Promise<{ html: string; revalidate?: number }>) {
    const cached = this.cache.get(routePath);
    const now = Date.now();

    if (cached) {
      // Check if revalidation is needed
      if (cached.revalidateAfter && now > cached.revalidateAfter) {
        // Trigger background revalidation
        this.revalidateInBackground(routePath, generator);
      }
      return cached.html;
    }

    // Generate fresh page
    const result = await generator();
    this.cache.set(routePath, {
      html: result.html,
      generatedAt: now,
      revalidateAfter: result.revalidate 
        ? now + (result.revalidate * 1000)
        : null
    });

    return result.html;
  }

  /**
   * Revalidates a page in the background
   */
  async revalidateInBackground(routePath: string, generator: () => Promise<{ html: string; revalidate?: number }>) {
    if (this.revalidating.has(routePath)) return;

    this.revalidating.add(routePath);

    try {
      const result = await generator();
      const now = Date.now();
      
      this.cache.set(routePath, {
        html: result.html,
        generatedAt: now,
        revalidateAfter: result.revalidate 
          ? now + (result.revalidate * 1000)
          : null
      });
    } catch (error) {
      console.error(`ISR revalidation failed for ${routePath}:`, error);
    } finally {
      this.revalidating.delete(routePath);
    }
  }

  /**
   * Invalidates a cached page
   */
  invalidate(routePath: string) {
    this.cache.delete(routePath);
  }

  /**
   * Clears all cached pages
   */
  clear() {
    this.cache.clear();
  }
}

export default {
  generateStaticSite,
  SSGResult,
  ISRManager
};
