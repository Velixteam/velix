import type { Route, RouteTreeNode } from '../types.js';
export declare const RouteType: {
    readonly PAGE: "page";
    readonly API: "api";
    readonly LAYOUT: "layout";
    readonly LOADING: "loading";
    readonly ERROR: "error";
    readonly NOT_FOUND: "not-found";
};
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
//# sourceMappingURL=types.d.ts.map