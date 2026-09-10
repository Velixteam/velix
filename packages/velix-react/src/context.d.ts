/**
 * Velix v5 Context System
 * Provides request context and shared state for SSR
 */
import React from 'react';
interface RouteContextType {
    params: Record<string, string>;
    query: Record<string, string>;
    pathname: string;
}
interface RequestContextType {
    req: import('http').IncomingMessage;
    res: import('http').ServerResponse;
    params: Record<string, string>;
    query: Record<string, string>;
    url: string | undefined;
    method: string | undefined;
    headers: import('http').IncomingHttpHeaders;
    cookies: Record<string, string>;
}
export declare const RequestContext: React.Context<RequestContextType | null>;
export declare const RouteContext: React.Context<RouteContextType | null>;
interface LayoutContextType {
    children: React.ReactNode;
    params?: Record<string, string>;
}
export declare const LayoutContext: React.Context<LayoutContextType | null>;
/**
 * Creates a request context value
 */
export declare function createRequestContext(req: import('http').IncomingMessage, res: import('http').ServerResponse, params?: Record<string, string>, query?: Record<string, string>): {
    req: import("http").IncomingMessage;
    res: import("http").ServerResponse<import("http").IncomingMessage>;
    params: Record<string, string>;
    query: Record<string, string>;
    url: string | undefined;
    method: string | undefined;
    headers: import("http").IncomingHttpHeaders;
    cookies: Record<string, string>;
};
/**
 * Hook to access request context (server-side only)
 */
export declare function useRequest(): RequestContextType;
/**
 * Hook to access route params
 */
export declare function useParams(): Record<string, string>;
/**
 * Hook to access query parameters
 */
export declare function useQuery(): Record<string, string>;
/**
 * Hook to access current pathname
 */
export declare function usePathname(): string;
export {};
//# sourceMappingURL=context.d.ts.map