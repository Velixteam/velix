/**
 * FlexiReact Middleware System
 * 
 * Middlewares run before every request and can:
 * - Modify the request/response
 * - Redirect or rewrite URLs
 * - Add headers
 * - Authenticate users
 * - Log requests
 * 
 * Usage:
 * Create a middleware.js file in your project root:
 * 
 * export default function middleware(request) {
 *   // Return a response to short-circuit
 *   // Return NextResponse.next() to continue
 *   // Return NextResponse.redirect() to redirect
 * }
 * 
 * export const config = {
 *   matcher: ['/protected/:path*']
 * };
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Middleware response helpers
 */
interface MiddlewareResponseOptions {
  type?: string;
  status?: number;
  headers?: Record<string, string>;
  body?: any;
  url?: string | null;
}

export class MiddlewareResponse {
  type: string;
  status: number;
  headers: Map<string, string>;
  body: any;
  url: string | null;

  constructor(options: MiddlewareResponseOptions = {}) {
    this.type = options.type || 'next';
    this.status = options.status || 200;
    this.headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body || null;
    this.url = options.url || null;
  }

  /**
   * Continue to the next middleware/handler
   */
  static next(options = {}) {
    return new MiddlewareResponse({ ...options, type: 'next' });
  }

  /**
   * Redirect to a different URL
   */
  static redirect(url: string, status: number = 302) {
    return new MiddlewareResponse({
      type: 'redirect',
      url,
      status
    });
  }

  /**
   * Rewrite the request to a different URL (internal)
   */
  static rewrite(url: string) {
    return new MiddlewareResponse({
      type: 'rewrite',
      url
    });
  }

  /**
   * Return a JSON response
   */
  static json(data: any, options: { status?: number; headers?: Record<string, string> } = {}) {
    return new MiddlewareResponse({
      type: 'response',
      status: options.status || 200,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data)
    });
  }

  /**
   * Return an HTML response
   */
  static html(content: string, options: { status?: number; headers?: Record<string, string> } = {}) {
    return new MiddlewareResponse({
      type: 'response',
      status: options.status || 200,
      headers: { 'Content-Type': 'text/html', ...options.headers },
      body: content
    });
  }
}

/**
 * Middleware request wrapper
 */
export class MiddlewareRequest {
  raw: any;
  method: string;
  url: string;
  headers: Map<string, string>;
  pathname: string;
  searchParams: URLSearchParams;
  query: Record<string, string>;
  cookies: Map<string, string>;

  constructor(req: any) {
    this.raw = req;
    this.method = req.method;
    this.url = req.url;
    this.headers = new Map(Object.entries(req.headers || {}));
    
    // Parse URL
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    this.pathname = parsedUrl.pathname;
    this.searchParams = parsedUrl.searchParams;
    this.query = Object.fromEntries(parsedUrl.searchParams) as Record<string, string>;
    
    // Parse cookies
    this.cookies = this._parseCookies(req.headers.cookie || '');
  }

  _parseCookies(cookieHeader: string): Map<string, string> {
    const cookies = new Map<string, string>();
    if (!cookieHeader) return cookies;
    
    cookieHeader.split(';').forEach((cookie: string) => {
      const [name, ...rest] = cookie.split('=');
      if (name) {
        cookies.set(name.trim(), rest.join('=').trim());
      }
    });
    
    return cookies;
  }

  /**
   * Get a header value
   */
  header(name: string): string | undefined {
    return this.headers.get(name.toLowerCase());
  }

  /**
   * Get a cookie value
   */
  cookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  /**
   * Check if request matches a path pattern
   */
  matches(pattern: string): boolean {
    return matchPath(this.pathname, pattern);
  }
}

/**
 * Loads middleware from project
 */
export async function loadMiddleware(projectRoot: string) {
  const middlewarePath = path.join(projectRoot, 'middleware.js');
  
  if (!fs.existsSync(middlewarePath)) {
    return null;
  }

  try {
    const url = pathToFileURL(middlewarePath).href;
    const module = await import(`${url}?t=${Date.now()}`);
    
    return {
      handler: module.default,
      config: module.config || {}
    };
  } catch (error) {
    console.error('Failed to load middleware:', error);
    return null;
  }
}

/**
 * Runs middleware chain
 */
export async function runMiddleware(req: any, res: any, middleware: any) {
  if (!middleware) {
    return { continue: true };
  }

  const { handler, config } = middleware;
  const request = new MiddlewareRequest(req);

  // Check if request matches middleware patterns
  if (config.matcher) {
    const patterns = Array.isArray(config.matcher) ? config.matcher : [config.matcher];
    const matches = patterns.some((pattern: string) => matchPath(request.pathname, pattern));
    
    if (!matches) {
      return { continue: true };
    }
  }

  try {
    const response = await handler(request);

    if (!response || response.type === 'next') {
      // Apply any headers from middleware
      if (response?.headers) {
        for (const [key, value] of response.headers) {
          res.setHeader(key, value);
        }
      }
      return { continue: true };
    }

    if (response.type === 'redirect') {
      res.writeHead(response.status, { Location: response.url });
      res.end();
      return { continue: false };
    }

    if (response.type === 'rewrite') {
      // Modify the request URL internally
      req.url = response.url;
      return { continue: true, rewritten: true };
    }

    if (response.type === 'response') {
      // Apply headers
      for (const [key, value] of response.headers) {
        res.setHeader(key, value);
      }
      res.writeHead(response.status);
      res.end(response.body);
      return { continue: false };
    }

    return { continue: true };

  } catch (error) {
    console.error('Middleware error:', error);
    return { continue: true, error };
  }
}

/**
 * Matches a path against a pattern
 */
function matchPath(pathname: string, pattern: string): boolean {
  // Convert pattern to regex
  let regex = pattern
    .replace(/\*/g, '.*')
    .replace(/:path\*/g, '.*')
    .replace(/:(\w+)/g, '[^/]+');
  
  regex = `^${regex}$`;
  
  return new RegExp(regex).test(pathname);
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(...middlewares: Array<(request: MiddlewareRequest) => Promise<MiddlewareResponse | null>>) {
  return async (request: MiddlewareRequest) => {
    for (const middleware of middlewares) {
      const response = await middleware(request);
      
      if (response && response.type !== 'next') {
        return response;
      }
    }
    
    return MiddlewareResponse.next();
  };
}

/**
 * Built-in middleware helpers
 */
export const middlewares = {
  /**
   * CORS middleware
   */
  cors(options: { origin?: string; methods?: string; headers?: string; credentials?: boolean } = {}) {
    const {
      origin = '*',
      methods = 'GET,HEAD,PUT,PATCH,POST,DELETE',
      headers = 'Content-Type,Authorization',
      credentials = false
    } = options;

    return (request: MiddlewareRequest) => {
      const response = MiddlewareResponse.next({
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': methods,
          'Access-Control-Allow-Headers': headers,
          ...(credentials && { 'Access-Control-Allow-Credentials': 'true' })
        }
      });

      // Handle preflight
      if (request.method === 'OPTIONS') {
        return MiddlewareResponse.json({}, { status: 204, headers: Object.fromEntries(response.headers) });
      }

      return response;
    };
  },

  /**
   * Basic auth middleware
   */
  basicAuth(options: { username: string; password: string; realm?: string }) {
    const { username, password, realm = 'Protected' } = options;
    const expected = Buffer.from(`${username}:${password}`).toString('base64');

    return (request: MiddlewareRequest) => {
      const auth = request.header('authorization');
      
      if (!auth || !auth.startsWith('Basic ')) {
        return MiddlewareResponse.html('Unauthorized', {
          status: 401,
          headers: { 'WWW-Authenticate': `Basic realm="${realm}"` }
        });
      }

      const provided = auth.slice(6);
      if (provided !== expected) {
        return MiddlewareResponse.html('Unauthorized', { status: 401 });
      }

      return MiddlewareResponse.next();
    };
  },

  /**
   * Rate limiting middleware
   */
  rateLimit(options: { windowMs?: number; max?: number } = {}) {
    const { windowMs = 60000, max = 100 } = options;
    const requests = new Map();

    return (request: MiddlewareRequest) => {
      const ip = request.header('x-forwarded-for') || 'unknown';
      const now = Date.now();
      
      // Clean old entries
      for (const [key, data] of requests) {
        if (now - data.start > windowMs) {
          requests.delete(key);
        }
      }

      // Check rate limit
      const data = requests.get(ip) || { count: 0, start: now };
      data.count++;
      requests.set(ip, data);

      if (data.count > max) {
        return MiddlewareResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      }

      return MiddlewareResponse.next({
        headers: {
          'X-RateLimit-Limit': String(max),
          'X-RateLimit-Remaining': String(max - data.count)
        }
      });
    };
  },

  /**
   * Logging middleware
   */
  logger(options: { format?: string } = {}) {
    const { format = 'combined' } = options;

    return (request: MiddlewareRequest) => {
      const start = Date.now();
      const { method, pathname } = request;
      
      console.log(`→ ${method} ${pathname}`);
      
      return MiddlewareResponse.next();
    };
  }
};

export default {
  MiddlewareRequest,
  MiddlewareResponse,
  loadMiddleware,
  runMiddleware,
  composeMiddleware,
  middlewares
};
