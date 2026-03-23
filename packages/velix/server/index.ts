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
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found | Velix v5</title>
    <style>
        body { margin: 0; background: #0F172A; color: white; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; }
        .container { max-width: 600px; padding: 40px; }
        h1 { font-size: 150px; font-weight: 900; margin: 0; background: linear-gradient(to right, #2563EB, #22D3EE); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
        h2 { font-size: 32px; font-weight: 800; margin: 20px 0 10px; }
        p { color: #94A3B8; font-size: 18px; line-height: 1.6; margin-bottom: 30px; }
        .btn { display: inline-block; background: #2563EB; color: white; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4); }
        .btn:hover { background: #1D4ED8; transform: translateY(-2px); }
        .btn-outline { display: inline-block; background: transparent; color: #22D3EE; border: 1px solid #22D3EE; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-weight: 600; transition: all 0.2s; margin-left: 16px; }
        .btn-outline:hover { background: rgba(34, 211, 238, 0.1); transform: translateY(-2px); }
        code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #22D3EE; }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <h2>Oops! Page not found</h2>
        <p>The page <code>${pathname}</code> is currently floating in deep space. It might have been moved or deleted.</p>
        <div style="display:flex;justify-content:center;">
          <a href="/" class="btn">Return Home</a>
          <a href="https://velix.vercel.app" target="_blank" rel="noreferrer" class="btn-outline">Documentation</a>
        </div>
    </div>
</body>
</html>`);
      if (isDev) logger.request(req.method || 'GET', pathname, 404, Date.now() - requestStart);

    } catch (error: any) {
      console.error('Server error:', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        if (isDev) {
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Server Error | Velix v5</title>
    <style>
        body { margin: 0; background: #0F172A; color: #F8FAFC; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; overflow: hidden; }
        .overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; }
        .modal { background: #1E293B; width: 100%; max-width: 900px; max-height: 90vh; border-radius: 20px; border: 1px solid #EF4444; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden; display: flex; flex-direction: column; }
        .header { background: #EF4444; color: white; padding: 24px; display: flex; align-items: center; gap: 16px; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
        .header svg { width: 32px; height: 32px; }
        .content { padding: 32px; overflow-y: auto; }
        .message { font-size: 18px; font-weight: 600; color: #FCA5A5; margin-bottom: 20px; font-family: monospace; word-break: break-all; }
        .stack { background: #0F172A; padding: 20px; border-radius: 12px; font-family: 'Fira Code', 'Courier New', monospace; font-size: 14px; line-height: 1.6; color: #94A3B8; white-space: pre-wrap; border: 1px solid #334155; }
        .badge { display: inline-block; background: #1E3A8A; color: #60A5FA; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
        .footer { padding: 16px 32px; background: #0F172A; border-top: 1px solid #1E293B; display: flex; justify-content: space-between; align-items: center; color: #64748B; font-size: 13px; }
        .brand { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #CBD5E1; }
        .brand img { width: 16px; height: 16px; }
    </style>
</head>
<body>
    <div class="overlay">
        <div class="modal">
            <div class="header">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h1>Unhandled Runtime Error</h1>
            </div>
            <div class="content">
                <div class="badge">Server Error</div>
                <div class="message">${error.message}</div>
                <div class="stack">${error.stack || 'No stack trace available.'}</div>
            </div>
            <div class="footer">
                <div class="brand"><img src="/__velix/logo.webp" alt=""/> Velix v5.0.0</div>
                <div style="display:flex;gap:16px;">
                  <a href="https://velix.vercel.app" target="_blank" rel="noreferrer" style="color:#60A5FA;text-decoration:none;font-weight:600;">Documentation &rarr;</a>
                  <span>App Runtime (Development Mode)</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`);
        } else {
          res.end(`<!DOCTYPE html><html><head><title>500 - Server Error</title></head><body style="background:#0F172A;color:white;text-align:center;padding:100px;font-family:sans-serif;"><h1>500 - Internal Server Error</h1><p>Something went wrong on our end.</p><a href="https://velix.vercel.app" style="color:#22D3EE;text-decoration:none;display:block;margin-top:20px;font-weight:bold;">Read Documentation</a></body></html>`);
        }
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
    const devToolsHtml = isDev ? `<style>
@keyframes velix-pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); } 70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); } }
.velix-building { animation: velix-pulse 1.5s infinite !important; border: 1px solid #22D3EE !important; }
</style>
    <script>
      const es = new EventSource('/__velix/hmr');
      es.onmessage = (e) => { 
        if (e.data === 'reload') location.reload(); 
        const widget = document.getElementById('__velix-dev-tools');
        if (widget) {
          if (e.data === 'building') widget.classList.add('velix-building');
          if (e.data === 'built') widget.classList.remove('velix-building');
        }
      };
    </script>
    <div id="__velix-dev-tools" style="position:fixed;bottom:16px;left:16px;z-index:9999;background:#0f172a;border-radius:50%;padding:4px;box-shadow:0 4px 12px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;width:36px;height:36px;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" onclick="document.getElementById('__velix-dev-panel').style.display='block'" title="Velix DevTools">
      <img src="/__velix/logo.webp" alt="Velix DevTools" style="width:20px;height:20px;" />
    </div>
    <div id="__velix-dev-panel" style="display:none;position:fixed;bottom:60px;left:16px;width:300px;background:#0f172a;color:white;border-radius:12px;padding:16px;font-family:sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.3);z-index:10000;border:1px solid #1e293b;">
       <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:12px;margin-bottom:12px;">
          <h3 style="margin:0;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;"><img src="/__velix/logo.webp" style="width:16px;height:16px;"/> Velix DevTools</h3>
          <button onclick="document.getElementById('__velix-dev-panel').style.display='none'" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:20px;line-height:1;padding:0;margin:0;">&times;</button>
       </div>
       <div style="font-size:13px;color:#cbd5e1;line-height:2;">
          <div style="display:flex;justify-content:space-between;"><span>Framework</span><strong style="color:white;">v5.0.0</strong></div>
          <div style="display:flex;justify-content:space-between;"><span>Environment</span><strong style="color:#10b981;">Development</strong></div>
          <div style="display:flex;justify-content:space-between;"><span>Router</span><strong style="color:white;">App Directory</strong></div>
          <div style="display:flex;justify-content:space-between;"><span>Rendering</span><strong style="color:#60a5fa;">Streaming SSR</strong></div>
       </div>
    </div>` : '';

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
    if (isDev) {
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Render Error | Velix v5</title>
    <style>
        body { margin: 0; background: #0F172A; color: #F8FAFC; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; overflow: hidden; }
        .overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; }
        .modal { background: #1E293B; width: 100%; max-width: 900px; max-height: 90vh; border-radius: 20px; border: 1px solid #EF4444; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden; display: flex; flex-direction: column; }
        .header { background: #EF4444; color: white; padding: 24px; display: flex; align-items: center; gap: 16px; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
        .header svg { width: 32px; height: 32px; }
        .content { padding: 32px; overflow-y: auto; }
        .message { font-size: 18px; font-weight: 600; color: #FCA5A5; margin-bottom: 20px; font-family: monospace; word-break: break-all; }
        .stack { background: #0F172A; padding: 20px; border-radius: 12px; font-family: 'Fira Code', 'Courier New', monospace; font-size: 14px; line-height: 1.6; color: #94A3B8; white-space: pre-wrap; border: 1px solid #334155; }
        .badge { display: inline-block; background: #1E3A8A; color: #60A5FA; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; }
        .footer { padding: 16px 32px; background: #0F172A; border-top: 1px solid #1E293B; display: flex; justify-content: space-between; align-items: center; color: #64748B; font-size: 13px; }
        .brand { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #CBD5E1; }
        .brand img { width: 16px; height: 16px; }
    </style>
</head>
<body>
    <div class="overlay">
        <div class="modal">
            <div class="header">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h1>Unhandled Runtime Error</h1>
            </div>
            <div class="content">
                <div class="badge">Render Error</div>
                <div class="message">${err.message}</div>
                <div class="stack">${err.stack || 'No stack trace available.'}</div>
            </div>
            <div class="footer">
                <div class="brand"><img src="/__velix/logo.webp" alt=""/> Velix v5.0.0</div>
                <div>App Runtime (Development Mode)</div>
            </div>
        </div>
    </div>
</body>
</html>`);
    } else {
      res.end(`<!DOCTYPE html><html><head><title>500 - Server Error</title></head><body style="background:#0F172A;color:white;text-align:center;padding:100px;font-family:sans-serif;"><h1>500 - Internal Server Error</h1><p>Something went wrong on our end.</p></body></html>`);
    }
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
    const fallbackPath = path.join(path.dirname(pathToFileURL(__dirname).pathname), '..', 'assets', 'logo.webp'); // For local dev
    const logoPath = fs.existsSync(fallbackPath) ? fallbackPath : path.join(process.cwd(), 'node_modules', 'velix', 'assets', 'logo.webp');
    if (fs.existsSync(logoPath)) {
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
