/**
 * FlexiReact Server v4.1.0
 * Production-ready server with SSR, RSC, Islands, and more
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadConfig, resolvePaths } from '../config.js';
import { buildRouteTree, matchRoute, findRouteLayouts } from '../router/index.js';
import { renderPage, renderError, renderLoading } from '../render/index.js';
import { loadMiddleware, runMiddleware } from '../middleware/index.js';
import { loadPlugins, pluginManager, PluginHooks } from '../plugins/index.js';
import { getRegisteredIslands, generateAdvancedHydrationScript } from '../islands/index.js';
import { createRequestContext, RequestContext, RouteContext } from '../context.js';
import { logger } from '../logger.js';
import { RedirectError, NotFoundError } from '../helpers.js';
import { executeAction, deserializeArgs } from '../actions/index.js';
import { handleImageOptimization } from '../image/index.js';
import { handleFontRequest } from '../font/index.js';
import React from 'react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

/**
 * Creates the FlexiReact server
 */
interface CreateServerOptions {
  projectRoot?: string;
  mode?: 'development' | 'production';
  port?: number;
  host?: string;
}

export async function createServer(options: CreateServerOptions = {}) {
  const serverStartTime = Date.now();
  const projectRoot = options.projectRoot || process.cwd();
  const isDev = options.mode === 'development';



  // Load configuration
  const rawConfig = await loadConfig(projectRoot);
  const config = resolvePaths(rawConfig, projectRoot);

  // Load plugins
  await loadPlugins(projectRoot, config);

  // Run config hook
  await pluginManager.runHook(PluginHooks.CONFIG, config);

  // Load middleware
  const middleware = await loadMiddleware(projectRoot);

  // Build routes
  let routes = buildRouteTree(config.pagesDir, config.layoutsDir);

  // Run routes loaded hook
  await pluginManager.runHook(PluginHooks.ROUTES_LOADED, routes);

  // Create module loader with cache busting for dev
  const loadModule = createModuleLoader(isDev);

  // Create HTTP server
  const server = http.createServer(async (req, res) => {
    const startTime = Date.now();

    // Parse URL early so it's available in finally block
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    try {

      // Run request hook
      await pluginManager.runHook(PluginHooks.REQUEST, req, res);

      // Run middleware
      const middlewareResult = await runMiddleware(req, res, middleware);
      if (!middlewareResult.continue) {
        return;
      }

      // Handle rewritten URL
      const effectivePath = middlewareResult.rewritten
        ? new URL(req.url || '/', `http://${req.headers.host}`).pathname
        : pathname;

      // Serve static files from public directory
      if (await serveStaticFile(res, config.publicDir, effectivePath)) {
        return;
      }

      // Serve built assets in production
      if (!isDev && effectivePath.startsWith('/_flexi/')) {
        const assetPath = path.join(config.outDir, 'client', effectivePath.slice(8));
        if (await serveStaticFile(res, path.dirname(assetPath), path.basename(assetPath))) {
          return;
        }
      }

      // Serve client components (for hydration)
      if (effectivePath.startsWith('/_flexi/component/')) {
        const componentName = effectivePath.slice(18).replace('.js', '');
        return await serveClientComponent(res, config.pagesDir, componentName);
      }

      // Handle server actions
      if (effectivePath === '/_flexi/action' && req.method === 'POST') {
        return await handleServerAction(req, res);
      }

      // Handle image optimization
      if (effectivePath.startsWith('/_flexi/image')) {
        return await handleImageOptimization(req, res, config.images || {});
      }

      // Handle font requests
      if (effectivePath.startsWith('/_flexi/font')) {
        return await handleFontRequest(req, res);
      }

      // Rebuild routes in dev mode for hot reload
      if (isDev) {
        routes = buildRouteTree(config.pagesDir, config.layoutsDir);
      }

      // Match API routes
      const apiRoute = matchRoute(effectivePath, routes.api);
      if (apiRoute) {
        return await handleApiRoute(req, res, apiRoute, loadModule);
      }

      // Match FlexiReact v4 routes (routes/ directory - priority)
      const flexiRoute = matchRoute(effectivePath, routes.flexiRoutes || []);
      if (flexiRoute) {
        return await handlePageRoute(req, res, flexiRoute, routes, config, loadModule, url);
      }

      // Match app routes (app/ directory - Next.js style)
      const appRoute = matchRoute(effectivePath, routes.appRoutes || []);
      if (appRoute) {
        return await handlePageRoute(req, res, appRoute, routes, config, loadModule, url);
      }

      // Match page routes (pages/ directory - legacy fallback)
      const pageRoute = matchRoute(effectivePath, routes.pages);
      if (pageRoute) {
        return await handlePageRoute(req, res, pageRoute, routes, config, loadModule, url);
      }

      // 404 Not Found
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(renderError(404, 'Page not found'));

    } catch (error: any) {
      // Handle redirect() calls
      if (error instanceof RedirectError) {
        res.writeHead(error.statusCode, { 'Location': error.url });
        res.end();
        return;
      }

      // Handle notFound() calls
      if (error instanceof NotFoundError) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(renderError(404, error.message));
        return;
      }

      console.error('Server Error:', error);

      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(renderError(500, error.message, isDev ? error.stack : null));
      }
    } finally {
      const duration = Date.now() - startTime;
      if (isDev) {
        // Determine route type for logging
        const routeType = pathname.startsWith('/api/') ? 'api' :
          pathname.startsWith('/_flexi/') ? 'asset' :
            pathname.match(/\.(js|css|png|jpg|svg|ico)$/) ? 'asset' : 'dynamic';
        logger.request(req.method || 'GET', pathname, res.statusCode, duration, { type: routeType });
      }

      // Run response hook
      await pluginManager.runHook(PluginHooks.RESPONSE, req, res, duration);
    }
  });

  // Start server
  const port = process.env.PORT || options.port || config.server.port;
  const host = options.host || config.server.host;

  return new Promise((resolve, reject) => {
    // Handle port in use error
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.portInUse(port);
        process.exit(1);
      } else {
        logger.error('Server error', err);
        reject(err);
      }
    });

    server.listen(port, host, async () => {
      // Show startup info with styled logger
      logger.serverStart({
        port,
        host,
        mode: isDev ? 'development' : 'production',
        pagesDir: config.pagesDir,
        islands: config.islands?.enabled,
        rsc: config.rsc?.enabled
      }, serverStartTime);

      // Run server start hook
      await pluginManager.runHook(PluginHooks.SERVER_START, server);

      resolve(server);
    });
  });
}

/**
 * Creates a module loader with optional cache busting
 */
function createModuleLoader(isDev: boolean) {
  return async (filePath: string) => {
    const url = pathToFileURL(filePath).href;
    const cacheBuster = isDev ? `?t=${Date.now()}` : '';
    return import(`${url}${cacheBuster}`);
  };
}

/**
 * Serves static files
 */
async function serveStaticFile(res: any, baseDir: string, pathname: string) {
  // Prevent directory traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(baseDir, safePath);

  // Check if file exists and is within base directory
  if (!filePath.startsWith(baseDir) || !fs.existsSync(filePath)) {
    return false;
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = (MIME_TYPES as any)[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': 'public, max-age=31536000'
  });

  fs.createReadStream(filePath).pipe(res);
  return true;
}

/**
 * Handles API route requests
 */
async function handleApiRoute(req: any, res: any, route: any, loadModule: any) {
  try {
    const module = await loadModule(route.filePath);
    const method = (req.method || 'GET').toLowerCase();

    // Parse request body
    const body = await parseBody(req);

    // Parse query
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const query = Object.fromEntries(url.searchParams);

    // Enhanced request
    const enhancedReq = {
      ...req,
      body,
      query,
      params: route.params,
      method: req.method
    };

    // Enhanced response
    const enhancedRes = createApiResponse(res);

    // Find handler (check both lowercase and uppercase method names)
    const handler = (module as any)[method] || (module as any)[method.toUpperCase()] || module.default;

    if (!handler) {
      enhancedRes.status(405).json({ error: 'Method not allowed' });
      return;
    }

    await handler(enhancedReq, enhancedRes);

  } catch (error) {
    console.error('API Error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  }
}

/**
 * Handles server action requests
 */
async function handleServerAction(req: import('http').IncomingMessage, res: import('http').ServerResponse) {
  try {
    // Parse request body
    const body: any = await parseBody(req);
    const { actionId, args } = body;

    if (!actionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Missing actionId' }));
      return;
    }

    // Deserialize arguments
    const deserializedArgs = deserializeArgs(args || []);

    // Execute the action
    const result = await executeAction(actionId, deserializedArgs, {
      request: new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers as any
      })
    });

    // Send response
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Flexi-Action': actionId
    });
    res.end(JSON.stringify(result));

  } catch (error: any) {
    console.error('Server Action Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Action execution failed'
    }));
  }
}

/**
 * Creates an enhanced API response object
 */
function createApiResponse(res: any) {
  return {
    _res: res,
    _status: 200,
    _headers: {},

    status(code: number) {
      this._status = code;
      return this;
    },

    setHeader(name: string, value: any) {
      (this._headers as any)[name] = value;
      return this;
    },

    json(data: any) {
      (this._headers as any)['Content-Type'] = 'application/json';
      this._send(JSON.stringify(data));
    },

    send(data: any) {
      if (typeof data === 'object') {
        this.json(data);
      } else {
        (this._headers as any)['Content-Type'] = (this._headers as any)['Content-Type'] || 'text/plain';
        this._send(String(data));
      }
    },

    html(data: any) {
      (this._headers as any)['Content-Type'] = 'text/html';
      this._send(data);
    },

    redirect(url: string, status = 302) {
      this._status = status;
      (this._headers as any)['Location'] = url;
      this._send('');
    },

    _send(body: any) {
      if (!this._res.headersSent) {
        this._res.writeHead(this._status, this._headers);
        this._res.end(body);
      }
    }
  };
}

/**
 * Handles page route requests with SSR
 */
async function handlePageRoute(req: any, res: any, route: any, routes: any, config: any, loadModule: any, url: URL) {
  try {
    // Run route-specific middleware if exists
    if (route.middleware) {
      try {
        const middlewareModule = await loadModule(route.middleware);
        const middlewareFn = middlewareModule.default || middlewareModule.middleware;

        if (typeof middlewareFn === 'function') {
          const result = await middlewareFn(req, res, { route, params: route.params });

          // If middleware returns a response, use it
          if (result?.redirect) {
            res.writeHead(result.statusCode || 307, { 'Location': result.redirect });
            res.end();
            return;
          }

          if (result?.rewrite) {
            // Rewrite to different path
            req.url = result.rewrite;
          }

          if (result === false || result?.stop) {
            // Middleware stopped the request
            return;
          }
        }
      } catch (middlewareError: any) {
        console.error('Route middleware error:', middlewareError.message);
      }
    }

    // Load page module
    const pageModule = await loadModule(route.filePath);
    const Component = pageModule.default;

    if (!Component) {
      throw new Error(`No default export in ${route.filePath}`);
    }

    // Create request context
    const query = Object.fromEntries(url.searchParams);
    const context = createRequestContext(req, res, route.params, query);

    // Get page props
    let props = { params: route.params, query };

    // Handle getServerSideProps
    if (pageModule.getServerSideProps) {
      const result = await pageModule.getServerSideProps({
        params: route.params,
        query,
        req,
        res
      });

      if (result.redirect) {
        res.writeHead(result.redirect.statusCode || 302, {
          Location: result.redirect.destination
        });
        res.end();
        return;
      }

      if (result.notFound) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(renderError(404, 'Page not found'));
        return;
      }

      props = { ...props, ...result.props };
    }

    // Handle getStaticProps (for ISR)
    if (pageModule.getStaticProps) {
      const result = await pageModule.getStaticProps({ params: route.params });

      if (result.notFound) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(renderError(404, 'Page not found'));
        return;
      }

      props = { ...props, ...result.props };
    }

    // Load layouts (only if layouts directory exists and has layouts)
    const layouts: Array<{ Component: any; props: any }> = [];

    try {
      const layoutConfigs = findRouteLayouts(route, routes.layouts);
      for (const layoutConfig of layoutConfigs) {
        if (layoutConfig.filePath) {
          const layoutModule = await loadModule(layoutConfig.filePath);
          if (layoutModule.default) {
            layouts.push({
              Component: layoutModule.default,
              props: {}
            });
          }
        }
      }
    } catch (layoutError) {
      // Layouts are optional, continue without them
      console.warn('Layout loading skipped:', (layoutError as any).message);
    }

    // Load loading component if exists
    let LoadingComponent = null;
    if (route.loading) {
      const loadingModule = await loadModule(route.loading);
      LoadingComponent = loadingModule.default;
    }

    // Load error component if exists
    let ErrorComponent = null;
    if (route.error) {
      const errorModule = await loadModule(route.error);
      ErrorComponent = errorModule.default;
    }

    // Run before render hook
    props = await pluginManager.runWaterfallHook(
      PluginHooks.BEFORE_RENDER,
      props,
      { route, Component }
    );

    // Check if this is a client component (needs hydration)
    const isClientComponent = route.isClientComponent ||
      (pageModule.__isClient) ||
      (typeof pageModule.default === 'function' && pageModule.default.toString().includes('useState'));

    // Render the page
    let html = await renderPage({
      Component,
      props,
      layouts,
      loading: LoadingComponent,
      error: ErrorComponent,
      islands: getRegisteredIslands(),
      title: pageModule.title || pageModule.metadata?.title || 'FlexiReact App',
      meta: pageModule.metadata || {},
      styles: config.styles || [],
      scripts: config.scripts || [],
      favicon: config.favicon || null,
      needsHydration: isClientComponent,
      componentPath: route.filePath,
      route: route.path || url.pathname,
      isSSG: !!pageModule.getStaticProps
    });

    // Add island hydration script
    const islands = getRegisteredIslands();
    if (islands.length > 0 && config.islands.enabled) {
      const hydrationScript = generateAdvancedHydrationScript(islands);
      html = html.replace('</body>', `${hydrationScript}</body>`);
    }

    // Add client hydration for 'use client' components
    if (isClientComponent) {
      const hydrationScript = generateClientHydrationScript(route.filePath, props);
      html = html.replace('</body>', `${hydrationScript}</body>`);
    }

    // Run after render hook
    html = await pluginManager.runWaterfallHook(
      PluginHooks.AFTER_RENDER,
      html,
      { route, Component, props }
    );

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);

  } catch (error) {
    console.error('Page Render Error:', error);
    throw error;
  }
}

/**
 * Serves a client component as JavaScript for hydration
 */
async function serveClientComponent(res: any, pagesDir: string, componentName: string) {
  const { transformSync } = await import('esbuild');

  // Remove .tsx.js or .jsx.js suffix if present
  const cleanName = componentName.replace(/\.(tsx|jsx|ts|js)\.js$/, '').replace(/\.js$/, '');

  // Find the component file (support TypeScript)
  const possiblePaths = [
    path.join(pagesDir, `${cleanName}.tsx`),
    path.join(pagesDir, `${cleanName}.ts`),
    path.join(pagesDir, `${cleanName}.jsx`),
    path.join(pagesDir, `${cleanName}.js`),
  ];

  let componentPath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      componentPath = p;
      break;
    }
  }

  if (!componentPath) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`Component not found: ${cleanName}`);
    return;
  }

  // Determine loader based on extension
  const ext = path.extname(componentPath);
  const loader = ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx';

  try {
    let source = fs.readFileSync(componentPath, 'utf-8');

    // Remove 'use client' directive
    source = source.replace(/^['"]use (client|server|island)['"];?\s*/m, '');

    // Transform for browser
    const result = transformSync(source, {
      loader,
      format: 'esm',
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      target: 'es2020',
      // Replace React imports with global
      banner: `
        const React = window.React;
        const useState = window.useState;
        const useEffect = window.useEffect;
        const useCallback = window.useCallback;
        const useMemo = window.useMemo;
        const useRef = window.useRef;
      `
    });

    // Remove all React imports since we're using globals
    let code = result.code;
    // Remove: import React from 'react'
    code = code.replace(/import\s+React\s+from\s+['"]react['"];?\s*/g, '');
    // Remove: import { useState } from 'react'
    code = code.replace(/import\s+\{[^}]+\}\s+from\s+['"]react['"];?\s*/g, '');
    // Remove: import React, { useState } from 'react'
    code = code.replace(/import\s+React\s*,\s*\{[^}]+\}\s+from\s+['"]react['"];?\s*/g, '');

    res.writeHead(200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache'
    });
    res.end(code);

  } catch (error) {
    console.error('Error serving client component:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error compiling component');
  }
}

/**
 * Generates client hydration script for 'use client' components
 */
function generateClientHydrationScript(componentPath: string, props: any) {
  // Create a relative path for the client bundle (handle .tsx, .ts, .jsx, .js)
  const ext = path.extname(componentPath);
  const componentName = path.basename(componentPath, ext);

  return `
<script type="module">
  // FlexiReact Client Hydration
  (async function() {
    try {
      const React = await import('https://esm.sh/react@18.3.1');
      const ReactDOM = await import('https://esm.sh/react-dom@18.3.1/client');
      
      // Make React available globally for the component
      window.React = React.default || React;
      window.useState = React.useState;
      window.useEffect = React.useEffect;
      window.useCallback = React.useCallback;
      window.useMemo = React.useMemo;
      window.useRef = React.useRef;
      
      // Fetch the component code
      const response = await fetch('/_flexi/component/${componentName}.js');
      const code = await response.text();
      
      // Create and import the module
      const blob = new Blob([code], { type: 'application/javascript' });
      const moduleUrl = URL.createObjectURL(blob);
      const module = await import(moduleUrl);
      
      const Component = module.default;
      const props = ${JSON.stringify(props)};
      
      // Hydrate the root
      const root = document.getElementById('root');
      ReactDOM.hydrateRoot(root, window.React.createElement(Component, props));
      
      console.log('⚡ FlexiReact: Component hydrated successfully');
    } catch (error) {
      console.error('⚡ FlexiReact: Hydration failed', error);
    }
  })();
</script>`;
}

/**
 * Parses request body
 */
async function parseBody(req: any) {
  return new Promise((resolve) => {
    const contentType = req.headers['content-type'] || '';
    let body = '';

    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        if (contentType.includes('application/json') && body) {
          resolve(JSON.parse(body));
        } else if (contentType.includes('application/x-www-form-urlencoded') && body) {
          resolve(Object.fromEntries(new URLSearchParams(body)));
        } else {
          resolve(body || null);
        }
      } catch {
        resolve(body);
      }
    });

    req.on('error', () => resolve(null));
  });
}

export default createServer;
