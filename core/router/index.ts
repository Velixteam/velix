/**
 * FlexiReact Router v2
 * Advanced file-based routing with nested routes, loading, and error boundaries
 * 
 * Supports multiple routing conventions:
 * - pages/     : Traditional file-based routing (index.tsx, about.tsx)
 * - app/       : Next.js style App Router (page.tsx, layout.tsx)
 * - routes/    : FlexiReact v4 routes directory (home.tsx → /, [slug].tsx → /:slug)
 */

import fs from 'fs';
import path from 'path';
import { isServerComponent, isClientComponent, isIsland } from '../utils.js';

/**
 * Route types
 */
export const RouteType = {
  PAGE: 'page',
  API: 'api',
  LAYOUT: 'layout',
  LOADING: 'loading',
  ERROR: 'error',
  NOT_FOUND: 'not-found'
};

/**
 * Builds the complete route tree from all routing directories
 */
export function buildRouteTree(pagesDir: string, layoutsDir: string, appDir: string | null = null, routesDir: string | null = null) {
  const projectRoot = path.dirname(pagesDir);

  const routes: {
    pages: any[];
    api: any[];
    layouts: Map<any, any>;
    tree: Record<string, any>;
    appRoutes: any[];
    flexiRoutes: any[];
    rootLayout?: string;
  } = {
    pages: [],
    api: [],
    layouts: new Map(),
    tree: {},
    appRoutes: [],    // Next.js style app router routes
    flexiRoutes: []   // FlexiReact v4 routes/ directory
  };

  // 1. Scan routes/ directory (FlexiReact v4 - priority)
  const routesDirPath = routesDir || path.join(projectRoot, 'routes');
  if (fs.existsSync(routesDirPath)) {
    scanRoutesDirectory(routesDirPath, routesDirPath, routes);
  }

  // 2. Scan app/ directory (Next.js style App Router)
  const appDirPath = appDir || path.join(projectRoot, 'app');
  if (fs.existsSync(appDirPath)) {
    scanAppDirectory(appDirPath, appDirPath, routes);
  }

  // 3. Scan pages/ directory (traditional routing - fallback)
  if (fs.existsSync(pagesDir)) {
    scanDirectory(pagesDir, pagesDir, routes);
  }

  // 4. Scan layouts/ directory
  if (fs.existsSync(layoutsDir)) {
    scanLayouts(layoutsDir, routes.layouts);
  }

  // 5. Check for root layout in app/ directory
  const rootLayoutPath = path.join(appDirPath, 'layout.tsx');
  const rootLayoutPathJs = path.join(appDirPath, 'layout.jsx');
  if (fs.existsSync(rootLayoutPath)) {
    routes.rootLayout = rootLayoutPath;
  } else if (fs.existsSync(rootLayoutPathJs)) {
    routes.rootLayout = rootLayoutPathJs;
  }

  // Build route tree for nested routes
  routes.tree = buildTree([...routes.flexiRoutes, ...routes.appRoutes, ...routes.pages]);

  return routes;
}

/**
 * Scans routes/ directory for FlexiReact v4 style routing
 * 
 * Convention:
 * - home.tsx → /
 * - about.tsx → /about
 * - blog/index.tsx → /blog
 * - blog/[slug].tsx → /blog/:slug
 * - (public)/home.tsx → / (route group, not in URL)
 * - api/hello.ts → /api/hello (API route)
 * - dashboard/layout.tsx → layout for /dashboard/*
 */
function scanRoutesDirectory(baseDir: string, currentDir: string, routes: any, parentSegments: string[] = [], parentLayout: string | null = null, parentMiddleware: string | null = null) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  // Find special files in current directory
  let layoutFile: string | null = null;
  let loadingFile: string | null = null;
  let errorFile: string | null = null;
  let middlewareFile: string | null = null;

  for (const entry of entries) {
    if (entry.isFile()) {
      const name = entry.name.replace(/\.(jsx|js|tsx|ts)$/, '');
      const fullPath = path.join(currentDir, entry.name);
      const ext = path.extname(entry.name);

      // Special files
      if (name === 'layout') layoutFile = fullPath;
      if (name === 'loading') loadingFile = fullPath;
      if (name === 'error') errorFile = fullPath;
      if (name === '_middleware' || name === 'middleware') middlewareFile = fullPath;

      // Skip special files and non-route files
      if (['layout', 'loading', 'error', 'not-found', '_middleware', 'middleware'].includes(name)) continue;
      if (!['.tsx', '.jsx', '.ts', '.js'].includes(ext)) continue;

      // API routes (in api/ folder or .ts/.js files in api/)
      const relativePath = path.relative(baseDir, currentDir);
      const isApiRoute = relativePath.startsWith('api') || relativePath.startsWith('api/');

      if (isApiRoute && ['.ts', '.js'].includes(ext)) {
        const apiPath = '/' + [...parentSegments, name === 'index' ? '' : name].filter(Boolean).join('/');
        routes.api.push({
          type: RouteType.API,
          path: apiPath.replace(/\/+/g, '/') || '/',
          filePath: fullPath,
          pattern: createRoutePattern(apiPath),
          segments: [...parentSegments, name === 'index' ? '' : name].filter(Boolean)
        });
        continue;
      }

      // Page routes
      if (['.tsx', '.jsx'].includes(ext)) {
        let routePath;

        // home.tsx → /
        if (name === 'home' && parentSegments.length === 0) {
          routePath = '/';
        }
        // index.tsx → parent path
        else if (name === 'index') {
          routePath = '/' + parentSegments.join('/') || '/';
        }
        // [param].tsx → /:param
        else if (name.startsWith('[') && name.endsWith(']')) {
          const paramName = name.slice(1, -1);
          // Handle catch-all [...slug]
          if (paramName.startsWith('...')) {
            routePath = '/' + [...parentSegments, '*' + paramName.slice(3)].join('/');
          } else {
            routePath = '/' + [...parentSegments, ':' + paramName].join('/');
          }
        }
        // regular.tsx → /regular
        else {
          routePath = '/' + [...parentSegments, name].join('/');
        }

        routes.flexiRoutes.push({
          type: RouteType.PAGE,
          path: routePath.replace(/\/+/g, '/'),
          filePath: fullPath,
          pattern: createRoutePattern(routePath),
          segments: routePath.split('/').filter(Boolean),
          layout: layoutFile || parentLayout,
          loading: loadingFile,
          error: errorFile,
          middleware: middlewareFile || parentMiddleware,
          isFlexiRouter: true,
          isServerComponent: isServerComponent(fullPath),
          isClientComponent: isClientComponent(fullPath),
          isIsland: isIsland(fullPath)
        });
      }
    }
  }

  // Recursively scan subdirectories
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(currentDir, entry.name);
      const dirName = entry.name;

      // Skip special directories
      if (dirName.startsWith('_') || dirName.startsWith('.')) continue;

      // Handle route groups (parentheses) - don't add to URL
      const isGroup = dirName.startsWith('(') && dirName.endsWith(')');

      // Handle dynamic segments [param]
      let segmentName = dirName;
      if (dirName.startsWith('[') && dirName.endsWith(']')) {
        const paramName = dirName.slice(1, -1);
        if (paramName.startsWith('...')) {
          segmentName = '*' + paramName.slice(3);
        } else {
          segmentName = ':' + paramName;
        }
      }

      const newSegments = isGroup ? parentSegments : [...parentSegments, segmentName];
      const newLayout = layoutFile || parentLayout;
      const newMiddleware = middlewareFile || parentMiddleware;

      scanRoutesDirectory(baseDir, fullPath, routes, newSegments, newLayout, newMiddleware);
    }
  }
}

/**
 * Scans app directory for Next.js style routing
 * Supports: page.tsx, layout.tsx, loading.tsx, error.tsx, not-found.tsx
 */
function scanAppDirectory(baseDir: string, currentDir: string, routes: any, parentSegments: string[] = [], parentLayout: string | null = null, parentMiddleware: string | null = null) {
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

      if (name === 'page') specialFiles.page = fullPath;
      if (name === 'layout') specialFiles.layout = fullPath;
      if (name === 'loading') specialFiles.loading = fullPath;
      if (name === 'error') specialFiles.error = fullPath;
      if (name === 'not-found') specialFiles.notFound = fullPath;
      if (name === 'template') specialFiles.template = fullPath;
      if (name === 'middleware' || name === '_middleware') specialFiles.middleware = fullPath;
    }
  }

  // If there's a page.tsx, create a route
  if (specialFiles.page) {
    const routePath = '/' + parentSegments.join('/') || '/';

    routes.appRoutes.push({
      type: RouteType.PAGE,
      path: routePath.replace(/\/+/g, '/'),
      filePath: specialFiles.page,
      pattern: createRoutePattern(routePath),
      segments: parentSegments,
      layout: specialFiles.layout || parentLayout,
      loading: specialFiles.loading,
      error: specialFiles.error,
      notFound: specialFiles.notFound,
      template: specialFiles.template,
      middleware: specialFiles.middleware || parentMiddleware,
      isAppRouter: true,
      isServerComponent: isServerComponent(specialFiles.page),
      isClientComponent: isClientComponent(specialFiles.page),
      isIsland: isIsland(specialFiles.page)
    });
  }

  // Recursively scan subdirectories
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(currentDir, entry.name);

      // Handle route groups (parentheses) - don't add to URL
      const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');

      // Handle dynamic segments [param]
      let segmentName = entry.name;
      if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
        // Convert [param] to :param
        segmentName = ':' + entry.name.slice(1, -1);
        // Handle catch-all [...param]
        if (entry.name.startsWith('[...')) {
          segmentName = '*' + entry.name.slice(4, -1);
        }
        // Handle optional catch-all [[...param]]
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

/**
 * Scans directory recursively for route files
 */
function scanDirectory(baseDir: string, currentDir: string, routes: any, parentSegments: string[] = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  // First, find special files in current directory
  const specialFiles: Record<string, string | null> = {
    layout: null,
    loading: null,
    error: null,
    notFound: null
  };

  for (const entry of entries) {
    if (entry.isFile()) {
      const name = entry.name.replace(/\.(jsx|js|tsx|ts)$/, '');
      const fullPath = path.join(currentDir, entry.name);

      if (name === 'layout') specialFiles.layout = fullPath;
      if (name === 'loading') specialFiles.loading = fullPath;
      if (name === 'error') specialFiles.error = fullPath;
      if (name === 'not-found' || name === '404') specialFiles.notFound = fullPath;
    }
  }

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      // Handle route groups (parentheses)
      const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
      const newSegments = isGroup ? parentSegments : [...parentSegments, entry.name];

      scanDirectory(baseDir, fullPath, routes, newSegments);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      const baseName = path.basename(entry.name, ext);

      // Skip special files (already processed)
      if (['layout', 'loading', 'error', 'not-found', '404'].includes(baseName)) {
        continue;
      }

      if (['.jsx', '.js', '.tsx', '.ts'].includes(ext)) {
        const isApi = relativePath.startsWith('api' + path.sep) || relativePath.startsWith('api/');

        if (isApi && ['.js', '.ts'].includes(ext)) {
          routes.api.push(createRoute(fullPath, baseDir, specialFiles, RouteType.API));
        } else if (!isApi && ['.jsx', '.tsx'].includes(ext)) {
          routes.pages.push(createRoute(fullPath, baseDir, specialFiles, RouteType.PAGE));
        }
      }
    }
  }
}

/**
 * Creates a route object from file path
 */
function createRoute(filePath: string, baseDir: string, specialFiles: Record<string, string | null>, type: string) {
  const relativePath = path.relative(baseDir, filePath);
  const routePath = filePathToRoute(relativePath);

  return {
    type,
    path: routePath,
    filePath,
    pattern: createRoutePattern(routePath),
    segments: routePath.split('/').filter(Boolean),
    layout: specialFiles.layout,
    loading: specialFiles.loading,
    error: specialFiles.error,
    notFound: specialFiles.notFound,
    isServerComponent: isServerComponent(filePath),
    isClientComponent: isClientComponent(filePath),
    isIsland: isIsland(filePath)
  };
}

/**
 * Scans layouts directory
 */
function scanLayouts(layoutsDir: string, layoutsMap: Map<string, string>) {
  const entries = fs.readdirSync(layoutsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && /\.(jsx|tsx)$/.test(entry.name)) {
      const name = entry.name.replace(/\.(jsx|tsx)$/, '');
      layoutsMap.set(name, path.join(layoutsDir, entry.name));
    }
  }
}

/**
 * Converts file path to route path
 */
function filePathToRoute(filePath: string): string {
  let route = filePath.replace(/\\/g, '/');

  // Remove extension
  route = route.replace(/\.(jsx|js|tsx|ts)$/, '');

  // Convert [param] to :param
  route = route.replace(/\[\.\.\.([^\]]+)\]/g, '*$1'); // Catch-all [...slug]
  route = route.replace(/\[([^\]]+)\]/g, ':$1');

  // Handle index files
  if (route.endsWith('/index')) {
    route = route.slice(0, -6) || '/';
  } else if (route === 'index') {
    route = '/';
  }

  // Handle route groups - remove (groupName) from path
  route = route.replace(/\/?\([^)]+\)\/?/g, '/');

  // Ensure leading slash and clean up
  if (!route.startsWith('/')) {
    route = '/' + route;
  }
  route = route.replace(/\/+/g, '/');

  return route;
}

/**
 * Creates regex pattern for route matching
 */
function createRoutePattern(routePath: string): RegExp {
  let pattern = routePath
    .replace(/\*[^/]*/g, '(.*)') // Catch-all
    .replace(/:[^/]+/g, '([^/]+)') // Dynamic segments
    .replace(/\//g, '\\/');

  return new RegExp(`^${pattern}$`);
}

/**
 * Builds a tree structure for nested routes
 */
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

  // Extract param names from route path
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

/**
 * Finds all layouts that apply to a route
 */
export function findRouteLayouts(route: any, layoutsMap: Map<string, string>): Array<{ name: string; filePath: string | undefined }> {
  const layouts: Array<{ name: string; filePath: string | undefined }> = [];

  // Check for segment-based layouts
  let currentPath = '';
  for (const segment of route.segments) {
    currentPath += '/' + segment;
    const layoutName = segment;

    if (layoutsMap.has(layoutName)) {
      layouts.push({
        name: layoutName,
        filePath: layoutsMap.get(layoutName)
      });
    }
  }

  // Check for route-specific layout
  if (route.layout) {
    layouts.push({
      name: 'route',
      filePath: route.layout
    });
  }

  // Check for root layout
  if (layoutsMap.has('root')) {
    layouts.unshift({
      name: 'root',
      filePath: layoutsMap.get('root')
    });
  }

  return layouts;
}

export default {
  buildRouteTree,
  matchRoute,
  findRouteLayouts,
  RouteType
};
