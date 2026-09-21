import type { Route, RouteTreeNode } from '../types.js';
/**
 * Finds all layouts that apply to a route
 */
export declare function findRouteLayouts(route: Route, layoutsMap: Map<string, string>): Array<{
    name: string;
    filePath: string | undefined;
}>;
/**
 * Builds route tree for nested routes
 */
export declare function buildTree(routes: Route[]): RouteTreeNode;
//# sourceMappingURL=tree-builder.d.ts.map