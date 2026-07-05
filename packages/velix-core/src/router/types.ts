import type { Route, RouteTree as TypedRouteTree, RouteTreeNode } from '../types.js';

export const RouteType = {
  PAGE: 'page',
  API: 'api',
  LAYOUT: 'layout',
  LOADING: 'loading',
  ERROR: 'error',
  NOT_FOUND: 'not-found'
} as const;

export type RouteMatch = Route & {
  params: Record<string, string>;
};

export interface RouteBuilderContext {
  pages: Route[];
  api: Route[];
  layouts: Map<string, string>;
  tree: RouteTreeNode;
  appRoutes: Route[];
  rootLayout?: string;
}
