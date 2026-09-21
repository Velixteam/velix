export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type RouteContext = {
    params: Record<string, string>;
    searchParams: URLSearchParams;
};
export type RouteHandler = (req: Request, ctx: RouteContext) => Response | Promise<Response>;
import { VelixHttpError } from '../server/errors.js';
export { VelixHttpError };
export declare function defineRoute(handler: RouteHandler): RouteHandler;
//# sourceMappingURL=define-route.d.ts.map