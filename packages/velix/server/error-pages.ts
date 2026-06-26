/**
 * Velix v5 Error Pages
 * Beautiful error pages inspired by Next.js 15.2 design
 */

import { VERSION } from '../version.js';

export interface ErrorPageOptions {
  statusCode: number;
  title: string;
  message: string;
  stack?: string;
  isDev?: boolean;
  pathname?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate a styled 404 error page
 */
export function generate404Page(pathname: string = '/'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found | Velix v${VERSION}</title>
    <link rel="icon" href="/favicon.webp">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          margin: 0; 
          background: #161616;
          color: white; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          min-height: 100vh; 
          text-align: center;
          -webkit-font-smoothing: antialiased;
        }
        .container { 
          max-width: 700px; 
          padding: 60px 40px; 
          position: relative;
          z-index: 10;
        }
        h1 { 
          font-size: 160px; 
          font-weight: 900; 
          margin: 0; 
          background: linear-gradient(135deg, #00e87a 0%, #22d3ee 100%); 
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
          line-height: 1; 
          letter-spacing: -0.05em;
          animation: fadeIn 0.5s ease-out;
        }
        h2 { 
          font-size: 32px; 
          font-weight: 700; 
          margin: 24px 0 12px; 
          color: #ededed;
          animation: fadeIn 0.5s ease-out 0.1s backwards;
        }
        p { 
          color: #888; 
          font-size: 16px; 
          line-height: 1.7; 
          margin-bottom: 36px;
          animation: fadeIn 0.5s ease-out 0.2s backwards;
        }
        code { 
          background: #222; 
          padding: 3px 8px; 
          border-radius: 6px; 
          font-family: 'JetBrains Mono', monospace; 
          color: #00e87a; 
          font-size: 14px;
          border: 1px solid #333;
        }
        .btn-group {
          display: flex;
          gap: 12px;
          justify-content: center;
          animation: fadeIn 0.5s ease-out 0.3s backwards;
        }
        .btn { 
          display: inline-block; 
          background: #222; 
          color: white; 
          text-decoration: none; 
          padding: 12px 28px; 
          border-radius: 10px; 
          font-weight: 600; 
          font-size: 14px;
          transition: all 0.2s; 
          border: 1px solid #333;
          cursor: pointer;
        }
        .btn:hover { background: #333; }
        .btn-accent { 
          background: #00e87a; 
          color: #000; 
          border-color: #00e87a;
        }
        .btn-accent:hover { background: #00d46e; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page <code>${pathname}</code> could not be found.<br>It may have been moved or deleted.</p>
        <div class="btn-group">
          <a href="/" class="btn btn-accent">Return Home</a>
          <a href="javascript:history.back()" class="btn">Go Back</a>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate a styled 500 error page — inspired by Next.js 15.2.0 error overlay
 */
export function generate500Page(options: ErrorPageOptions): string {
  const { message, stack, isDev, pathname } = options;

  // Parse stack frames
  let frames: { funcName: string; file: string; line: string; col: string }[] = [];
  let sourceSnippet = '';
  let errorLine = 0;
  let errorFile = '';

  if (isDev && stack) {
    const stackLines = stack.split('\\n').filter(line => line.trim());
    frames = stackLines.slice(1)
      .filter(line => line.includes('at '))
      .map(frame => {
        const match = frame.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
                      frame.match(/at\s+(.+?):(\d+):(\d+)/);
        if (match && match.length === 5) {
          return { funcName: match[1].trim(), file: match[2], line: match[3], col: match[4] };
        }
        if (match && match.length === 4) {
          return { funcName: '(anonymous)', file: match[1].trim(), line: match[2], col: match[3] };
        }
        const simpleMatch = frame.match(/at\s+(.+)/);
        return { funcName: simpleMatch?.[1]?.trim() || 'unknown', file: '', line: '', col: '' };
      });

    // Read source file for the first user-land frame
    if (frames.length > 0) {
      const firstFrame = frames.find(f => f.file && !f.file.includes('node_modules')) || frames[0];
      errorFile = firstFrame.file;
      errorLine = parseInt(firstFrame.line, 10) || 0;
      if (errorFile && errorLine > 0) {
        try {
          const fs = require('fs');
          if (fs.existsSync(errorFile)) {
            const src: string[] = fs.readFileSync(errorFile, 'utf-8').split('\\n');
            const start = Math.max(0, errorLine - 3);
            const end = Math.min(src.length, errorLine + 3);
            sourceSnippet = src.slice(start, end).map((l: string, i: number) => {
              const num = start + i + 1;
              const isErr = num === errorLine;
              const prefix = isErr ? '> ' : '  ';
              const numStr = String(num).padStart(4, ' ');
              return `<div class="src-line${isErr ? ' src-err' : ''}">${prefix}${numStr} | ${escapeHtml(l)}</div>`;
            }).join('');
          }
        } catch (_) {
          // fs not available in edge runtime — skip source display
        }
      }
    }
  }

  const userFrames = frames.filter(f => f.file && !f.file.includes('node_modules'));
  const ignoredCount = frames.length - userFrames.length;

  // Shorten file path for display
  const shortFile = errorFile
    .replace(/\\/g, '/')
    .replace(/.*\/(?=app\/|server\/|src\/|pages\/)/, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error | Velix v${VERSION}</title>
    <link rel="icon" href="/favicon.webp">
    <style>
        :root {
          --bg-body: #000;
          --bg-card: #111;
          --border: #333;
          --text-main: #ededed;
          --text-muted: #888;
          --red-tag: #e5484d;
          --red-bg: rgba(229, 72, 77, 0.15);
          --code-bg: #000;
          --code-hl: rgba(255,255,255,0.1);
          --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: var(--bg-body);
          color: var(--text-main);
          font-family: var(--font-sans);
          min-height: 100vh;
          line-height: 1.7;
          margin-bottom: 12px;
          word-break: break-word;
        }
        .error-hint {
          color: #22c55e;
          font-size: 14px;
          margin-bottom: 20px;
        }

        /* Source block */
        .source-block {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .source-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #1e1e1e;
          border-bottom: 1px solid #2a2a2a;
          font-size: 13px;
          color: #aaa;
        }
        .source-header .file-icon { color: #666; margin-right: 8px; }
        .source-header a {
          color: #666;
          text-decoration: none;
          transition: color .15s;
        }
        .source-header a:hover { color: #fff; }
        .source-code {
          padding: 12px 0;
          overflow-x: auto;
          font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace;
          font-size: 13px;
          line-height: 1.7;
        }
        .src-line {
          padding: 0 16px;
          white-space: pre;
          color: #888;
        }
        .src-err {
          background: rgba(255,50,50,0.1);
          color: #ff8a8a;
          font-weight: 500;
        }

        /* Call stack */
        .stack-section { margin-bottom: 24px; }
        .stack-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .stack-label {
          font-size: 15px;
          font-weight: 700;
          color: #ededed;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stack-count {
          background: #2a2a2a;
          color: #aaa;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .stack-toggle {
          font-size: 13px;
          color: #888;
          cursor: pointer;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color .15s;
        }
        .stack-toggle:hover { color: #fff; }

        .frame {
          padding: 12px 0;
          border-bottom: 1px solid #1e1e1e;
        }
        .frame:last-child { border-bottom: none; }
        .frame-name {
          font-size: 14px;
          font-weight: 600;
          color: #ededed;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .frame-name a {
          color: #666;
          text-decoration: none;
          transition: color .15s;
        }
        .frame-name a:hover { color: #fff; }
        .frame-loc {
          font-size: 13px;
          color: #666;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }

        /* Footer */
        .footer-row {
          display: flex;
          justify-content: flex-end;
          padding: 16px 0;
          border-top: 1px solid #1e1e1e;
          margin-top: 8px;
        }
        .footer-row a {
          color: #ff6b6b;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity .15s;
        }
        .footer-row a:hover { opacity: 0.8; }

        /* Prod mode */
        .prod-card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
          margin-top: 32px;
        }
        .prod-card h2 { font-size: 20px; margin-bottom: 8px; color: #fff; }
        .prod-card p { font-size: 15px; color: #888; margin-bottom: 24px; }
        .prod-card a {
          display: inline-block;
          padding: 10px 24px;
          border-radius: 10px;
          background: #222;
          border: 1px solid #333;
          color: #fff;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          transition: all .15s;
        }
        .prod-card a:hover { background: #333; }
    </style>
</head>
<body>
    <div class="overlay">
        <!-- Top Bar -->
        <div class="top-bar">
            <div class="page-nav">
                <button id="prev-btn" onclick="changePage(-1)" disabled>‹</button>
                <span><span id="current-page">1</span>/<span id="total-pages">1</span></span>
                <button id="next-btn" onclick="changePage(1)" disabled>›</button>
            </div>
            <div class="version-badge">
                <span class="version-dot"></span>
                Velix v${VERSION} esbuild
            </div>
        </div>

        <!-- Error Tag -->
        <div class="error-tag">Unhandled Runtime Error</div>

        <!-- Error Message -->
        <div class="error-msg">${escapeHtml(message)}</div>
        ${pathname ? `<div class="error-hint">Check the render method of '<strong>${escapeHtml(pathname)}</strong>'.</div>` : ''}

        ${isDev && sourceSnippet ? `
        <!-- Source Code Block -->
        <div class="source-block">
            <div class="source-header">
                <span><span class="file-icon">⚙</span> ${escapeHtml(shortFile)}${errorLine ? ` (${errorLine})` : ''}${userFrames[0]?.funcName ? ` @ ${escapeHtml(userFrames[0].funcName)}` : ''}</span>
                <a href="#" title="Open in editor">↗</a>
            </div>
            <div class="source-code">${sourceSnippet}</div>
        </div>
        ` : ''}

        ${isDev && frames.length > 0 ? `
        <!-- Call Stack -->
        <div class="stack-section">
            <div class="stack-header">
                <div class="stack-label">
                    Call Stack
                    <span class="stack-count">${frames.length}</span>
                </div>
                ${ignoredCount > 0 ? `<button class="stack-toggle" onclick="toggleIgnored()">Show ${ignoredCount} ignore-listed frames ⇕</button>` : ''}
            </div>
            <div id="frames-list">
                ${userFrames.map((f, i) => `
                <div class="frame" data-frame="${i}">
                    <div class="frame-name">
                        <strong>${escapeHtml(f.funcName)}</strong>
                        <a href="#" title="Open in editor">↗</a>
                    </div>
                    <div class="frame-loc">${escapeHtml(f.file.replace(/.*[\\\/](?=app[\\\/]|server[\\\/]|src[\\\/]|pages[\\\/])/, ''))}${f.line ? ` (${f.line}:${f.col})` : ''}</div>
                </div>
                `).join('')}
            </div>
            <div id="ignored-frames" style="display:none;">
                ${frames.filter(f => !f.file || f.file.includes('node_modules')).map((f, i) => `
                <div class="frame" data-frame="ignored-${i}">
                    <div class="frame-name" style="color:#666;">
                        <strong>${escapeHtml(f.funcName)}</strong>
                    </div>
                    <div class="frame-loc">${escapeHtml(f.file)}${f.line ? ` (${f.line}:${f.col})` : ''}</div>
                </div>
                `).join('')}
            </div>
        </div>
        ` : `
        <div class="prod-card">
            <h2>Application Error</h2>
            <p>A server-side error occurred. Check your server logs for more details.</p>
            <a href="/">Return Home</a>
        </div>
        `}

        <!-- Footer -->
        <div class="footer-row">
            <a href="javascript:location.reload()">Was this helpful? ↻</a>
        </div>
    </div>

    <script>
        let currentPage = 1;
        const totalPages = 1;
        document.getElementById('total-pages').textContent = totalPages;

        function changePage(d) {
            const next = currentPage + d;
            if (next >= 1 && next <= totalPages) {
                currentPage = next;
                document.getElementById('current-page').textContent = currentPage;
                document.getElementById('prev-btn').disabled = currentPage === 1;
                document.getElementById('next-btn').disabled = currentPage === totalPages;
            }
        }

        function toggleIgnored() {
            const el = document.getElementById('ignored-frames');
            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') changePage(-1);
            if (e.key === 'ArrowRight') changePage(1);
        });
    </script>
</body>
</html>`;
}

/**
 * Generate error page based on status code
 */
export function generateErrorPage(statusCode: number, options: Partial<ErrorPageOptions> = {}): string {
  if (statusCode === 404) {
    return generate404Page(options.pathname || '/');
  }

  return generate500Page({
    statusCode,
    title: options.title || 'Server Error',
    message: options.message || 'An unexpected error occurred',
    stack: options.stack,
    isDev: options.isDev,
    pathname: options.pathname,
  });
}
