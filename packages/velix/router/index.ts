/**
 * Velix v5 Router
 * File-based routing using the app/ directory convention
 *
 * Supports:
 * - app/page.tsx          → /
 * - app/dashboard/page.tsx → /dashboard
 * - app/blog/[slug]/page.tsx → /blog/:slug
 * - app/(group)/page.tsx   → / (route groups)
 * - app/[...slug]/page.tsx  → catch-all routes
 * - layout.tsx, loading.tsx, error.tsx, not-found.tsx
 */

import fs from 'fs';
import path from 'path';
import { isServerComponent, isClientComponent, isIsland } from '../utils.js';

// ============================================================================
// Route Types
// ============================================================================

export const RouteType = {
  PAGE: 'page',
  API: 'api',
  LAYOUT: 'layout',
  LOADING: 'loading',
  ERROR: 'error',
  NOT_FOUND: 'not-found'
} as const;

// ============================================================================
// Build Route Tree
// ============================================================================

/**
 * Builds the complete route tree from the app/ directory
 */
export function buildRouteTree(appDir: string) {
  const projectRoot = path.dirname(appDir);

  const routes: {
    pages: any[];
    api: any[];
    layouts: Map<string, string>;
    tree: Record<string, any>;
    appRoutes: any[];
    rootLayout?: string;
  } = {
    pages: [],
    api: [],
    layouts: new Map(),
    tree: {},
    appRoutes: [],
  };

  // Scan app/ directory
  if (fs.existsSync(appDir)) {
    scanAppDirectory(appDir, appDir, routes);
  }

  // Scan server/api/ for API routes
  const serverApiDir = path.join(projectRoot, 'server', 'api');
  if (fs.existsSync(serverApiDir)) {
    scanApiDirectory(serverApiDir, serverApiDir, routes);
  }

  // Check for root layout
  const rootLayoutTsx = path.join(appDir, 'layout.tsx');
  const rootLayoutJsx = path.join(appDir, 'layout.jsx');
  if (fs.existsSync(rootLayoutTsx)) routes.rootLayout = rootLayoutTsx;
  else if (fs.existsSync(rootLayoutJsx)) routes.rootLayout = rootLayoutJsx;

  // Build route tree for nested routes
  routes.tree = buildTree(routes.appRoutes);

  return routes;
}

// ============================================================================
// App Directory Scanner
// ============================================================================

/**
 * Scans app/ directory for file-based routing
 * Supports: page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx, [param].tsx
 */
function scanAppDirectory(
  baseDir: string,
  currentDir: string,
  routes: any,
  parentSegments: string[] = [],
  parentLayout: string | null = null,
  parentMiddleware: string | null = null
) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

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

        routes.appRoutes.push({
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

    routes.appRoutes.push({
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

  // Recursively scan subdirectories
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(currentDir, entry.name);

      // Skip special directories
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

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

      scanAppDirectory(baseDir, fullPath, routes, newSegments, newLayout, newMiddleware);
    }
  }
}

// ============================================================================
// API Directory Scanner (server/api/)
// ============================================================================

function scanApiDirectory(baseDir: string, currentDir: string, routes: any, parentSegments: string[] = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      scanApiDirectory(baseDir, fullPath, routes, [...parentSegments, entry.name]);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!['.ts', '.js'].includes(ext)) continue;

      const baseName = path.basename(entry.name, ext);
      // route.ts maps to the parent path, other names become segments
      const apiSegments = baseName === 'route' || baseName === 'index'
        ? parentSegments
        : [...parentSegments, baseName];

      const apiPath = '/api/' + apiSegments.join('/');

      routes.api.push({
        type: RouteType.API,
        path: apiPath.replace(/\/+/g, '/') || '/api',
        filePath: fullPath,
        pattern: createRoutePattern(apiPath),
        segments: ['api', ...apiSegments].filter(Boolean),
      });
    }
  }
}

// ============================================================================
// Route Matching
// ============================================================================

/**
 * Creates regex pattern for route matching
 */
function createRoutePattern(routePath: string): RegExp {
  let pattern = routePath
    .replace(/\*[^/]*/g, '(.*)')       // Catch-all
    .replace(/:[^/]+/g, '([^/]+)')     // Dynamic segments
    .replace(/\//g, '\\/');

  return new RegExp(`^${pattern}$`);
}

/**
 * Matches URL path against routes
 */
export function matchRoute(urlPath: string, routes: any[]) {
  const normalizedPath = urlPath === '' ? '/' : urlPath.split('?')[0];

  for (const route of routes) {
    const match = normalizedPath.match(route.pattern);
    if (match) {
      const params = extractParams(route.path, match);
      return { ...route, params };
    }
  }

  return null;
}

/**
 * Extracts parameters from route match
 */
function extractParams(routePath: string, match: RegExpMatchArray): Record<string, string> {
  const params: Record<string, string> = {};
  const paramNames: string[] = [];

  const paramRegex = /:([^/]+)|\*([^/]*)/g;
  let paramMatch;
  while ((paramMatch = paramRegex.exec(routePath)) !== null) {
    paramNames.push(paramMatch[1] || paramMatch[2] || 'splat');
  }

  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });

  return params;
}

// ============================================================================
// Layout Resolution
// ============================================================================

/**
 * Finds all layouts that apply to a route
 */
export function findRouteLayouts(route: any, layoutsMap: Map<string, string>): Array<{ name: string; filePath: string | undefined }> {
  const layouts: Array<{ name: string; filePath: string | undefined }> = [];

  // Check for segment-based layouts
  for (const segment of route.segments) {
    if (layoutsMap.has(segment)) {
      layouts.push({ name: segment, filePath: layoutsMap.get(segment) });
    }
  }

  // Check for route-specific layout
  if (route.layout) {
    layouts.push({ name: 'route', filePath: route.layout });
  }

  // Check for root layout
  if (layoutsMap.has('root')) {
    layouts.unshift({ name: 'root', filePath: layoutsMap.get('root') });
  }

  return layouts;
}

// ============================================================================
// Tree Building
// ============================================================================

function buildTree(routes: any[]): any {
  const tree: any = { children: {}, routes: [] };

  for (const route of routes) {
    let current = tree;
    for (const segment of route.segments) {
      if (!current.children[segment]) {
        current.children[segment] = { children: {}, routes: [] };
      }
      current = current.children[segment];
    }
    current.routes.push(route);
  }

  return tree;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  buildRouteTree,
  matchRoute,
  findRouteLayouts,
  RouteType
};
