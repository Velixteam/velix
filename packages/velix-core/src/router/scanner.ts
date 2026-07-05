import fs from 'fs';
import path from 'path';
import { isServerComponent, isClientComponent, isIsland } from '../utils.js';
import type { Route } from '../types.js';
import { RouteType } from './types.js';
import { createRoutePattern } from './parser.js';

/**
 * Scans app/ directory for file-based routing asynchronously
 * Supports: page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx, [param].tsx
 */
export async function scanAppDirectory(
  baseDir: string,
  currentDir: string,
  parentSegments: string[] = [],
  parentLayout: string | null = null,
  parentMiddleware: string | null = null
): Promise<Route[]> {
  const routes: Route[] = [];
  const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

  // Find special files in current directory
  const specialFiles: Record<string, string | null> = {
    page: null,
    layout: null,
    loading: null,
    error: null,
    notFound: null,
    template: null,
    middleware: null
  };

  for (const entry of entries) {
    if (entry.isFile()) {
      const name = entry.name.replace(/\.(jsx|js|tsx|ts)$/, '');
      const fullPath = path.join(currentDir, entry.name);
      const ext = path.extname(entry.name);

      // Only process relevant extensions
      if (!['.tsx', '.jsx', '.ts', '.js'].includes(ext)) continue;

      if (name === 'page') specialFiles.page = fullPath;
      if (name === 'layout') specialFiles.layout = fullPath;
      if (name === 'loading') specialFiles.loading = fullPath;
      if (name === 'error') specialFiles.error = fullPath;
      if (name === 'not-found') specialFiles.notFound = fullPath;
      if (name === 'template') specialFiles.template = fullPath;
      if (name === 'middleware' || name === '_middleware') specialFiles.middleware = fullPath;

      // Handle [param].tsx files directly in app/ (alternative to [param]/page.tsx)
      if (name.startsWith('[') && name.endsWith(']') && ['.tsx', '.jsx'].includes(ext)) {
        const paramName = name.slice(1, -1);
        let segmentName: string;

        if (paramName.startsWith('...')) {
          segmentName = '*' + paramName.slice(3);
        } else {
          segmentName = ':' + paramName;
        }

        const routePath = '/' + [...parentSegments, segmentName].join('/');

        routes.push({
          type: RouteType.PAGE,
          path: routePath.replace(/\/+/g, '/'),
          filePath: fullPath,
          pattern: createRoutePattern(routePath),
          segments: [...parentSegments, segmentName],
          layout: specialFiles.layout || parentLayout,
          loading: specialFiles.loading,
          error: specialFiles.error,
          notFound: specialFiles.notFound,
          template: specialFiles.template,
          middleware: specialFiles.middleware || parentMiddleware,
          isServerComponent: isServerComponent(fullPath),
          isClientComponent: isClientComponent(fullPath),
          isIsland: isIsland(fullPath),
        });
      }
    }
  }

  // If there's a page.tsx, create a route for this directory
  if (specialFiles.page) {
    const routePath = '/' + parentSegments.join('/') || '/';

    routes.push({
      type: RouteType.PAGE,
      path: routePath.replace(/\/+/g, '/') || '/',
      filePath: specialFiles.page,
      pattern: createRoutePattern(routePath || '/'),
      segments: parentSegments,
      layout: specialFiles.layout || parentLayout,
      loading: specialFiles.loading,
      error: specialFiles.error,
      notFound: specialFiles.notFound,
      template: specialFiles.template,
      middleware: specialFiles.middleware || parentMiddleware,
      isServerComponent: isServerComponent(specialFiles.page),
      isClientComponent: isClientComponent(specialFiles.page),
      isIsland: isIsland(specialFiles.page),
    });
  }

  // Recursively scan subdirectories in parallel
  const ignoredDirs = ['node_modules', '.velix', 'dist'];
  const dirPromises = entries
    .filter(entry => 
      entry.isDirectory() && 
      !entry.name.startsWith('_') && 
      !entry.name.startsWith('.') &&
      !ignoredDirs.includes(entry.name)
    )
    .map(async entry => {
      const fullPath = path.join(currentDir, entry.name);

      // Handle route groups (parentheses) — don't add to URL
      const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');

      // Handle dynamic segments [param]
      let segmentName = entry.name;
      if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
        segmentName = ':' + entry.name.slice(1, -1);
        if (entry.name.startsWith('[...')) {
          segmentName = '*' + entry.name.slice(4, -1);
        }
        if (entry.name.startsWith('[[...')) {
          segmentName = '*' + entry.name.slice(5, -2);
        }
      }

      const newSegments = isGroup ? parentSegments : [...parentSegments, segmentName];
      const newLayout = specialFiles.layout || parentLayout;
      const newMiddleware = specialFiles.middleware || parentMiddleware;

      return scanAppDirectory(baseDir, fullPath, newSegments, newLayout, newMiddleware);
    });

  const subRoutes = await Promise.all(dirPromises);
  return routes.concat(...subRoutes);
}

// ============================================================================
// API Directory Scanner (server/api/)
// ============================================================================

export async function scanApiDirectory(
  baseDir: string, 
  currentDir: string, 
  parentSegments: string[] = []
): Promise<Route[]> {
  const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
  const routes: Route[] = [];

  const promises = entries.map(async entry => {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      return scanApiDirectory(baseDir, fullPath, [...parentSegments, entry.name]);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!['.ts', '.js'].includes(ext)) return [];

      const baseName = path.basename(entry.name, ext);
      // route.ts maps to the parent path, other names become segments
      const apiSegments = baseName === 'route' || baseName === 'index'
        ? parentSegments
        : [...parentSegments, baseName];

      const apiPath = '/api/' + apiSegments.join('/');

      return [{
        type: RouteType.API,
        path: apiPath.replace(/\/+/g, '/') || '/api',
        filePath: fullPath,
        pattern: createRoutePattern(apiPath),
        segments: ['api', ...apiSegments].filter(Boolean),
      } as Route];
    }
    return [];
  });

  const subRoutes = await Promise.all(promises);
  return routes.concat(...subRoutes);
}
