import fs from 'fs';
import path from 'path';
import type { Route, RouteTree, RouteTreeNode } from '../types.js';
import { RouteType } from './types.js';
import { scanAppDirectory, scanApiDirectory } from './scanner.js';
import { buildTree, findRouteLayouts } from './tree-builder.js';
import { matchRoute } from './matcher.js';
import { createRoutePattern } from './parser.js';

/**
 * Velix v5 Router
 * File-based routing using the app/ directory convention
 */

/**
 * Builds the complete route tree from the app/ directory asynchronously
 */
export async function buildRouteTree(appDir: string) {
  const projectRoot = path.dirname(appDir);

  const routes: {
    pages: Route[];
    api: Route[];
    layouts: Map<string, string>;
    tree: RouteTreeNode;
    appRoutes: Route[];
    rootLayout?: string;
  } = {
    pages: [],
    api: [],
    layouts: new Map(),
    tree: { children: {}, routes: [] },
    appRoutes: [],
  };

  // Scan app/ directory
  if (fs.existsSync(appDir)) {
    routes.appRoutes = await scanAppDirectory(appDir, appDir);
  }

  // Scan server/api/ for API routes
  const serverApiDir = path.join(projectRoot, 'server', 'api');
  if (fs.existsSync(serverApiDir)) {
    routes.api = await scanApiDirectory(serverApiDir, serverApiDir);
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

export { RouteType, matchRoute, findRouteLayouts, createRoutePattern };

export default {
  buildRouteTree,
  matchRoute,
  findRouteLayouts,
  RouteType,
  createRoutePattern
};
