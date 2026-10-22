/**
 * Velix v5 Server
 *
 * Modular HTTP server with SSR, static file serving, API routes,
 * server actions, middleware, and plugin hooks.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire, register } from 'module';
import { pathToFileURL as _pfu } from 'url';

// Register Node module hook for CSS and assets so SSR imports never fail and never write temp files
try {
  if (typeof register === 'function') {
    const loaderCode = `
      export async function resolve(specifier, context, nextResolve) {
        if (/\\.(css|scss|less|sass|svg|png|jpg|jpeg|gif|webp|ico)(\\?.*)?$/i.test(specifier)) {
          const parent = context.parentURL || 'file://' + process.cwd() + '/';
          return {
            url: new URL(specifier, parent).href,
            shortCircuit: true,
          };
        }
        return nextResolve(specifier, context);
      }
      export async function load(url, context, nextLoad) {
        if (/\\.(css|scss|less|sass|svg|png|jpg|jpeg|gif|webp|ico)(\\?.*)?$/i.test(url)) {
          return {
            format: 'module',
            shortCircuit: true,
            source: 'export default {};',
          };
        }
        return nextLoad(url, context);
      }
    `;
    const loaderUrl = 'data:text/javascript;base64,' + Buffer.from(loaderCode).toString('base64');
    register(loaderUrl, import.meta.url);
  }
} catch {
  // Ignore if already registered or unsupported
}

// Load React from the project root to avoid duplicate-React-instance errors
const _projectRequire = createRequire(_pfu(path.join(process.cwd(), 'package.json')).href);
const React = _projectRequire('react') as typeof import('react');
const { renderToString } = _projectRequire('react-dom/server') as typeof import('react-dom/server');
import { loadConfig, resolvePaths, type VelixConfig } from '../config.js';
import { buildRouteTree, matchRoute } from '../router/index.js';
import { runMiddleware, loadMiddleware, type MiddlewareFunction } from '../middleware/index.js';
import { pluginManager, loadPlugins, PluginHooks, builtinPlugins } from '../plugins/index.js';
import tailwindPlugin from '../plugins/tailwind.js';
import { generateMetadataTags, generateSitemap, generateRobotsTxt } from '../metadata/index.js';
import { getRegisteredIslands, generateAdvancedHydrationScript } from '../islands/index.js';
import type { Route } from '../types.js';
import { executeAction, deserializeArgs } from '../actions/index.js';
import logger from '../logger.js';
import esbuild from 'esbuild';
import { generateDevToolsHtml } from './devtools.js';
import { VERSION } from '../version.js';
import { generate404Page, generate500Page } from './error-pages.js';

export {
  defineRoute,
  VelixHttpError,
  defineLoader,
  serverAction,
  buildApiManifest,
  handleApiRequest,
  loadAssetManifest,
  type VelixManifest,
} from '@teamvelix/velix-core';
import { loadAssetManifest, type VelixManifest } from '@teamvelix/velix-core';


function getProjectVersion(dep: string, projectRoot: string): string {
  try {
    const projectRequire = createRequire(pathToFileURL(path.join(projectRoot, 'package.json')).href);
    return projectRequire(`${dep}/package.json`).version;
  } catch (e) {
    try {
      const selfRequire = createRequire(import.meta.url);
      return selfRequire(`${dep}/package.json`).version;
    } catch (e2) {
      return '—';
    }
  }
}

// ============================================================================
// MIME Types
// ============================================================================

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.map': 'application/json',
};

// ============================================================================
// Server
// ============================================================================

export interface VelixServer {
  server: http.Server;
  config: VelixConfig;
  close: () => void;
}

export async function createServer(options: {
  projectRoot?: string;
  mode?: 'development' | 'production';
} = {}): Promise<VelixServer> {
  const projectRoot = options.projectRoot || process.cwd();
  const mode = options.mode || (process.env.NODE_ENV as 'development' | 'production' | undefined) || 'development';
  const isDev = mode === 'development';

  // Load configuration
  const rawConfig = await loadConfig(projectRoot);
  const config = resolvePaths(rawConfig, projectRoot);

  // Load plugins
  await loadPlugins(projectRoot, config);

  // Plugin hook: config loaded (allow plugins to modify config)
  await pluginManager.runHook(PluginHooks.CONFIG, config);

  // Load middleware
  const middlewareFns = await loadMiddleware(projectRoot);

  // Build route tree
  const appDir = (config as unknown as { resolvedAppDir?: string }).resolvedAppDir || path.join(projectRoot, 'app');
  const outDir = (config as unknown as { resolvedOutDir?: string }).resolvedOutDir || path.join(projectRoot, 'dist');
  const routes = buildRouteTree(appDir);

  // Load manifest strictly (deterministic, fails loudly in production)
  const manifest = await loadAssetManifest(isDev ? 'development' : 'production', projectRoot, {
    outDir,
    appDir,
    config: rawConfig,
  });

  // Plugin hook: routes loaded
  await pluginManager.runHook(PluginHooks.ROUTES_LOADED, routes);

  const startTime = Date.now();

  // Plugin hook: server starting
  await pluginManager.runHook(PluginHooks.SERVER_START, { config, isDev, projectRoot }, isDev);

  const server = http.createServer(async (req, res) => {
    const requestStart = Date.now();
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    try {
      // Run middleware
      if (middlewareFns.length > 0) {
        const middlewareResult = await runMiddleware(req, res, middlewareFns);
        if (!middlewareResult.continue) return;
      }

      // Plugin hook: request
      await pluginManager.runHook(PluginHooks.REQUEST, req, res);

      // ── Auto-generated SEO routes ──
      if (pathname === '/sitemap.xml' && config.seo.sitemap) {
        const baseUrl = config.app.url || `http://${config.server.host}:${config.server.port}`;
        const sitemap = generateSitemap(routes.appRoutes, baseUrl);
        res.writeHead(200, { 'Content-Type': 'application/xml' });
        res.end(sitemap);
        return;
      }

      if (pathname === '/robots.txt' && config.seo.robots) {
        const baseUrl = config.app.url || `http://${config.server.host}:${config.server.port}`;
        const robotsTxt = generateRobotsTxt(baseUrl);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(robotsTxt);
        return;
      }

      // ── Server actions ──
      if (pathname === '/__velix/action' && req.method === 'POST') {
        await handleServerAction(req, res);
        return;
      }

      // ── Velix internal assets ──
      if (pathname === '/__velix/image') {
        const { handleImageOptimization } = await import('./image-optimizer.js');
        await handleImageOptimization(req, res, projectRoot);
        return;
      }

      if (pathname.startsWith('/__velix/')) {
        await serveVelixInternal(pathname, req, res, projectRoot, isDev);
        return;
      }

      // ── Static files ──
      if (isDev) {
        const publicDir = (config as unknown as { resolvedPublicDir?: string }).resolvedPublicDir || path.join(projectRoot, 'public');
        if (await serveStaticFile(pathname, publicDir, res, isDev)) {
          logger.request(req.method || 'GET', pathname, 200, Date.now() - requestStart, { type: 'static' });
          return;
        }
      } else {
        // Production: serve dist/client and dist/public ONLY
        if (pathname.startsWith('/client/')) {
          const clientRel = pathname.replace(/^\/client\//, '');
          if (await serveStaticFile(clientRel, path.join(outDir, 'client'), res, isDev)) {
            return;
          }
        } else {
          if (await serveStaticFile(pathname, path.join(outDir, 'public'), res, isDev)) {
            return;
          }
        }
      }

      // ── API routes ──
      const apiMatch = matchRoute(pathname, routes.api);
      if (apiMatch) {
        await handleApiRoute(apiMatch, req, res, url);
        if (isDev) logger.request(req.method || 'GET', pathname, res.statusCode, Date.now() - requestStart, { type: 'api' });
        return;
      }

      // ── Page routes (SSR) ──
      const pageMatch = matchRoute(pathname, routes.appRoutes);
      if (pageMatch) {
        await handlePageRoute(pageMatch, routes, req, res, url, config, isDev, projectRoot, manifest);
        if (isDev) logger.request(req.method || 'GET', pathname, res.statusCode, Date.now() - requestStart, { type: 'ssr' });
        return;
      }

      // ── 404 ──
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(generate404Page(pathname));
      if (isDev) logger.request(req.method || 'GET', pathname, 404, Date.now() - requestStart);

    } catch (error: unknown) {
      const err = error as Error;
      console.error('Server error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(generate500Page({
          statusCode: 500,
          title: 'Server Error',
          message: err.message || 'An unexpected error occurred',
          stack: isDev ? err.stack : undefined,
          isDev,
          pathname
        }));
      }
    }
  });

  if (isDev) {
    const { createHMRServer } = await import('@teamvelix/velix-core');
    const hmr = createHMRServer(server as any, projectRoot);
    (server as unknown as { broadcastHMR: (msg: any) => void }).broadcastHMR = (msg) => {
      hmr.broadcast(msg);
    };
  }

  // Start listening
  const port = config.server.port;
  const host = config.server.host;

  server.listen(port, host, () => {
    logger.serverStart({ port, host, mode, pagesDir: appDir }, startTime);

    // Log routes in dev mode
    if (isDev) {
      routes.appRoutes.forEach(r => {
        const type = r.path.includes(':') || r.path.includes('*') ? 'dynamic' : 'static';
        logger.route(r.path, type);
      });
      routes.api.forEach(r => logger.route(r.path, 'api'));
      logger.blank();
    }
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.portInUse(port);
      process.exit(1);
    }
    throw err;
  });

  return {
    server,
    config: rawConfig,
    close: () => server.close()
  };
}

// ============================================================================
// SSR Module Import (handles CSS imports gracefully with production caching)
// ============================================================================

const ssrModuleCache = new Map<string, unknown>();

async function importModuleSSR(filePath: string, isDev: boolean = false): Promise<unknown> {
  if (!isDev && process.env.NODE_ENV === 'production') {
    if (ssrModuleCache.has(filePath)) {
      return ssrModuleCache.get(filePath);
    }
  }

  const fileUrl = pathToFileURL(filePath).href;
  const importUrl = isDev ? `${fileUrl}?t=${Date.now()}` : fileUrl;

  try {
    const mod = await import(importUrl);
    if (!isDev && process.env.NODE_ENV === 'production') {
      ssrModuleCache.set(filePath, mod);
    }
    return mod;
  } catch (err) {
    throw err;
  }
}

// ============================================================================
// Layout Resolution (Next.js-style: root layout wraps all pages)
// ============================================================================

function collectLayouts(pageFilePath: string, appDir: string): string[] {
  const layouts: string[] = [];
  const normalizedAppDir = path.resolve(appDir);
  let current = path.dirname(path.resolve(pageFilePath));

  while (true) {
    for (const ext of ['.tsx', '.jsx', '.ts', '.js']) {
      const layoutPath = path.join(current, `layout${ext}`);
      if (fs.existsSync(layoutPath)) {
        layouts.unshift(layoutPath); // root-first order
        break;
      }
    }
    if (path.resolve(current) === normalizedAppDir) break;
    const parent = path.dirname(current);
    if (parent === current) break; // filesystem root
    current = parent;
  }

  return layouts;
}

async function renderComponentAsync(Component: unknown, props: Record<string, unknown>): Promise<React.ReactElement> {
  let element = React.createElement(Component as React.ComponentType<Record<string, unknown>>, props);
  if (typeof Component === 'function') {
    try {
      const result = (Component as (props: Record<string, unknown>) => React.ReactElement | Promise<React.ReactElement>)(props);
      if (result instanceof Promise) {
        element = await result as any;
      }
    } catch (e) {
      // Fallback to createElement result
    }
  }
  return element;
}

// ============================================================================
// Handlers
// ============================================================================

async function serveStaticFile(pathname: string, publicDir: string, res: http.ServerResponse, isDev: boolean = false): Promise<boolean> {
  const filePath = path.join(publicDir, pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(publicDir)) return false;

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return false;

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);

  // Hashed files (chunks, tailwind.[hash].css) are immutable. Unhashed files must revalidate.
  const isHashed = /[.-][a-f0-9]{8,}\./i.test(pathname) || /chunks\/.*-[a-f0-9]{8,}/i.test(pathname);
  const cacheControl = isDev
    ? 'no-store, no-cache, must-revalidate'
    : (isHashed
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate');

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': content.length,
    'Cache-Control': cacheControl,
  });
  res.end(content);
  return true;
}

async function handleApiRoute(route: { filePath: string, params?: Record<string, string> }, req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
  try {
    const fileUrl = pathToFileURL(route.filePath).href;
    const mod = await import(`${fileUrl}?t=${Date.now()}`);
    const method = req.method?.toUpperCase() || 'GET';
    const handler = mod[method] || mod.default;

    if (!handler) {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let rawBody: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      rawBody = await parseRawBody(req);
    }

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (Array.isArray(val)) val.forEach(v => headers.append(key, v));
      else if (val) headers.set(key, val);
    }

    const reqInit: RequestInit = { method, headers };
    if (rawBody !== undefined) reqInit.body = rawBody;

    const request = new Request(url.href, reqInit) as Request & { velixUrl: URL };
    request.velixUrl = url;

    // Call API handler with native Request and Next.js-like context
    const response = await handler(request, { params: route.params || {} });

    if (response instanceof Response) {
      const headers: Record<string, string> = {};
      response.headers.forEach((v: string, k: string) => { headers[k] = v; });
      res.writeHead(response.status, headers);
      const text = await response.text();
      res.end(text);
    } else if (typeof response === 'object') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(String(response));
    }
  } catch (err: unknown) {
    const error = err as Error;
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function handleServerAction(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    // 1. Origin / CSRF validation
    const origin = req.headers.origin;
    const host = req.headers.host;
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Forbidden: Invalid request origin' }));
          return;
        }
      } catch {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Forbidden: Malformed origin' }));
        return;
      }
    }

    // 2. Enforce custom header requirement to prevent simple form CSRF POSTs
    const actionHeader = req.headers['x-velix-action'];
    if (!actionHeader) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing X-Velix-Action header' }));
      return;
    }

    const body = await parseRequestBody(req) as { actionId?: string, args?: string };
    if (!body?.actionId || typeof body.actionId !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing actionId' }));
      return;
    }

    const args = body.args ? deserializeArgs(body.args as any) : [];
    const result = await executeAction(body.actionId, args);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err: unknown) {
    const error = err as Error;
    const isProd = process.env.NODE_ENV === 'production';
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: isProd ? 'An unexpected server error occurred' : (error.message || 'Action failed')
    }));
  }
}

async function handlePageRoute(
  route: Route, routes: { appRoutes: { path: string }[] },
  req: http.IncomingMessage, res: http.ServerResponse,
  url: URL, config: VelixConfig, isDev: boolean, projectRoot: string,
  manifest: VelixManifest
) {
  try {
    const mod = await importModuleSSR(route.filePath, isDev) as { default?: React.ComponentType<unknown>; metadata?: Record<string, unknown>; generateMetadata?: (params: unknown) => Record<string, unknown> };
    const PageComponent = mod.default;
    let metadata = mod.metadata || mod.generateMetadata?.(route.params) || {};

    // ── Layout Resolution (Next.js-style: walk up to root) ──
    const appDir = (config as unknown as { resolvedAppDir?: string }).resolvedAppDir || path.join(projectRoot, 'app');
    const layoutPaths = collectLayouts(route.filePath, appDir);

    // Load all layouts and merge metadata (root-first)
    const layoutModules: { default?: React.ComponentType<unknown>; metadata?: Record<string, unknown> }[] = [];
    for (const lp of layoutPaths) {
      try {
        const layoutMod = await importModuleSSR(lp, isDev) as { default?: React.ComponentType<unknown>; metadata?: Record<string, unknown> };
        layoutModules.push(layoutMod);
        if (layoutMod.metadata) {
          metadata = { ...layoutMod.metadata, ...metadata };
        }
      } catch (e) {
        const layoutErr = e as Error;
        // Fail loudly — a broken layout hides all CSS and structure from the page.
        // Never silently skip: log the full stack so the developer can act on it.
        logger.error(`Failed to load layout ${lp}: ${layoutErr.message}`, layoutErr);
        if (isDev) {
          // In development, surface the layout error as a 500 overlay immediately.
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(generate500Page({
              statusCode: 500,
              title: 'Layout Error',
              message: `Failed to load layout: ${lp}\n\n${layoutErr.message}`,
              stack: layoutErr.stack,
              isDev: true,
              pathname: url.pathname,
            }));
          }
          return;
        }
        // In production, throw — let the outer handler send a clean 500 page.
        throw layoutErr;
      }
    }

    // Generate metadata tags
    const baseUrl = config.app.url || `http://${config.server.host}:${config.server.port}`;
    const metaTags = generateMetadataTags({
      ...metadata,
      generator: `Velix v${VERSION}`,
      viewport: metadata.viewport || 'width=device-width, initial-scale=1',
    }, baseUrl);

    // Get islands for hydration
    const islands = getRegisteredIslands();
    const hydrationScript = generateAdvancedHydrationScript(islands, manifest.islands);
    
    const reactVersion = getProjectVersion('react', projectRoot);
    const tsVersion = getProjectVersion('typescript', projectRoot);

    // Developer Tools Injection
    const devToolsHtml = generateDevToolsHtml(isDev, {
      version: VERSION,
      port: config.server.port,
      host: config.server.host,
      nodeVersion: process.version.replace('v', ''),
      reactVersion,
      tsVersion
    });

    const routeStyles = manifest.routes[route.path]?.css || [];
    const headInjections = `
    <meta charset="utf-8">
    ${metaTags}
    ${config.favicon ? `<link rel="icon" href="${config.favicon}">` : ''}
    ${manifest.styles.map(s => `<link rel="stylesheet" href="${s}">`).join('\n    ')}
    ${routeStyles.map(s => `<link rel="stylesheet" href="${s}">`).join('\n    ')}
    `;
    // ── Resolve Error Boundaries ──
    const { resolveErrorBoundary, getErrorBoundaryType } = await import('@teamvelix/velix-core');
    const { VelixErrorBoundary, VelixDefaultErrorPage } = await import('@teamvelix/velix-react');

    const errorBoundary = resolveErrorBoundary(route.filePath, appDir, 'error');
    const notFoundBoundary = resolveErrorBoundary(route.filePath, appDir, 'not-found');

    let ErrorComponent = null;
    let NotFoundComponent = null;

    if (errorBoundary) {
      try {
        const mod = await import(`${pathToFileURL(errorBoundary.filePath).href}?t=${Date.now()}`);
        ErrorComponent = mod.default;
      } catch (e) {}
    }
    if (notFoundBoundary) {
      try {
        const mod = await import(`${pathToFileURL(notFoundBoundary.filePath).href}?t=${Date.now()}`);
        NotFoundComponent = mod.default;
      } catch (e) {}
    }

    // Extract search params for the component
    const searchParams = Object.fromEntries(url.searchParams.entries());

    let pageElement: React.ReactElement;
    try {
      // Render the page component (supports async/server components)
      pageElement = await renderComponentAsync(PageComponent, { params: route.params, searchParams, query: searchParams });
    } catch (ssrError) {
      const err = ssrError as Error;
      const errorType = getErrorBoundaryType(err);
      res.statusCode = (err as any).status || (errorType === 'not-found' ? 404 : 500);

      if (errorType === 'not-found' && NotFoundComponent) {
        pageElement = React.createElement(NotFoundComponent as any);
      } else if (ErrorComponent) {
        pageElement = React.createElement(ErrorComponent as any, { error: err, reset: () => {} });
      } else {
        pageElement = React.createElement(VelixDefaultErrorPage, { error: err, reset: () => {} });
      }
    }

    // Wrap with Error Boundary for client-side routing and hydration
    pageElement = React.createElement(
      VelixErrorBoundary as any,
      {
        errorComponent: ErrorComponent as any,
        notFoundComponent: NotFoundComponent as any,
        routePath: route.filePath,
      },
      pageElement
    );

    // Nest layouts around page: innermost first, then wrap outward (root is first in array)
    let layoutElement = pageElement;
    for (let i = layoutModules.length - 1; i >= 0; i--) {
      const layoutMod = layoutModules[i];
      if (layoutMod.default) {
        layoutElement = await renderComponentAsync(layoutMod.default, {
          params: route.params,
          searchParams,
          children: layoutElement,
        });
      }
    }

    // Render the React Tree (SSR)
    const ssrContent = renderToString(layoutElement);

    // Apply native waterfall hook: after render
    let finalHtml = await pluginManager.runWaterfallHook(PluginHooks.AFTER_RENDER, ssrContent, { route, config, isDev }) as string;
    
    // Inject Head & Body (Surgical insertion)
    const headInjectionsHtml = `\n    ${headInjections}\n    `;
    const hmrScript = isDev ? `\n    <script type="module">\n      import { initHMRClient, VelixDevOverlay } from '/__velix/hmr-client.js';\n      initHMRClient();\n    </script>` : '';
    const bodyInjectionsHtml = `\n    <div id="__velix-islands"></div>\n    ${hydrationScript}${devToolsHtml}${hmrScript}\n    `;
    if (finalHtml.includes('<html')) {
      // 1. Inject Head
      const headEnd = finalHtml.lastIndexOf('</head>');
      if (headEnd !== -1) {
        finalHtml = finalHtml.slice(0, headEnd) + headInjectionsHtml + finalHtml.slice(headEnd);
      } else {
        // Find body start to insert head before it
        const bodyStart = finalHtml.search(/<body[^>]*>/i);
        if (bodyStart !== -1) {
          finalHtml = finalHtml.slice(0, bodyStart) + `<head>${headInjectionsHtml}</head>` + finalHtml.slice(bodyStart);
        }
      }

      // 2. Inject Body scripts
      const bodyEnd = finalHtml.lastIndexOf('</body>');
      if (bodyEnd !== -1) {
        finalHtml = finalHtml.slice(0, bodyEnd) + bodyInjectionsHtml + finalHtml.slice(bodyEnd);
      } else {
        finalHtml += bodyInjectionsHtml;
      }

      // 3. Ensure Doctype
      if (!finalHtml.trim().startsWith('<!DOCTYPE')) {
        finalHtml = '<!DOCTYPE html>\n' + finalHtml;
      }
    } else {
      // Fallback for partial content
      finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    ${headInjectionsHtml}
</head>
<body>
    <div id="__velix">${ssrContent}</div>
    ${bodyInjectionsHtml}
</body>
</html>`;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(finalHtml);

  } catch (err: unknown) {
    const error = err as Error;
    logger.error(`Render error: ${route.path}`, error);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generate500Page({
      statusCode: 500,
      title: 'Render Error',
      message: error.message || 'Failed to render page',
      stack: isDev ? error.stack : undefined,
      isDev,
      pathname: route.path
    }));
  }
}

async function serveVelixInternal(pathname: string, req: http.IncomingMessage, res: http.ServerResponse, projectRoot: string, isDev: boolean = false) {
  // HMR endpoint for dev mode
  if (pathname === '/__velix/hmr') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('data: connected\n\n');
    const interval = setInterval(() => res.write(':heartbeat\n\n'), 30000);
    // @ts-ignore
    if (res.req?.socket?.server?.__hmrClients) res.req.socket.server.__hmrClients.add(res);
    req.on('close', () => {
      clearInterval(interval);
      // @ts-ignore
      if (res.req?.socket?.server?.__hmrClients) res.req.socket.server.__hmrClients.delete(res);
    });
    return;
  }

  if (pathname === '/__velix/logo.webp') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Check multiple possible locations for the logo
    const candidates = [
      path.join(__dirname, '..', 'assets', 'logo.webp'),
      path.join(__dirname, '..', '..', 'assets', 'logo.webp'),
      path.join(process.cwd(), 'node_modules', '@teamvelix', 'velix', 'assets', 'logo.webp'),
      path.join(process.cwd(), 'packages', 'velix', 'assets', 'logo.webp'),
      path.join(process.cwd(), 'node_modules', 'velix', 'assets', 'logo.webp'),
      path.join(process.cwd(), 'public', 'favicon.webp'),
    ];
    const logoPath = candidates.find(p => fs.existsSync(p));
    if (logoPath) {
      res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' });
      res.end(fs.readFileSync(logoPath));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
    return;
  }

  // HMR Client Serving
  // Look for: (1) pre-compiled dist file (npm installs), (2) monorepo src (dev)
  if (pathname === '/__velix/hmr-client.js') {
    const __filenameHmr = fileURLToPath(import.meta.url);
    const __dirnameHmr = path.dirname(__filenameHmr);
    try {
      // Prefer a pre-bundled dist file so npm installs don't need esbuild-on-demand
      const distCandidates = [
        path.join(__dirnameHmr, '..', 'dist', 'hmr-client.js'),
        path.join(__dirnameHmr, '..', 'hmr-client.js'),
        path.join(__dirnameHmr, 'hmr-client.js'),
        path.join(projectRoot, 'node_modules', '@teamvelix', 'velix-react', 'dist', 'hmr-client.js'),
        path.join(projectRoot, '..', 'packages', 'velix-react', 'dist', 'hmr-client.js'),
        path.join(process.cwd(), 'node_modules', '@teamvelix', 'velix-react', 'dist', 'hmr-client.js'),
        path.join(process.cwd(), '..', 'packages', 'velix-react', 'dist', 'hmr-client.js'),
        path.join(process.cwd(), 'packages', 'velix-react', 'dist', 'hmr-client.js'),
      ];
      const distHmr = distCandidates.find(p => fs.existsSync(p));
      if (distHmr) {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(fs.readFileSync(distHmr, 'utf-8'));
        return;
      }

      // Fall back to building from source (monorepo / local dev)
      const srcCandidates = [
        path.join(projectRoot, '..', 'packages', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
        path.join(projectRoot, 'packages', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
        path.join(process.cwd(), 'packages', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
        path.join(process.cwd(), '..', 'packages', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
        path.join(process.cwd(), 'node_modules', '@teamvelix', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
        path.join(__dirnameHmr, '..', '..', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
        path.join(__dirnameHmr, '..', '..', 'packages', 'velix-react', 'src', 'hmr', 'hmr-client.ts'),
      ];
      const hmrClientSrc = srcCandidates.find(p => fs.existsSync(p));
      if (!hmrClientSrc) {
        // Serve a no-op stub so the browser can parse it as a module without
        // a MIME error (the <script type="module"> would block otherwise).
        logger.warn('HMR client source not found — serving no-op stub. Add dist/hmr-client.js to the package.');
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end('// velix hmr-client not found — HMR disabled\nexport function initHMRClient() {}\nexport const VelixDevOverlay = { show(){}, hide(){}, showError(){}, showCompiling(){}, showSuccess(){} };\nexport default { initHMRClient, VelixDevOverlay };\n');
        return;
      }
      const result = await esbuild.build({
        entryPoints: [hmrClientSrc],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: ['es2022'],
        minify: true,
        write: false,
      });
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(result.outputFiles[0].text);
      return;
    } catch (err) {
      const hmrErr = err as Error;
      logger.error('HMR Client build failed', hmrErr);
      // Still serve a module so the browser doesn't report a MIME type error
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(`// velix hmr-client build error: ${hmrErr.message}\nexport function initHMRClient() {}\nexport const VelixDevOverlay = { show(){}, hide(){}, showError(){}, showCompiling(){}, showSuccess(){} };\nexport default { initHMRClient, VelixDevOverlay };\n`);
      return;
    }
  }

  // Dynamic Island Serving (Development only)
  if (pathname.startsWith('/__velix/islands/') && pathname.endsWith('.js')) {
    if (!isDev) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: dynamic island bundling is disabled in production');
      return;
    }
    const componentName = pathname.replace('/__velix/islands/', '').replace('.js', '');
    try {
      // Find the component file
      const searchDirs = [
        path.join(projectRoot, 'components'),
        path.join(projectRoot, 'app'),
        path.join(projectRoot, 'islands')
      ];
      
      let componentPath = '';
      for (const dir of searchDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir, { recursive: true }) as string[];
        const found = files.find(f => f.replace(/\\/g, '/').endsWith(`${componentName}.tsx`) || f.replace(/\\/g, '/').endsWith(`${componentName}.jsx`));
        if (found) {
          componentPath = path.join(dir, found);
          break;
        }
      }

      if (!componentPath) {
        logger.error(`Island component not found: ${componentName}`);
        res.writeHead(404);
        res.end('Island component not found');
        return;
      }

      // Bundle on the fly
      const result = await esbuild.build({
        entryPoints: [componentPath],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: ['es2022'],
        minify: false,
        sourcemap: 'inline',
        jsx: 'automatic',
        external: ['react', 'react-dom'],
        write: false,
      });

      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(result.outputFiles[0].text);
      return;
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Island bundling failed: ${componentName}`, error);
      res.writeHead(500);
      res.end(`console.error("Island bundling failed: ${error.message}");`);
      return;
    }
  }

  // React & ReactDOM Client serving
  if (pathname === '/__velix/react.js' || pathname === '/__velix/react-dom-client.js') {
    const dep = pathname === '/__velix/react.js' ? 'react' : 'react-dom/client';
    try {
      const result = await esbuild.build({
        entryPoints: [dep],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: ['es2022'],
        minify: true,
        write: false,
      });
      res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=31536000, immutable' });
      res.end(result.outputFiles[0].text);
      return;
    } catch (err: unknown) {
      res.writeHead(500);
      res.end();
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}

// ============================================================================
// Utilities
// ============================================================================

function parseRequestBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const ct = req.headers['content-type'] || '';
        if (ct.includes('application/json')) resolve(JSON.parse(body));
        else resolve(body);
      } catch { resolve(body); }
    });
    req.on('error', reject);
  });
}

function parseRawBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default { createServer, tailwindPlugin };
