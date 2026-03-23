/**
 * Velix v5 Context System
 * Provides request context and shared state for SSR
 */

import React from 'react';

// Route context type
interface RouteContextType {
  params: Record<string, string>;
  query: Record<string, string>;
  pathname: string;
}

// Server-side request context
export const RequestContext = React.createContext<any>(null);

// Route context for nested routes
export const RouteContext = React.createContext<RouteContextType | null>(null);

// Layout context
export const LayoutContext = React.createContext<any>(null);

/**
 * Creates a request context value
 */
export function createRequestContext(
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
  params: Record<string, string> = {},
  query: Record<string, string> = {}
) {
  return {
    req,
    res,
    params,
    query,
    url: req.url,
    method: req.method,
    headers: req.headers,
    cookies: parseCookies(req.headers.cookie || '')
  };
}

/**
 * Parse cookies from header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie: string) => {
    const [name, ...rest] = cookie.split('=');
    if (name) cookies[name.trim()] = rest.join('=').trim();
  });
  return cookies;
}

/**
 * Hook to access request context (server-side only)
 */
export function useRequest() {
  const context = React.useContext(RequestContext);
  if (!context) throw new Error('useRequest must be used within a RequestContext provider');
  return context;
}

/**
 * Hook to access route params
 */
export function useParams() {
  const context = React.useContext(RouteContext);
  return context?.params || {};
}

/**
 * Hook to access query parameters
 */
export function useQuery() {
  const context = React.useContext(RouteContext);
  return context?.query || {};
}

/**
 * Hook to access current pathname
 */
export function usePathname() {
  const context = React.useContext(RouteContext);
  return context?.pathname || '/';
}
