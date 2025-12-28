/**
 * FlexiReact Render System v2
 * SSR with layouts, loading states, error boundaries, and islands
 */

import React from 'react';
import { renderToString, renderToPipeableStream } from 'react-dom/server';
import { escapeHtml } from '../utils.js';

/**
 * Renders a page with all its layouts and wrappers
 */
export async function renderPage(options: any) {
  const {
    Component,
    props = {},
    layouts = [],
    loading = null,
    error = null,
    islands = [],
    title = 'FlexiReact App',
    meta = {},
    scripts = [],
    styles = [],
    favicon = null,
    isSSG = false,
    route = '/',
    needsHydration = false
  } = options;

  const renderStart = Date.now();

  try {
    // Build the component tree - start with the page component
    let element: any = React.createElement(Component, props);

    // Wrap with error boundary if error component exists
    if (error) {
      element = React.createElement(ErrorBoundaryWrapper as any, {
        fallback: error,
        children: element
      });
    }

    // Wrap with Suspense if loading component exists (for streaming/async)
    if (loading) {
      element = React.createElement(React.Suspense as any, {
        fallback: React.createElement(loading),
        children: element
      });
    }

    // Wrap with layouts (innermost to outermost)
    // Each layout receives children as a prop
    for (const layout of [...layouts].reverse()) {
      if (layout.Component) {
        const LayoutComponent = layout.Component;
        element = React.createElement(LayoutComponent, {
          ...layout.props
        }, element);
      }
    }

    // Render to string
    const content = renderToString(element);

    // Calculate render time
    const renderTime = Date.now() - renderStart;

    // Generate island hydration scripts
    const islandScripts = generateIslandScripts(islands);

    // Build full HTML document
    return buildHtmlDocument({
      content,
      title,
      meta,
      scripts: [...scripts, ...islandScripts],
      styles,
      favicon,
      props,
      isSSG,
      renderTime,
      route,
      isClientComponent: needsHydration
    });

  } catch (err) {
    console.error('Render Error:', err);
    throw err;
  }
}

/**
 * Streaming SSR with React 18
 * Renders the page progressively, sending HTML chunks as they become ready
 */
export async function renderPageStream(options: {
  Component: React.ComponentType<any>;
  props?: Record<string, any>;
  layouts?: Array<{ Component: React.ComponentType<any>; props?: Record<string, any> }>;
  loading?: React.ComponentType | null;
  error?: React.ComponentType<{ error: Error }> | null;
  title?: string;
  meta?: Record<string, string>;
  scripts?: Array<string | { src?: string; content?: string; type?: string }>;
  styles?: Array<string | { content: string }>;
  favicon?: string | null;
  route?: string;
  onShellReady?: () => void;
  onAllReady?: () => void;
  onError?: (error: Error) => void;
}): Promise<{ stream: NodeJS.ReadableStream; shellReady: Promise<void> }> {
  const {
    Component,
    props = {},
    layouts = [],
    loading = null,
    error = null,
    title = 'FlexiReact App',
    meta = {},
    scripts = [],
    styles = [],
    favicon = null,
    route = '/',
    onShellReady,
    onAllReady,
    onError
  } = options;

  const renderStart = Date.now();

  // Build the component tree
  let element: any = React.createElement(Component, props);

  // Wrap with error boundary if error component exists
  if (error) {
    element = React.createElement(ErrorBoundaryWrapper as any, {
      fallback: error,
      children: element
    });
  }

  // Wrap with Suspense if loading component exists
  if (loading) {
    element = React.createElement(React.Suspense as any, {
      fallback: React.createElement(loading),
      children: element
    });
  }

  // Wrap with layouts
  for (const layout of [...layouts].reverse()) {
    if (layout.Component) {
      element = React.createElement(layout.Component, layout.props, element);
    }
  }

  // Create the full document wrapper
  const DocumentWrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement('html', { lang: 'en', className: 'dark' },
      React.createElement('head', null,
        React.createElement('meta', { charSet: 'UTF-8' }),
        React.createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
        React.createElement('title', null, title),
        favicon && React.createElement('link', { rel: 'icon', href: favicon }),
        ...Object.entries(meta).map(([name, content]) =>
          React.createElement('meta', { key: name, name, content })
        ),
        ...styles.map((style, i) =>
          typeof style === 'string'
            ? React.createElement('link', { key: i, rel: 'stylesheet', href: style })
            : React.createElement('style', { key: i, dangerouslySetInnerHTML: { __html: style.content } })
        )
      ),
      React.createElement('body', null,
        React.createElement('div', { id: 'root' }, children),
        ...scripts.map((script, i) =>
          typeof script === 'string'
            ? React.createElement('script', { key: i, src: script })
            : script.src
              ? React.createElement('script', { key: i, src: script.src, type: script.type })
              : React.createElement('script', { key: i, type: script.type, dangerouslySetInnerHTML: { __html: script.content } })
        )
      )
    );
  };

  const fullElement = React.createElement(DocumentWrapper, null, element);

  // Create streaming render
  let shellReadyResolve: () => void;
  const shellReady = new Promise<void>((resolve) => {
    shellReadyResolve = resolve;
  });

  const { pipe, abort } = renderToPipeableStream(fullElement, {
    onShellReady() {
      const renderTime = Date.now() - renderStart;
      console.log(`⚡ Shell ready in ${renderTime}ms`);
      shellReadyResolve();
      onShellReady?.();
    },
    onAllReady() {
      const renderTime = Date.now() - renderStart;
      console.log(`✨ All content ready in ${renderTime}ms`);
      onAllReady?.();
    },
    onError(err: unknown) {
      console.error('Streaming SSR Error:', err);
      onError?.(err as Error);
    }
  });

  // Create a passthrough stream
  const { PassThrough } = await import('stream');
  const passThrough = new PassThrough();

  // Pipe the render stream to our passthrough
  pipe(passThrough);

  return {
    stream: passThrough,
    shellReady
  };
}

/**
 * Render to stream for HTTP response
 * Use this in the server to stream HTML to the client
 */
export function streamToResponse(
  res: { write: (chunk: string) => void; end: () => void },
  stream: NodeJS.ReadableStream,
  options: { onFinish?: () => void } = {}
): void {
  stream.on('data', (chunk) => {
    res.write(chunk.toString());
  });

  stream.on('end', () => {
    res.end();
    options.onFinish?.();
  });

  stream.on('error', (err) => {
    console.error('Stream error:', err);
    res.end();
  });
}

/**
 * Error Boundary Wrapper for SSR
 */
interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error }>;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryWrapper extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return React.createElement(FallbackComponent, { error: this.state.error! });
    }
    return this.props.children;
  }
}

/**
 * Generates hydration scripts for islands
 */
function generateIslandScripts(islands: any[]) {
  if (!islands.length) return [];

  const scripts = [];

  for (const island of islands) {
    scripts.push({
      type: 'module',
      content: `
        import { hydrateIsland } from '/_flexi/client.js';
        import ${island.name} from '${island.clientPath}';
        hydrateIsland('${island.id}', ${island.name}, ${JSON.stringify(island.props)});
      `
    });
  }

  return scripts;
}

/**
 * Generates the Dev Toolbar HTML (FlexiReact v4 - Premium DevTools)
 */
interface DevToolbarOptions {
  renderTime?: number;
  pageType?: string;
  route?: string;
  hasError?: boolean;
  isHydrated?: boolean;
  errorMessage?: string | null;
  componentName?: string | null;
}

function generateDevToolbar(options: DevToolbarOptions = {}) {
  const {
    renderTime = 0,
    pageType = 'SSR',
    route = '/',
    hasError = false,
    isHydrated = false,
    errorMessage = null,
    componentName = null
  } = options;

  const timeColor = renderTime < 50 ? '#00FF9C' : renderTime < 200 ? '#fbbf24' : '#ef4444';
  const timeLabel = renderTime < 50 ? 'Fast' : renderTime < 200 ? 'OK' : 'Slow';

  return `
<!-- FlexiReact v4.1.0 Dev Toolbar -->
<div id="flexi-dev-toolbar" class="flexi-dev-collapsed">
  <style>
    #flexi-dev-toolbar {
      position: fixed;
      bottom: 16px;
      left: 16px;
      z-index: 99999;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
    }
    
    /* Main Button */
    .flexi-dev-trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(10, 10, 10, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 255, 156, 0.2);
      border-radius: 10px;
      color: #fafafa;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    
    .flexi-dev-trigger:hover {
      border-color: rgba(0, 255, 156, 0.5);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 255, 156, 0.15);
      transform: translateY(-2px);
    }
    
    .flexi-dev-trigger.has-error {
      border-color: rgba(239, 68, 68, 0.5);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(239, 68, 68, 0.2);
    }
    
    .flexi-dev-logo {
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, #00FF9C, #00D68F);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 11px;
      color: #000;
    }
    
    .flexi-dev-trigger.has-error .flexi-dev-logo {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    
    .flexi-dev-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .flexi-dev-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00FF9C;
      box-shadow: 0 0 8px rgba(0, 255, 156, 0.6);
    }
    
    .flexi-dev-dot.error {
      background: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
      animation: errorPulse 1s infinite;
    }
    
    @keyframes errorPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    
    .flexi-dev-time {
      font-size: 11px;
      font-weight: 600;
      color: ${timeColor};
      font-variant-numeric: tabular-nums;
    }
    
    /* Panel */
    .flexi-dev-panel {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 0;
      min-width: 340px;
      background: rgba(10, 10, 10, 0.98);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(8px) scale(0.96);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
      overflow: hidden;
    }
    
    #flexi-dev-toolbar.flexi-dev-open .flexi-dev-panel {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }
    
    /* Header */
    .flexi-dev-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(0, 255, 156, 0.08), rgba(0, 214, 143, 0.04));
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .flexi-dev-header-logo {
      width: 26px;
      height: 26px;
      background: linear-gradient(135deg, #00FF9C, #00D68F);
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      color: #000;
    }
    
    .flexi-dev-header-info {
      flex: 1;
    }
    
    .flexi-dev-header-title {
      font-weight: 700;
      font-size: 14px;
      color: #fafafa;
    }
    
    .flexi-dev-header-subtitle {
      font-size: 11px;
      color: #52525b;
      margin-top: 1px;
    }
    
    .flexi-dev-close {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: none;
      border-radius: 6px;
      color: #71717a;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .flexi-dev-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fafafa;
    }
    
    /* Content */
    .flexi-dev-content {
      padding: 12px 16px;
    }
    
    .flexi-dev-section {
      margin-bottom: 12px;
    }
    
    .flexi-dev-section:last-child {
      margin-bottom: 0;
    }
    
    .flexi-dev-section-title {
      font-size: 10px;
      font-weight: 600;
      color: #52525b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .flexi-dev-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    
    .flexi-dev-stat {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 10px 12px;
    }
    
    .flexi-dev-stat-label {
      font-size: 10px;
      color: #52525b;
      margin-bottom: 4px;
    }
    
    .flexi-dev-stat-value {
      font-size: 14px;
      font-weight: 600;
      color: #fafafa;
    }
    
    .flexi-dev-stat-value.success { color: #00FF9C; }
    .flexi-dev-stat-value.warning { color: #fbbf24; }
    .flexi-dev-stat-value.error { color: #ef4444; }
    
    /* Badges */
    .flexi-dev-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    
    .flexi-dev-badge.ssr { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .flexi-dev-badge.ssg { background: rgba(0, 255, 156, 0.15); color: #00FF9C; }
    .flexi-dev-badge.csr { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }
    .flexi-dev-badge.isr { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
    
    /* Error Display */
    .flexi-dev-error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 10px;
      padding: 12px;
      margin-top: 8px;
    }
    
    .flexi-dev-error-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #ef4444;
      margin-bottom: 6px;
    }
    
    .flexi-dev-error-message {
      font-size: 12px;
      color: #fca5a5;
      font-family: 'SF Mono', 'Fira Code', monospace;
      word-break: break-word;
      line-height: 1.5;
    }
    
    /* Footer */
    .flexi-dev-footer {
      display: flex;
      gap: 6px;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .flexi-dev-action {
      flex: 1;
      padding: 8px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      color: #71717a;
      font-size: 11px;
      font-weight: 500;
      text-decoration: none;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .flexi-dev-action:hover {
      background: rgba(0, 255, 156, 0.1);
      border-color: rgba(0, 255, 156, 0.2);
      color: #00FF9C;
    }
  </style>
  
  <button class="flexi-dev-trigger ${hasError ? 'has-error' : ''}" onclick="this.parentElement.classList.toggle('flexi-dev-open')">
    <div class="flexi-dev-logo">F</div>
    <div class="flexi-dev-indicator">
      <div class="flexi-dev-dot ${hasError ? 'error' : ''}"></div>
      <span class="flexi-dev-time">${renderTime}ms</span>
    </div>
  </button>
  
  <div class="flexi-dev-panel">
    <div class="flexi-dev-header">
      <div class="flexi-dev-header-logo">F</div>
      <div class="flexi-dev-header-info">
        <div class="flexi-dev-header-title">FlexiReact</div>
        <div class="flexi-dev-header-subtitle">v4.1.0 • Development</div>
      </div>
      <button class="flexi-dev-close" onclick="this.closest('#flexi-dev-toolbar').classList.remove('flexi-dev-open')">✕</button>
    </div>
    
    <div class="flexi-dev-content">
      <div class="flexi-dev-section">
        <div class="flexi-dev-section-title">Page Info</div>
        <div class="flexi-dev-grid">
          <div class="flexi-dev-stat">
            <div class="flexi-dev-stat-label">Route</div>
            <div class="flexi-dev-stat-value">${route}</div>
          </div>
          <div class="flexi-dev-stat">
            <div class="flexi-dev-stat-label">Type</div>
            <div class="flexi-dev-stat-value"><span class="flexi-dev-badge ${pageType.toLowerCase()}">${pageType}</span></div>
          </div>
        </div>
      </div>
      
      <div class="flexi-dev-section">
        <div class="flexi-dev-section-title">Performance</div>
        <div class="flexi-dev-grid">
          <div class="flexi-dev-stat">
            <div class="flexi-dev-stat-label">Render Time</div>
            <div class="flexi-dev-stat-value ${renderTime < 50 ? 'success' : renderTime < 200 ? 'warning' : 'error'}">${renderTime}ms <small style="color:#52525b">${timeLabel}</small></div>
          </div>
          <div class="flexi-dev-stat">
            <div class="flexi-dev-stat-label">Hydration</div>
            <div class="flexi-dev-stat-value" id="flexi-hydration-status">${isHydrated ? '✓ Client' : '○ Server'}</div>
          </div>
        </div>
      </div>
      
      ${hasError && errorMessage ? `
      <div class="flexi-dev-error">
        <div class="flexi-dev-error-title">
          <span>⚠</span> Runtime Error
        </div>
        <div class="flexi-dev-error-message">${errorMessage}</div>
      </div>
      ` : ''}
    </div>
    
    <div class="flexi-dev-footer">
      <a href="/_flexi/routes" class="flexi-dev-action">Routes</a>
      <button class="flexi-dev-action" onclick="location.reload()">Refresh</button>
      <a href="https://github.com/flexireact/flexireact" target="_blank" class="flexi-dev-action">Docs ↗</a>
    </div>
  </div>
</div>

<script>
  // FlexiReact v4 DevTools
  window.__FLEXI_DEV__ = {
    version: '4.1.0',
    renderTime: ${renderTime},
    pageType: '${pageType}',
    route: '${route}',
    hydrated: false,
    errors: []
  };
  
  // Track hydration
  const root = document.getElementById('root');
  if (root) {
    const observer = new MutationObserver(() => {
      if (root.children.length > 0) {
        window.__FLEXI_DEV__.hydrated = true;
        const el = document.getElementById('flexi-hydration-status');
        if (el) el.textContent = '✓ Client';
        observer.disconnect();
      }
    });
    observer.observe(root, { childList: true, subtree: true });
  }
  
  // Capture runtime errors
  window.addEventListener('error', (e) => {
    window.__FLEXI_DEV__.errors.push({
      message: e.message,
      file: e.filename,
      line: e.lineno,
      col: e.colno
    });
    console.error('%c[FlexiReact Error]', 'color: #ef4444; font-weight: bold;', e.message);
  });
  
  // Console branding
  console.log(
    '%c ⚡ FlexiReact v4.1.0 %c ${pageType} %c ${renderTime}ms ',
    'background: #00FF9C; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;',
    'background: #1e1e1e; color: #fafafa; padding: 2px 6px;',
    'background: ${timeColor}20; color: ${timeColor}; padding: 2px 6px; border-radius: 0 4px 4px 0;'
  );
</script>
`;
}

/**
 * Builds complete HTML document
 */
function buildHtmlDocument(options: any) {
  const {
    content,
    title,
    meta = {},
    scripts = [],
    styles = [],
    props = {},
    isSSG = false,
    renderTime = 0,
    route = '/',
    isClientComponent = false,
    favicon = null
  } = options;

  const metaTags = Object.entries(meta)
    .map(([name, content]) => {
      if (name.startsWith('og:')) {
        return `<meta property="${escapeHtml(name)}" content="${escapeHtml(content as string)}">`;
      }
      return `<meta name="${escapeHtml(name)}" content="${escapeHtml(content as string)}">`;
    })
    .join('\n    ');

  const styleTags = styles
    .map((style: any) => {
      if (typeof style === 'string') {
        return `<link rel="stylesheet" href="${escapeHtml(style)}">`;
      }
      return `<style>${style.content}</style>`;
    })
    .join('\n    ');

  const scriptTags = scripts
    .map((script: any) => {
      if (typeof script === 'string') {
        return `<script src="${escapeHtml(script)}"></script>`;
      }
      const type = script.type ? ` type="${script.type}"` : '';
      if (script.src) {
        return `<script${type} src="${escapeHtml(script.src)}"></script>`;
      }
      return `<script${type}>${script.content}</script>`;
    })
    .join('\n    ');

  // FlexiReact SVG favicon (properly encoded)
  const faviconSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#00FF9C"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#000" font-family="system-ui" font-weight="bold" font-size="16">F</text></svg>`);

  // Generate Dev Toolbar for development mode
  const isDev = process.env.NODE_ENV !== 'production';
  const pageType = isSSG ? 'SSG' : isClientComponent ? 'CSR' : 'SSR';
  const devToolbar = isDev ? generateDevToolbar({
    renderTime,
    pageType,
    route,
    isHydrated: isClientComponent
  }) : '';

  // Determine favicon link
  const faviconLink = favicon
    ? `<link rel="icon" href="${escapeHtml(favicon)}">`
    : `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${faviconSvg}">`;

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    ${faviconLink}
    ${metaTags}
    <style>
      :root { --flexi-bg: #0f172a; --flexi-fg: #f8fafc; }
      html, body { background-color: #0f172a; color: #f8fafc; min-height: 100vh; margin: 0; }
    </style>
    ${styleTags}
    <script>
      (function() {
        var theme = localStorage.getItem('theme');
        if (theme === 'light') {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.backgroundColor = '#ffffff';
          document.documentElement.style.color = '#0f172a';
          document.body.style.backgroundColor = '#ffffff';
          document.body.style.color = '#0f172a';
        }
      })();
    </script>
</head>
<body>
    <div id="root">${content}</div>
    <script>
      window.__FLEXI_DATA__ = ${JSON.stringify({ props, isSSG })};
    </script>
    ${scriptTags}
    ${devToolbar}
</body>
</html>`;
}

/**
 * Renders an error page with beautiful styling (FlexiReact v4)
 */
export function renderError(statusCode: number, message: string, stack: string | null = null) {
  const showStack = process.env.NODE_ENV !== 'production' && stack;
  const isDev = process.env.NODE_ENV !== 'production';

  // Parse error for better display
  const errorDetails = parseErrorStack(stack);

  // Different messages for different status codes
  const errorMessages = {
    404: { title: 'Page Not Found', icon: 'search', color: '#00FF9C', desc: 'The page you\'re looking for doesn\'t exist or has been moved.' },
    500: { title: 'Server Error', icon: 'alert', color: '#ef4444', desc: 'Something went wrong on our end.' },
    403: { title: 'Forbidden', icon: 'lock', color: '#f59e0b', desc: 'You don\'t have permission to access this resource.' },
    401: { title: 'Unauthorized', icon: 'key', color: '#8b5cf6', desc: 'Please log in to access this page.' },
  };

  const errorInfo = (errorMessages as Record<number, any>)[statusCode] || { title: 'Error', icon: 'alert', color: '#ef4444', desc: message };

  // Generate error frames HTML for dev mode
  const errorFramesHtml = showStack && errorDetails?.frames?.length && errorDetails.frames.length > 0
    ? errorDetails.frames.slice(0, 5).map((frame: any, i: number) => `
        <div class="error-frame ${i === 0 ? 'error-frame-first' : ''}">
          <div class="error-frame-fn">${escapeHtml(frame.fn)}</div>
          <div class="error-frame-loc">${escapeHtml(frame.file)}:${frame.line}:${frame.col}</div>
        </div>
      `).join('')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${statusCode} - ${errorInfo.title} | FlexiReact</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2300FF9C'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' fill='%23000' font-family='system-ui' font-weight='bold' font-size='16'%3EF%3C/text%3E%3C/svg%3E">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        min-height: 100vh;
        background: #0a0a0a;
        color: #fafafa;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-x: hidden;
      }
      
      /* Animated background */
      .bg-pattern {
        position: fixed;
        inset: 0;
        background-image: 
          radial-gradient(circle at 25% 25%, rgba(0, 255, 156, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.03) 0%, transparent 50%);
        pointer-events: none;
      }
      
      .bg-grid {
        position: fixed;
        inset: 0;
        background-image: 
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        background-size: 64px 64px;
        pointer-events: none;
      }
      
      .container {
        position: relative;
        width: 100%;
        max-width: ${showStack ? '800px' : '500px'};
        padding: 2rem;
        animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Error Card */
      .error-card {
        background: linear-gradient(145deg, rgba(23, 23, 23, 0.9), rgba(10, 10, 10, 0.95));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 3rem;
        text-align: center;
        backdrop-filter: blur(20px);
        box-shadow: 
          0 0 0 1px rgba(255, 255, 255, 0.05),
          0 20px 50px -20px rgba(0, 0, 0, 0.5),
          0 0 100px -50px ${errorInfo.color}40;
      }
      
      /* Logo */
      .logo {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #00FF9C, #00D68F);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 2rem;
        font-weight: 800;
        font-size: 24px;
        color: #000;
        box-shadow: 0 0 30px rgba(0, 255, 156, 0.3);
      }
      
      /* Error Code */
      .error-code {
        font-size: 7rem;
        font-weight: 800;
        line-height: 1;
        background: linear-gradient(135deg, ${errorInfo.color}, ${errorInfo.color}99);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.5rem;
        letter-spacing: -4px;
      }
      
      .error-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #fafafa;
        margin-bottom: 0.75rem;
      }
      
      .error-desc {
        font-size: 1rem;
        color: #71717a;
        line-height: 1.6;
        margin-bottom: 2rem;
      }
      
      /* Buttons */
      .buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        text-decoration: none;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        border: none;
        cursor: pointer;
      }
      
      .btn-primary {
        background: #00FF9C;
        color: #000;
        box-shadow: 0 0 20px rgba(0, 255, 156, 0.3);
      }
      
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 30px rgba(0, 255, 156, 0.5);
      }
      
      .btn-secondary {
        background: rgba(255, 255, 255, 0.06);
        color: #a1a1aa;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fafafa;
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      /* Error Stack (Dev Mode) */
      .error-stack {
        margin-top: 2rem;
        text-align: left;
      }
      
      .error-stack-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 12px;
        font-weight: 600;
        color: #ef4444;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .error-stack-header::before {
        content: '';
        width: 8px;
        height: 8px;
        background: #ef4444;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .error-message {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 13px;
        color: #fca5a5;
        word-break: break-word;
      }
      
      .error-frames {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        overflow: hidden;
      }
      
      .error-frame {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 12px;
      }
      
      .error-frame:last-child {
        border-bottom: none;
      }
      
      .error-frame-first {
        background: rgba(239, 68, 68, 0.05);
      }
      
      .error-frame-fn {
        color: #fafafa;
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .error-frame-loc {
        color: #52525b;
        font-size: 11px;
      }
      
      /* Dev Badge */
      .dev-badge {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        color: #71717a;
        backdrop-filter: blur(10px);
      }
      
      .dev-badge-dot {
        width: 8px;
        height: 8px;
        background: #00FF9C;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0, 255, 156, 0.5);
      }
    </style>
</head>
<body>
    <div class="bg-pattern"></div>
    <div class="bg-grid"></div>
    
    <div class="container">
      <div class="error-card">
        <div class="logo">F</div>
        
        <div class="error-code">${statusCode}</div>
        <h1 class="error-title">${errorInfo.title}</h1>
        <p class="error-desc">${errorInfo.desc}</p>
        
        <div class="buttons">
          <a href="/" class="btn btn-primary">
            ← Back to Home
          </a>
          <a href="javascript:history.back()" class="btn btn-secondary">
            Go Back
          </a>
        </div>
        
        ${showStack ? `
        <div class="error-stack">
          <div class="error-stack-header">Error Details</div>
          <div class="error-message">${escapeHtml(message)}</div>
          ${errorFramesHtml ? `<div class="error-frames">${errorFramesHtml}</div>` : ''}
        </div>
        ` : ''}
      </div>
    </div>
    
    ${isDev ? `
    <div class="dev-badge">
      <div class="dev-badge-dot"></div>
      FlexiReact v4.1.0
    </div>
    ` : ''}
</body>
</html>`;
}

/**
 * Parses error stack for better display
 */
function parseErrorStack(stack: string | null): { message: string; frames: Array<{ fn: string; file: string; line: string; col: string }> } | null {
  if (!stack) return null;

  const lines = stack.split('\n');
  const parsed: { message: string; frames: Array<{ fn: string; file: string; line: string; col: string }> } = {
    message: lines[0] || '',
    frames: []
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
      line.match(/at\s+(.+?):(\d+):(\d+)/);

    if (match) {
      parsed.frames.push({
        fn: match[1] || 'anonymous',
        file: match[2] || match[1],
        line: match[3] || match[2],
        col: match[4] || match[3]
      });
    }
  }

  return parsed;
}

/**
 * Renders a loading state
 */
export function renderLoading(LoadingComponent: React.ComponentType | null) {
  if (!LoadingComponent) {
    return `<div class="flexi-loading">
      <div class="flexi-spinner"></div>
      <style>
        .flexi-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }
        .flexi-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>`;
  }

  return renderToString(React.createElement(LoadingComponent));
}

export default {
  renderPage,
  renderError,
  renderLoading
};
