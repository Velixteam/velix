import type { Route, RouteTreeNode } from '../types.js';

/**
 * Finds all layouts that apply to a route
 */
export function findRouteLayouts(route: Route, layoutsMap: Map<string, string>): Array<{ name: string; filePath: string | undefined }> {
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

/**
 * Builds route tree for nested routes
 */
export function buildTree(routes: Route[]): RouteTreeNode {
  const tree: RouteTreeNode = { children: {}, routes: [] };

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
