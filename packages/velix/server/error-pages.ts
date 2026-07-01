/**
 * Velix v5 Error Pages
 * Pixel-perfect error overlay inspired by Next.js 16 design
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
 * Generate a styled 404 error page — Next.js 16 style
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
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #0a0a0a;
          color: #ededed;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          display: flex;
          align-items: center;
          gap: 32px;
          padding: 32px;
        }
        .code {
          font-size: 48px;
          font-weight: 700;
          line-height: 1;
          color: #fff;
          border-right: 1px solid rgba(255,255,255,0.15);
          padding-right: 32px;
        }
        .body h1 {
          font-size: 18px;
          font-weight: 600;
          color: #ededed;
          margin-bottom: 8px;
        }
        .body p {
          font-size: 14px;
          color: #888;
          margin-bottom: 20px;
        }
        .body p code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          background: rgba(255,255,255,0.07);
          padding: 2px 6px;
          border-radius: 4px;
          color: #ccc;
        }
        .actions { display: flex; gap: 10px; }
        .btn {
          display: inline-block;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all .15s;
          border: 1px solid transparent;
        }
        .btn-primary {
          background: #fff;
          color: #000;
        }
        .btn-primary:hover { background: #e5e5e5; }
        .btn-secondary {
          background: rgba(255,255,255,0.06);
          color: #ededed;
          border-color: rgba(255,255,255,0.1);
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="code">404</div>
        <div class="body">
            <h1>This page could not be found</h1>
            <p>The path <code>${escapeHtml(pathname)}</code> does not exist.</p>
            <div class="actions">
                <a href="/" class="btn btn-primary">Return Home</a>
                <a href="javascript:history.back()" class="btn btn-secondary">Go Back</a>
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate a styled 500 error page — Next.js 16 dev overlay style
 */
export function generate500Page(options: ErrorPageOptions): string {
  const { message, stack, isDev, pathname } = options;

  type StackFrame = { call: string; file: string; line: number | null };

  // Parse stack frames
  let frames: StackFrame[] = [];
  let sourceSnippet = '';
  let errorLine = 0;
  let errorFile = '';

  if (isDev && stack) {
    const stackLines = stack.split('\n').filter((l: string) => l.trim());
    frames = stackLines.slice(1)
      .filter((line: string) => line.includes('at '))
      .map((frame: string): StackFrame => {
        // "at funcName (file:line:col)" or "at file:line:col"
        const m1 = frame.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
        if (m1) return { call: m1[1].trim(), file: m1[2], line: parseInt(m1[3], 10) };
        const m2 = frame.match(/at\s+(.+?):(\d+):\d+/);
        if (m2) return { call: '(anonymous)', file: m2[1].trim(), line: parseInt(m2[2], 10) };
        return { call: frame.replace(/^\s*at\s+/, '').trim(), file: '', line: null };
      });

    // Source snippet from first user-land frame
    const firstUserFrame = frames.find(f => f.file && !f.file.includes('node_modules')) || frames[0];
    if (firstUserFrame) {
      errorFile = firstUserFrame.file;
      errorLine = firstUserFrame.line || 0;
      if (errorFile && errorLine > 0) {
        try {
          const fs = require('fs');
          if (fs.existsSync(errorFile)) {
            const src: string[] = fs.readFileSync(errorFile, 'utf-8').split('\n');
            const start = Math.max(0, errorLine - 4);
            const end = Math.min(src.length, errorLine + 3);
            sourceSnippet = src.slice(start, end).map((l: string, i: number) => {
              const num = start + i + 1;
              const isErr = num === errorLine;
              const numStr = String(num).padStart(3, ' ');
              if (isErr) {
                return `<div class="src-line src-err"><span class="ln">${numStr}</span>${escapeHtml(l)}</div>`;
              }
              return `<div class="src-line"><span class="ln">${numStr}</span>${escapeHtml(l)}</div>`;
            }).join('');
          }
        } catch (_) {}
      }
    }
  }

  const userFrames = frames.filter(f => f.file && !f.file.includes('node_modules'));
  const ignoredFrames = frames.filter(f => !f.file || f.file.includes('node_modules'));

  const shortFile = errorFile
    .replace(/\\/g, '/')
    .replace(/.*\/(?=app\/|server\/|src\/|pages\/)/, '');

  // ── PRODUCTION mode: clean page ────────────────────────────────────────────
  if (!isDev) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>500 - Internal Server Error | Velix</title>
    <link rel="icon" href="/favicon.webp">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #0a0a0a;
          color: #ededed;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        .container { display: flex; align-items: center; gap: 32px; padding: 32px; }
        .code { font-size: 48px; font-weight: 700; color: #fff; border-right: 1px solid rgba(255,255,255,0.15); padding-right: 32px; }
        .body h1 { font-size: 18px; font-weight: 600; color: #ededed; margin-bottom: 8px; }
        .body p { font-size: 14px; color: #888; margin-bottom: 20px; }
        .btn { display: inline-block; padding: 8px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none; background: #fff; color: #000; transition: all .15s; }
        .btn:hover { background: #e5e5e5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="code">500</div>
        <div class="body">
            <h1>Internal Server Error</h1>
            <p>A server-side exception has occurred. Please try again later.</p>
            <a href="/" class="btn">Return Home</a>
        </div>
    </div>
</body>
</html>`;
  }

  // ── DEVELOPMENT mode: full overlay ─────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error | Velix v${VERSION}</title>
    <link rel="icon" href="/favicon.webp">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: rgba(0, 0, 0, 0.85);
          color: #ededed;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Overlay Card ── */
        .overlay {
          width: 100%;
          max-width: 940px;
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 48px);
        }

        /* ── Header Bar ── */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: #161616;
          border-bottom: 1px solid #2a2a2a;
          gap: 12px;
          flex-shrink: 0;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #888;
        }
        .counter-badge {
          background: #1e1e1e;
          border: 1px solid #333;
          border-radius: 6px;
          padding: 2px 8px;
          font-size: 12px;
          color: #999;
          font-variant-numeric: tabular-nums;
        }
        .nav-btn {
          background: #1e1e1e;
          border: 1px solid #333;
          border-radius: 6px;
          color: #888;
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          transition: all .15s;
        }
        .nav-btn:hover:not(:disabled) { background: #2a2a2a; color: #fff; }
        .nav-btn:disabled { opacity: 0.3; cursor: default; }
        .framework-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #666;
        }
        .framework-tag::before {
          content: '';
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #3b82f6;
        }

        /* ── Scrollable Content ── */
        .content {
          overflow-y: auto;
          flex: 1;
        }

        /* ── Error Summary ── */
        .error-summary {
          padding: 28px 24px 20px;
          border-bottom: 1px solid #1e1e1e;
        }
        .error-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #f87171;
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.25);
          padding: 3px 8px;
          border-radius: 4px;
          margin-bottom: 14px;
        }
        .error-label svg { width: 10px; height: 10px; fill: currentColor; }
        .error-message {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.5;
          color: #fff;
          word-break: break-word;
        }
        .error-location {
          margin-top: 10px;
          font-size: 13px;
          color: #888;
        }
        .error-location strong { color: #ccc; }

        /* ── Source Block ── */
        .source-block {
          border-bottom: 1px solid #1e1e1e;
        }
        .source-topbar {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          background: #161616;
          border-bottom: 1px solid #1e1e1e;
          gap: 8px;
          font-size: 12px;
          color: #666;
        }
        .source-topbar .filepath { color: #aaa; font-family: ui-monospace, monospace; }
        .source-code {
          background: #0d0d0d;
          overflow-x: auto;
          padding: 10px 0;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 13px;
          line-height: 1.7;
        }
        .src-line {
          display: flex;
          align-items: flex-start;
          padding: 0 20px;
          white-space: pre;
          color: #555;
        }
        .src-line .ln {
          color: #3a3a3a;
          text-align: right;
          width: 36px;
          margin-right: 16px;
          flex-shrink: 0;
          user-select: none;
        }
        .src-err {
          background: rgba(239, 68, 68, 0.08);
          color: #fca5a5;
          position: relative;
        }
        .src-err .ln { color: #ef4444; }
        .src-err::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0; bottom: 0;
          width: 3px;
          background: #ef4444;
        }

        /* ── Call Stack ── */
        .callstack {
          padding: 20px 24px;
        }
        .callstack-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .callstack-title {
          font-size: 13px;
          font-weight: 600;
          color: #aaa;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .ignore-btn {
          font-size: 12px;
          color: #555;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color .15s;
        }
        .ignore-btn:hover { color: #aaa; }
        .ignore-caret { transition: transform .2s; }
        .ignore-btn.open .ignore-caret { transform: rotate(90deg); }

        .frame {
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 4px;
          font-size: 13px;
          cursor: default;
        }
        .frame:hover { background: rgba(255,255,255,0.03); }
        .frame-call {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 3px;
        }
        .frame-loc {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          color: #555;
        }
        .frame.ignored .frame-call { color: #444; }

        .ignored-section { margin-top: 8px; display: none; }
        .ignored-section.open { display: block; }
    </style>
</head>
<body>
    <div class="overlay">

      <!-- Header bar -->
      <div class="header">
        <div class="header-left">
          <button class="nav-btn" disabled>‹</button>
          <span class="counter-badge">1 / 1</span>
          <button class="nav-btn" disabled>›</button>
          <span style="margin-left: 4px;">Unhandled Runtime Error</span>
        </div>
        <div class="framework-tag">Velix v${VERSION} · esbuild</div>
      </div>

      <!-- Scrollable content -->
      <div class="content">

        <!-- Error summary -->
        <div class="error-summary">
          <div class="error-label">
            <svg viewBox="0 0 16 16"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.5a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4zm.75 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"/></svg>
            Runtime Error
          </div>
          <div class="error-message">${escapeHtml(message)}</div>
          ${pathname ? `<div class="error-location">in <strong>${escapeHtml(pathname)}</strong></div>` : ''}
        </div>

        ${sourceSnippet ? `
        <!-- Source code snippet -->
        <div class="source-block">
          <div class="source-topbar">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><polyline stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="14 2 14 8 20 8"/></svg>
            <span class="filepath">${escapeHtml(shortFile)}${errorLine ? `:${errorLine}` : ''}</span>
          </div>
          <div class="source-code">${sourceSnippet}</div>
        </div>
        ` : ''}

        <!-- Call stack -->
        <div class="callstack">
          <div class="callstack-header">
            <div class="callstack-title">Call Stack</div>
            ${ignoredFrames.length > 0 ? `
            <button class="ignore-btn" id="ignoreBtn" onclick="toggleIgnored()">
              <svg class="ignore-caret" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              ${ignoredFrames.length} ignored frames
            </button>
            ` : ''}
          </div>

          <!-- User frames -->
          ${userFrames.map((f: StackFrame) => `
          <div class="frame">
            <div class="frame-call">${escapeHtml(f.call)}</div>
            <div class="frame-loc">${escapeHtml(f.file.replace(/\\/g, '/').replace(/.*\/(?=app\/|server\/|src\/|pages\/)/, ''))}${f.line ? `:${f.line}` : ''}</div>
          </div>
          `).join('')}

          <!-- Ignored frames -->
          ${ignoredFrames.length > 0 ? `
          <div class="ignored-section" id="ignoredSection">
            ${ignoredFrames.map((f: StackFrame) => `
            <div class="frame ignored">
              <div class="frame-call">${escapeHtml(f.call)}</div>
              <div class="frame-loc">${escapeHtml(f.file)}${f.line ? `:${f.line}` : ''}</div>
            </div>
            `).join('')}
          </div>
          ` : ''}
        </div>

      </div><!-- /content -->
    </div><!-- /overlay -->

    <script>
      function toggleIgnored() {
        const btn = document.getElementById('ignoreBtn');
        const sec = document.getElementById('ignoredSection');
        if (!btn || !sec) return;
        const open = sec.classList.toggle('open');
        btn.classList.toggle('open', open);
      }
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
