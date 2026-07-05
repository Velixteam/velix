import type { Route } from '../types.js';
import { extractParams } from './parser.js';
import type { RouteMatch } from './types.js';

/**
 * Matches URL path against routes
 */
export function matchRoute(urlPath: string, routes: Route[]): RouteMatch | null {
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
