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
import React from 'react';
import { renderToString } from 'react-dom/server';
import { loadConfig, resolvePaths, type VelixConfig } from '../config.js';
import { buildRouteTree, matchRoute } from '../router/index.js';
import { runMiddleware, loadMiddleware, type MiddlewareFunction } from '../middleware/index.js';
import { pluginManager, loadPlugins, PluginHooks, builtinPlugins } from '../plugins/index.js';
import tailwindPlugin from '../plugins/tailwind.js';
import { generateMetadataTags, generateSitemap, generateRobotsTxt } from '../metadata/index.js';
import { getRegisteredIslands, generateAdvancedHydrationScript } from '../islands/index.js';
import { executeAction, deserializeArgs } from '../actions/index.js';
import logger from '../logger.js';
import esbuild from 'esbuild';
import { generateDevToolsHtml } from './devtools.js';
import { generate404Page, generate500Page } from './error-pages.js';

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
  const mode = options.mode || (process.env.NODE_ENV as any) || 'development';
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
  const appDir = (config as any).resolvedAppDir || path.join(projectRoot, 'app');
  const routes = buildRouteTree(appDir);

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
        await serveVelixInternal(pathname, req, res, projectRoot);
        return;
      }

      // ── Static files ──
      const publicDir = (config as any).resolvedPublicDir || path.join(projectRoot, 'public');
      if (await serveStaticFile(pathname, publicDir, res, isDev)) {
        if (isDev) logger.request(req.method || 'GET', pathname, 200, Date.now() - requestStart, { type: 'static' });
        return;
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
        await handlePageRoute(pageMatch, routes, req, res, url, config, isDev, projectRoot);
        if (isDev) logger.request(req.method || 'GET', pathname, res.statusCode, Date.now() - requestStart, { type: 'ssr' });
        return;
      }

      // ── 404 ──
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(generate404Page(pathname));
      if (isDev) logger.request(req.method || 'GET', pathname, 404, Date.now() - requestStart);

    } catch (error: any) {
      console.error('Server error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(generate500Page({
          statusCode: 500,
          title: 'Server Error',
          message: error.message || 'An unexpected error occurred',
          stack: isDev ? error.stack : undefined,
          isDev,
          pathname
        }));
      }
    }
  });

  const __hmrClients = new Set<http.ServerResponse>();
  (server as any).__hmrClients = __hmrClients;
  (server as any).broadcastHMR = (msg: string) => {
    __hmrClients.forEach(c => c.write(`data: ${msg}\n\n`));
  };

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

  server.on('error', (err: any) => {
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

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': content.length,
    'Cache-Control': isDev ? 'no-store, no-cache, must-revalidate' : 'public, max-age=31536000, immutable',
  });
  res.end(content);
  return true;
}

async function handleApiRoute(route: any, req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
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

    // Parse body for POST/PUT/PATCH
    let body: any;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await parseRequestBody(req);
    }

    const request = {
      method, url: req.url, headers: req.headers,
      params: route.params || {},
      query: Object.fromEntries(url.searchParams),
      body, json: () => body,
    };

    const response = await handler(request);

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
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function handleServerAction(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const body = await parseRequestBody(req) as any;
    if (!body?.actionId || typeof body.actionId !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing actionId' }));
      return;
    }

    const args = body.args ? deserializeArgs(body.args) : [];
    const result = await executeAction(body.actionId, args);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}

async function handlePageRoute(
  route: any, routes: any,
  req: http.IncomingMessage, res: http.ServerResponse,
  url: URL, config: VelixConfig, isDev: boolean, projectRoot: string
) {
  try {
    const fileUrl = pathToFileURL(route.filePath).href;
    const mod = await import(`${fileUrl}?t=${Date.now()}`);
    const PageComponent = mod.default;
    let metadata = mod.metadata || mod.generateMetadata?.(route.params) || {};

    // Attempt to merge layout metadata and get LayoutComponent
    let LayoutComponent = ({ children }: any) => React.createElement(React.Fragment, null, children);
    let layoutParams = route.params;
    try {
      const layoutPath = path.join(path.dirname(route.filePath), 'layout.tsx');
      if (fs.existsSync(layoutPath)) {
        const layoutMod = await import(`${pathToFileURL(layoutPath).href}?t=${Date.now()}`);
        if (layoutMod.metadata) {
          metadata = { ...layoutMod.metadata, ...metadata };
        }
        if (layoutMod.default) {
          LayoutComponent = layoutMod.default;
        }
      }
    } catch(e) {}

    // Generate metadata tags
    const baseUrl = config.app.url || `http://${config.server.host}:${config.server.port}`;
    const metaTags = generateMetadataTags({
      ...metadata,
      generator: `Velix v5.0.0`,
      viewport: metadata.viewport || 'width=device-width, initial-scale=1',
    }, baseUrl);

    // Get islands for hydration
    const islands = getRegisteredIslands();
    const hydrationScript = generateAdvancedHydrationScript(islands);
    
    // Developer Tools Injection
    const devToolsHtml = generateDevToolsHtml(isDev);

    const headInjections = `
    <meta charset="utf-8">
    ${metaTags}
    ${config.favicon ? `<link rel="icon" href="${config.favicon}">` : ''}
    ${config.styles.map(s => `<link rel="stylesheet" href="${s}">`).join('\n    ')}
    `;
    // Extract search params for the component
    const searchParams = Object.fromEntries(url.searchParams.entries());

    // Fix for Async Components (Server Components) in React 19
    // renderToString does not support async components, so we manually await them
    let pageElement: any = React.createElement(PageComponent, { params: route.params, searchParams, query: searchParams });
    if (typeof PageComponent === 'function') {
      try {
        const result = PageComponent({ params: route.params, searchParams, query: searchParams });
        if (result instanceof Promise) {
          pageElement = await result;
        }
      } catch (e) {
        // Fallback or ignore if it's not a functional component call
      }
    }

    let layoutElement = React.createElement(LayoutComponent, { params: layoutParams, searchParams }, pageElement);
    if (typeof LayoutComponent === 'function') {
      try {
        const result = LayoutComponent({ params: layoutParams, searchParams, children: pageElement });
        if (result instanceof Promise) {
          layoutElement = await result;
        }
      } catch (e) {
        // Fallback
      }
    }

    // Render the React Tree (SSR)
    const ssrContent = renderToString(layoutElement);

    // Apply native waterfall hook: after render
    let finalHtml = await pluginManager.runWaterfallHook(PluginHooks.AFTER_RENDER, ssrContent, { route, config, isDev });
    
    // Inject Head & Body (Surgical insertion)
    const headInjectionsHtml = `\n    ${headInjections}\n    `;
    const bodyInjectionsHtml = `\n    <div id="__velix-islands"></div>\n    ${hydrationScript}${devToolsHtml}\n    `;

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

  } catch (err: any) {
    logger.error(`Render error: ${route.path}`, err);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(generate500Page({
      statusCode: 500,
      title: 'Render Error',
      message: err.message || 'Failed to render page',
      stack: isDev ? err.stack : undefined,
      isDev,
      pathname: route.path
    }));
  }
}

async function serveVelixInternal(pathname: string, req: http.IncomingMessage, res: http.ServerResponse, projectRoot: string) {
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
      path.join(process.cwd(), 'node_modules', '@teamvelix', 'velix', 'assets', 'logo.webp'),
      path.join(process.cwd(), 'node_modules', 'velix', 'assets', 'logo.webp'),
      path.join(process.cwd(), 'public', 'favicon.webp'),
    ];
    const logoPath = candidates.find(p => fs.existsSync(p));
    if (logoPath) {
      res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' });
      res.end(fs.readFileSync(logoPath));
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }

  // Dynamic Island Serving
  if (pathname.startsWith('/__velix/islands/') && pathname.endsWith('.js')) {
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
    } catch (err: any) {
      logger.error(`Island bundling failed: ${componentName}`, err);
      res.writeHead(500);
      res.end(`console.error("Island bundling failed: ${err.message}");`);
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
    } catch (err: any) {
      res.writeHead(500);
      res.end();
      return;
    }
  }

  res.writeHead(404);
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

export default { createServer, tailwindPlugin };
