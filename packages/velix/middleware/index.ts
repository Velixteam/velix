/**
 * Velix v5 Middleware System
 * Request processing pipeline with composable middleware
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface MiddlewareRequest {
  url: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  cookies: Record<string, string>;
  params: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  raw: import('http').IncomingMessage;
}

export interface MiddlewareResponse {
  status: (code: number) => MiddlewareResponse;
  header: (name: string, value: string) => MiddlewareResponse;
  json: (data: any) => void;
  redirect: (url: string, status?: number) => void;
  rewrite: (url: string) => void;
  next: () => Promise<void>;
  _statusCode: number;
  _headers: Record<string, string>;
  _redirectUrl: string | null;
  _rewriteUrl: string | null;
  _ended: boolean;
}

export type MiddlewareFunction = (
  req: MiddlewareRequest,
  res: MiddlewareResponse,
  next: () => Promise<void>
) => void | Promise<void>;

export type MiddlewareResult = {
  continue: boolean;
  rewritten: boolean;
};

// ============================================================================
// Built-in Middleware Registry
// ============================================================================

export const middlewares = {
  cors(options: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
  } = {}): MiddlewareFunction {
    const {
      origin = '*',
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      headers: allowHeaders = ['Content-Type', 'Authorization'],
      credentials = false,
      maxAge = 86400
    } = options;

    return async (req, res, next) => {
      const originHeader = typeof origin === 'string' ? origin : origin.includes(req.headers.origin as string) ? req.headers.origin as string : '';

      res.header('Access-Control-Allow-Origin', originHeader);
      res.header('Access-Control-Allow-Methods', methods.join(', '));
      res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
      res.header('Access-Control-Max-Age', String(maxAge));

      if (credentials) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      if (req.method === 'OPTIONS') {
        res.status(204);
        return;
      }

      await next();
    };
  },

  rateLimit(options: {
    windowMs?: number;
    max?: number;
    message?: string;
  } = {}): MiddlewareFunction {
    const { windowMs = 60000, max = 100, message = 'Too many requests' } = options;
    const store = new Map<string, { count: number; resetTime: number }>();

    return async (req, res, next) => {
      const ip = req.headers['x-forwarded-for'] as string || 'unknown';
      const now = Date.now();
      const record = store.get(ip);

      if (!record || now > record.resetTime) {
        store.set(ip, { count: 1, resetTime: now + windowMs });
      } else if (record.count >= max) {
        res.status(429).json({ error: message });
        return;
      } else {
        record.count++;
      }

      await next();
    };
  },

  security(): MiddlewareFunction {
    return async (_req, res, next) => {
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
      res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      await next();
    };
  },
};

// ============================================================================
// Middleware Loader
// ============================================================================

/**
 * Loads proxy middleware from the project root (proxy.ts or proxy.js)
 */
export async function loadMiddleware(projectRoot: string): Promise<MiddlewareFunction[]> {
  const fns: MiddlewareFunction[] = [];
  const possibleFiles = ['proxy.ts', 'proxy.js'];

  for (const file of possibleFiles) {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) continue;

    try {
      const { pathToFileURL } = await import('url');
      const url = pathToFileURL(filePath).href;
      const mod = await import(`${url}?t=${Date.now()}`);
      const fn = mod.default || mod.proxy || mod.middleware;
      if (typeof fn === 'function') {
        fns.push(fn);
        break; // Only load the first found proxy file
      }
    } catch (err: any) {
      console.warn(`⚠ Failed to load proxy ${file}: ${err.message}`);
    }
  }

  return fns;
}

// ============================================================================
// Middleware Runner
// ============================================================================

/**
 * Runs middleware chain for a request
 */
export async function runMiddleware(
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
  fns: MiddlewareFunction[]
): Promise<MiddlewareResult> {
  const result: MiddlewareResult = { continue: true, rewritten: false };
  if (fns.length === 0) return result;

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(c => {
      const [k, ...v] = c.split('=');
      if (k) cookies[k.trim()] = v.join('=').trim();
    });
  }

  const mReq: MiddlewareRequest = {
    url: req.url || '/',
    method: req.method || 'GET',
    headers: req.headers as Record<string, string>,
    cookies,
    params: {},
    query: Object.fromEntries(url.searchParams),
    raw: req,
  };

  let ended = false;
  const mRes: MiddlewareResponse = {
    _statusCode: 200,
    _headers: {},
    _redirectUrl: null,
    _rewriteUrl: null,
    _ended: false,
    status(code) { this._statusCode = code; return this; },
    header(name, value) { this._headers[name] = value; return this; },
    json(data) {
      this._headers['Content-Type'] = 'application/json';
      res.writeHead(this._statusCode, this._headers);
      res.end(JSON.stringify(data));
      this._ended = true;
      ended = true;
    },
    redirect(url, status = 307) {
      this._redirectUrl = url;
      this._statusCode = status;
      res.writeHead(status, { Location: url, ...this._headers });
      res.end();
      this._ended = true;
      ended = true;
    },
    rewrite(url) {
      this._rewriteUrl = url;
      req.url = url;
      result.rewritten = true;
    },
    async next() { /* handled by chain */ },
  };

  // Run middleware chain
  let index = 0;
  const next = async () => {
    if (ended || index >= fns.length) return;
    const fn = fns[index++];
    await fn(mReq, mRes, next);
  };

  await next();

  // Apply headers that were set
  if (!ended) {
    for (const [key, value] of Object.entries(mRes._headers)) {
      res.setHeader(key, value);
    }
  }

  result.continue = !ended;
  return result;
}

/**
 * Compose multiple middleware into one
 */
export function composeMiddleware(...fns: MiddlewareFunction[]): MiddlewareFunction {
  return async (req, res, next) => {
    let index = 0;
    const run = async () => {
      if (index >= fns.length) { await next(); return; }
      const fn = fns[index++];
      await fn(req, res, run);
    };
    await run();
  };
}
