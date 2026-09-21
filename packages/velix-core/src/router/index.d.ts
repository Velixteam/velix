import type { Route, RouteTreeNode } from '../types.js';
import { RouteType } from './types.js';
import { findRouteLayouts } from './tree-builder.js';
import { matchRoute } from './matcher.js';
import { createRoutePattern } from './parser.js';
/**
 * Velix v5 Router
 * File-based routing using the app/ directory convention
 */
/**
 * Builds the complete route tree from the app/ directory asynchronously
 */
export declare function buildRouteTree(appDir: string): Promise<{
    pages: Route[];
    api: Route[];
    layouts: Map<string, string>;
    tree: RouteTreeNode;
    appRoutes: Route[];
    rootLayout?: string;
}>;
export { RouteType, matchRoute, findRouteLayouts, createRoutePattern };
declare const _default: {
    buildRouteTree: typeof buildRouteTree;
    matchRoute: typeof matchRoute;
    findRouteLayouts: typeof findRouteLayouts;
    RouteType: {
        readonly PAGE: "page";
        readonly API: "api";
        readonly LAYOUT: "layout";
        readonly LOADING: "loading";
        readonly ERROR: "error";
        readonly NOT_FOUND: "not-found";
    };
    createRoutePattern: typeof createRoutePattern;
};
export default _default;
//# sourceMappingURL=index.d.ts.map