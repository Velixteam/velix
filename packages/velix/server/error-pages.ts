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
 * Generate a styled 404 error page — Velix branding
 */
export function generate404Page(pathname: string = '/'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 — Page Not Found | Velix v${VERSION}</title>
    <link rel="icon" href="/favicon.webp">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        body {
          background-color: #0B1120;
          background-image:
            linear-gradient(to right,  rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          color: #F8FAFC;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          -webkit-font-smoothing: antialiased;
        }

        /* radial vignette over the grid */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, #0B1120 80%);
          pointer-events: none;
          z-index: 0;
        }

        .card {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 480px;
          animation: fadeUp 0.25s ease forwards;
        }

        /* ── glowing 404 number ── */
        .status-number {
          font-family: 'DM Mono', monospace;
          font-size: clamp(80px, 18vw, 140px);
          font-weight: 500;
          line-height: 1;
          letter-spacing: -0.04em;
          color: #F8FAFC;
          position: relative;
          margin-bottom: 8px;
        }
        .status-number::after {
          content: attr(data-value);
          position: absolute;
          inset: 0;
          color: #2563EB;
          opacity: 0.12;
          filter: blur(24px);
          pointer-events: none;
        }

        /* ── accent line ── */
        .accent-line {
          width: 40px;
          height: 3px;
          background: #2563EB;
          border-radius: 9999px;
          margin-bottom: 24px;
        }

        /* ── heading ── */
        h1 {
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        /* ── route badge ── */
        .route-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #94A3B8;
          background: #0F172A;
          border: 1px solid #1E293B;
          padding: 5px 14px;
          border-radius: 9999px;
          margin-bottom: 32px;
        }
        .route-badge .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ff6b6b;
          animation: pulse 1.8s ease-in-out infinite;
          flex-shrink: 0;
        }

        /* ── actions ── */
        .actions {
          display: flex;
          gap: 12px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 22px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .btn-primary {
          background: #2563EB;
          color: #0B1120;
          border: 1px solid #2563EB;
        }
        .btn-primary:hover {
          background: #3B82F6;
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(37, 99, 235, 0.35);
        }
        .btn-secondary {
          background: transparent;
          color: #F8FAFC;
          border: 1px solid #1E293B;
        }
        .btn-secondary:hover {
          background: #0F172A;
          border-color: #334155;
        }

        /* ── footer branding ── */
        .brand {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #475569;
          font-family: 'DM Mono', monospace;
        }
        .brand-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2563EB;
        }
    </style>
</head>
<body>
    <div class="card">
      <div class="status-number" data-value="404">404</div>
      <div class="accent-line"></div>
      <h1>Page not found</h1>
      <div class="route-badge">
        <span class="dot"></span>
        <span>${escapeHtml(pathname)}</span>
      </div>
      <div class="actions">
        <a href="/" class="btn btn-primary">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Home
        </a>
        <a href="javascript:history.back()" class="btn btn-secondary">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Go back
        </a>
      </div>
    </div>

    <div class="brand">
      <span class="brand-dot"></span>
      Velix v${VERSION}
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
        const m1 = frame.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
        if (m1) return { call: m1[1].trim(), file: m1[2], line: parseInt(m1[3], 10) };
        const m2 = frame.match(/at\s+(.+?):(\d+):\d+/);
        if (m2) return { call: '(anonymous)', file: m2[1].trim(), line: parseInt(m2[2], 10) };
        return { call: frame.replace(/^\s*at\s+/, '').trim(), file: '', line: null };
      });

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
            
            const syntaxHighlight = (code: string) => {
              let hl = code;
              // Keywords
              hl = hl.replace(/\\b(let|const|function|return|import|export|if|else|for|while|await|async|class|var)\\b/g, '<span style="color:#c084fc">$1</span>');
              // Strings
              hl = hl.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g, '<span style="color:#86efac">$1</span>');
              // Comments
              hl = hl.replace(/(\\&#x2F;\\&#x2F;.*)$/g, '<span style="color:#94A3B8">$1</span>');
              // Numbers
              hl = hl.replace(/\\b(\\d+)\\b/g, '<span style="color:#f59e0b">$1</span>');
              return hl;
            };

            sourceSnippet = src.slice(start, end).map((l: string, i: number) => {
              const num = start + i + 1;
              const isErr = num === errorLine;
              const numStr = String(num).padStart(3, ' ');
              const highlightedLine = syntaxHighlight(escapeHtml(l));
              
              if (isErr) {
                return `<div class="src-line src-err"><span class="ln">${numStr}</span><span class="active-arrow">▶</span><span class="code-content">${highlightedLine}</span></div>`;
              }
              return `<div class="src-line"><span class="ln">${numStr}</span><span class="active-arrow"> </span><span class="code-content">${highlightedLine}</span></div>`;
            }).join('');
          }
        } catch (_) {}
      }
    }
  }

  const formatErrorMessage = (msg: string): string => {
    let formatted = escapeHtml(msg);
    // Render Windows and Unix absolute paths in green
    const pathSpan = '<span style="color:#2563EB;cursor:pointer;" onclick="console.log(\'open in editor\')">';
    formatted = formatted.replace(/([A-Z]:\\[^\s<]+|\/(?:Users|home|var|srv)\/[^\s<]+)/g, pathSpan + '$1</span>');
    // Render ERROR: in red
    formatted = formatted.replace(/(ERROR:)/g, '<strong style="color:#ff6b6b">$1</strong>');
    return formatted;
  };

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
          background: #0B1120;
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        body {
          background-color: #0B1120;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          color: #F8FAFC;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 2rem;
          -webkit-font-smoothing: antialiased;
        }

        /* Radial mask for the grid background */
        .bg-mask {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at center, transparent 0%, #0B1120 80%);
          z-index: -1;
          pointer-events: none;
        }

        /* ── Main Container ── */
        .container {
          width: 100%;
          max-width: 780px;
          margin-top: 4vh;
          animation: fadeIn 0.2s ease forwards;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ── Header Bar ── */
        .header {
          position: relative;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -12px; left: 0; right: 0;
          height: 4px;
          background: #ff6b6b;
          border-radius: 4px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .header-icon {
          width: 20px;
          height: 20px;
          fill: #ff6b6b;
        }
        .header-title {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
        }
        .dev-badge {
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          padding: 2px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        /* ── Status & Route ── */
        .status-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
        }
        .status-badge {
          background: #0F172A;
          border: 1px solid #1E293B;
          color: #ff6b6b;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .route-badge {
          background: #0F172A;
          border: 1px solid #1E293B;
          color: #2563EB;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .separator { color: #94A3B8; }
        .timestamp { color: #94A3B8; font-family: system-ui; font-size: 13px; }

        /* ── Error Message ── */
        .error-message-box {
          background: #0F172A;
          border: 1px solid #1E293B;
          border-left: 3px solid #ff6b6b;
          border-radius: 10px;
          padding: 1rem 1.25rem;
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          color: #F8FAFC;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* ── Source Code Viewer ── */
        .source-viewer {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .source-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .source-filepath {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #2563EB;
        }
        .open-in-editor {
          color: #94A3B8;
          cursor: pointer;
          transition: color 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          text-decoration: none;
        }
        .open-in-editor:hover { color: #F8FAFC; }
        .open-in-editor svg { width: 14px; height: 14px; stroke: currentColor; fill: none; }

        .source-body {
          background: #020617;
          border: 1px solid #1E293B;
          border-radius: 8px;
          padding: 16px 0;
          overflow-x: auto;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          line-height: 1.6;
        }
        .src-line {
          display: flex;
          padding: 0 16px;
        }
        .ln {
          color: #475569;
          width: 32px;
          text-align: right;
          margin-right: 16px;
          user-select: none;
          flex-shrink: 0;
        }
        .active-arrow {
          color: transparent;
          margin-right: 12px;
          width: 14px;
          text-align: center;
          flex-shrink: 0;
        }
        .code-content { white-space: pre; }
        
        .src-err {
          background: rgba(37, 99, 235, 0.04);
        }
        .src-err .ln { color: #2563EB; }
        .src-err .active-arrow { color: #2563EB; }
        .src-err .code-content { color: #F8FAFC; }

        /* ── Call Stack ── */
        .callstack-section {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .callstack-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .callstack-title {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .callstack-count {
          background: #1E293B;
          color: #F8FAFC;
          padding: 2px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .toggle-node-modules {
          color: #94A3B8;
          font-size: 13px;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.15s;
        }
        .toggle-node-modules:hover { color: #F8FAFC; }

        .frame {
          background: #0F172A;
          border: 1px solid #1E293B;
          border-radius: 8px;
          padding: 0.875rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background-color 0.15s, transform 0.15s;
        }
        .frame:hover { background: #1E293B; }
        
        .frame-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .frame-call {
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          font-weight: 700;
          color: #2563EB;
        }
        .frame-file {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #94A3B8;
        }
        
        .frame.node-modules .frame-call { color: #94A3B8; font-weight: 400; }
        .frame.node-modules .frame-file { color: #475569; }
        
        .frame-number {
          background: #1E293B;
          color: #94A3B8;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-variant-numeric: tabular-nums;
        }

        .pagination {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }
        .page-btn {
          background: transparent;
          border: 1px solid #1E293B;
          color: #F8FAFC;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .page-btn:hover:not(:disabled) { background: #1E293B; }
        .page-btn:disabled { opacity: 0.3; cursor: default; }
        
        .node-modules-list { display: none; flex-direction: column; gap: 12px; margin-top: 12px; }
        .node-modules-list.visible { display: flex; }

        /* ── Footer ── */
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #1E293B;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #F8FAFC;
        }
        .velix-dot { width: 8px; height: 8px; border-radius: 50%; background: #2563EB; }
        .footer-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .footer-link {
          color: #94A3B8;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.15s;
        }
        .footer-link:hover { color: #F8FAFC; }
        .dev-pill {
          background: #1E293B;
          color: #F8FAFC;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="bg-mask"></div>
    <div class="container">
      
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <svg class="header-icon" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.83L19.17 19H4.83L12 5.83zM11 10h2v5h-2v-5zm0 6h2v2h-2v-2z"/></svg>
          <div class="header-title">Unhandled Runtime Error</div>
        </div>
        <div class="dev-badge">DEV</div>
      </div>

      <!-- Status & Route -->
      <div class="status-bar">
        <div class="status-badge">${options.statusCode || 500}</div>
        <div class="separator">·</div>
        <div class="route-badge">Route: ${pathname || '/'}</div>
        <div class="separator">·</div>
        <div class="timestamp">just now</div>
      </div>

      <!-- Error Message -->
      <div class="error-message-box">
        ${formatErrorMessage(message)}
      </div>

      ${sourceSnippet ? `
      <!-- Source Viewer -->
      <div class="source-viewer">
        <div class="source-header">
          <div class="source-filepath">${escapeHtml(shortFile)}${errorLine ? ` (${errorLine})` : ''} @ runtime</div>
          <a href="#" class="open-in-editor" onclick="console.log('Open in editor clicked')">
            Open in editor
            <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
        </div>
        <div class="source-body">
          ${sourceSnippet}
        </div>
      </div>
      ` : ''}

      <!-- Call Stack -->
      <div class="callstack-section">
        <div class="callstack-header">
          <div class="callstack-title">
            Call Stack
            <div class="callstack-count">${frames.length}</div>
          </div>
          ${ignoredFrames.length > 0 ? `
          <button class="toggle-node-modules" id="toggleNodeModules" onclick="toggleNodeModules()">
            Show ${ignoredFrames.length} node_modules frames
          </button>
          ` : ''}
        </div>

        ${userFrames.map((f: StackFrame, i: number) => `
        <div class="frame">
          <div class="frame-info">
            <div class="frame-call">${escapeHtml(f.call)}</div>
            <div class="frame-file">${escapeHtml(f.file.replace(/\\\\/g, '/'))}${f.line ? `:${f.line}` : ''}</div>
          </div>
          <div class="frame-number">${i + 1}</div>
        </div>
        `).join('')}

        ${ignoredFrames.length > 0 ? `
        <div class="node-modules-list" id="nodeModulesList">
          ${ignoredFrames.map((f: StackFrame, i: number) => `
          <div class="frame node-modules">
            <div class="frame-info">
              <div class="frame-call">${escapeHtml(f.call)}</div>
              <div class="frame-file">${escapeHtml(f.file)}${f.line ? `:${f.line}` : ''}</div>
            </div>
            <div class="frame-number">${userFrames.length + i + 1}</div>
          </div>
          `).join('')}
        </div>
        ` : ''}
        
        <div class="pagination">
          <button class="page-btn" disabled>Previous</button>
          <button class="page-btn" disabled>Next</button>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-left">
          <div class="velix-dot"></div>
          Velix v${VERSION}
        </div>
        <div class="footer-right">
          <a href="/" class="footer-link">Home</a>
          <a href="#" class="footer-link" onclick="window.location.reload()">Reload</a>
          <a href="https://velixcloud.io/docs" class="footer-link" target="_blank">Documentation</a>
          <div class="dev-pill">Development Mode</div>
        </div>
      </div>

    </div>

    <script>
      function toggleNodeModules() {
        const list = document.getElementById('nodeModulesList');
        const btn = document.getElementById('toggleNodeModules');
        if (!list || !btn) return;
        
        const isVisible = list.classList.contains('visible');
        if (isVisible) {
          list.classList.remove('visible');
          btn.textContent = 'Show ' + list.children.length + ' node_modules frames';
        } else {
          list.classList.add('visible');
          btn.textContent = 'Hide node_modules frames';
        }
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
