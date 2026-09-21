/**
 * Velix v5 Middleware System
 * Request processing pipeline with composable middleware
 */
export interface MiddlewareRequest {
    url: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
    cookies: Record<string, string>;
    params: Record<string, string>;
    query: Record<string, string>;
    body?: unknown;
    raw: import('http').IncomingMessage;
}
export interface MiddlewareResponse {
    status: (code: number) => MiddlewareResponse;
    header: (name: string, value: string) => MiddlewareResponse;
    json: (data: unknown) => void;
    redirect: (url: string, status?: number) => void;
    rewrite: (url: string) => void;
    next: () => Promise<void>;
    _statusCode: number;
    _headers: Record<string, string>;
    _redirectUrl: string | null;
    _rewriteUrl: string | null;
    _ended: boolean;
}
export type MiddlewareFunction = (req: MiddlewareRequest, res: MiddlewareResponse, next: () => Promise<void>) => void | Promise<void>;
export type MiddlewareResult = {
    continue: boolean;
    rewritten: boolean;
};
export declare const middlewares: {
    cors(options?: {
        origin?: string | string[];
        methods?: string[];
        headers?: string[];
        credentials?: boolean;
        maxAge?: number;
    }): MiddlewareFunction;
    rateLimit(options?: {
        windowMs?: number;
        max?: number;
        message?: string;
    }): MiddlewareFunction;
    security(): MiddlewareFunction;
};
/**
 * Loads proxy middleware from the project root (proxy.ts or proxy.js)
 */
export declare function loadMiddleware(projectRoot: string): Promise<MiddlewareFunction[]>;
/**
 * Runs middleware chain for a request
 */
export declare function runMiddleware(req: import('http').IncomingMessage, res: import('http').ServerResponse, fns: MiddlewareFunction[]): Promise<MiddlewareResult>;
/**
 * Compose multiple middleware into one
 */
export declare function composeMiddleware(...fns: MiddlewareFunction[]): MiddlewareFunction;
//# sourceMappingURL=index.d.ts.map