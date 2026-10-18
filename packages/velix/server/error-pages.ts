/**
 * Velix v5 Error Pages
 * Next.js-style error overlay with source frame inspector,
 * ignore-listed stack frame folding, multi-error pagination,
 * copy error button, and reflected XSS protection.
 */

import fs from 'fs';
import { VERSION } from '../version.js';

export interface ErrorItem {
  statusCode?: number;
  title?: string;
  message: string;
  stack?: string;
  pathname?: string;
}

export interface ErrorPageOptions {
  statusCode: number;
  title: string;
  message: string;
  stack?: string;
  isDev?: boolean;
  pathname?: string;
  errors?: ErrorItem[];
}

export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isIgnoredPath(filePath: string): boolean {
  if (!filePath) return true;
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.startsWith('node:') ||
    normalized.includes('node:internal') ||
    normalized.includes('node_modules') ||
    normalized.includes('packages/velix') ||
    normalized.includes('@teamvelix') ||
    normalized.includes('/dist/') ||
    normalized.includes('internal/modules')
  );
}

export interface ParsedStackFrame {
  call: string;
  file: string;
  line: number | null;
  column: number | null;
  isIgnored: boolean;
}

export function parseStack(stack?: string): ParsedStackFrame[] {
  if (!stack) return [];
  const lines = stack.split('\n').filter(l => l.trim().startsWith('at '));
  return lines.map(line => {
    // at fn (path/to/file.ts:12:34)
    const m1 = line.match(/^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/);
    if (m1) {
      const file = m1[2].trim();
      return {
        call: m1[1].trim(),
        file,
        line: parseInt(m1[3], 10),
        column: parseInt(m1[4], 10),
        isIgnored: isIgnoredPath(file),
      };
    }
    // at path/to/file.ts:12:34
    const m2 = line.match(/^\s*at\s+(.+?):(\d+):(\d+)$/);
    if (m2) {
      const file = m2[1].trim();
      return {
        call: '(anonymous)',
        file,
        line: parseInt(m2[2], 10),
        column: parseInt(m2[3], 10),
        isIgnored: isIgnoredPath(file),
      };
    }
    const clean = line.replace(/^\s*at\s+/, '').trim();
    return {
      call: clean,
      file: '',
      line: null,
      column: null,
      isIgnored: true,
    };
  });
}

export function syntaxHighlight(rawCode: string): string {
  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(".*?"|'.*?'|`[\s\S]*?`)|(\b(?:let|const|var|function|return|import|export|from|default|if|else|for|while|await|async|class|try|catch|throw|new|typeof|instanceof|interface|type)\b)|(\b\d+(?:\.\d+)?\b)/g;

  let lastIndex = 0;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(rawCode)) !== null) {
    result += escapeHtml(rawCode.slice(lastIndex, match.index));
    lastIndex = match.index + match[0].length;

    const [, comment, str, kw, num] = match;
    if (comment) {
      result += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
    } else if (str) {
      result += `<span class="tok-string">${escapeHtml(str)}</span>`;
    } else if (kw) {
      result += `<span class="tok-keyword">${escapeHtml(kw)}</span>`;
    } else if (num) {
      result += `<span class="tok-number">${escapeHtml(num)}</span>`;
    }
  }

  result += escapeHtml(rawCode.slice(lastIndex));
  return result;
}

export function getSourceSnippet(file: string, line: number, contextLines: number = 3): { snippet: string; startLine: number } | null {
  if (!file || line <= 0) return null;
  try {
    if (!fs.existsSync(file)) return null;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const start = Math.max(0, line - 1 - contextLines);
    const end = Math.min(lines.length, line + contextLines);
    const slice = lines.slice(start, end);

    const formatted = slice.map((l, idx) => {
      const lineNum = start + idx + 1;
      const isErr = lineNum === line;
      const numStr = String(lineNum).padStart(4, ' ');
      const codeHtml = syntaxHighlight(l);
      return `<div class="src-line ${isErr ? 'src-err' : ''}"><span class="ln">${numStr}</span><span class="pointer">${isErr ? '▶' : ' '}</span><span class="code">${codeHtml}</span></div>`;
    }).join('');

    return { snippet: formatted, startLine: start + 1 };
  } catch {
    return null;
  }
}

/**
 * Generate a styled 404 error page — Velix branding
 */
export function generate404Page(pathname: string = '/'): string {
  const safePath = escapeHtml(pathname);
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
        body {
          background-color: #0a0a0a;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          color: #e8ebe5;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 100vh; padding: 2rem; -webkit-font-smoothing: antialiased;
        }
        .card { text-align: center; max-width: 480px; }
        .status-number { font-family: 'DM Mono', monospace; font-size: clamp(80px, 18vw, 140px); font-weight: 500; line-height: 1; color: #e8ebe5; margin-bottom: 8px; }
        h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
        p { color: #888; font-size: 14px; margin-bottom: 24px; }
        .path { font-family: 'DM Mono', monospace; color: #00e87a; background: #111; padding: 2px 8px; border-radius: 4px; }
        .btn { display: inline-block; padding: 10px 20px; background: #00e87a; color: #000; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .btn:hover { background: #39ffa0; }
    </style>
</head>
<body>
    <div class="card">
        <div class="status-number">404</div>
        <h1>Page Not Found</h1>
        <p>The requested route <span class="path">${safePath}</span> does not exist.</p>
        <a href="/" class="btn">Return Home</a>
    </div>
</body>
</html>`;
}

/**
 * Generate a styled 500 error page — Next.js 16 dev overlay style
 */
export function generate500Page(options: ErrorPageOptions): string {
  const { isDev } = options;

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
          min-height: 100vh; -webkit-font-smoothing: antialiased;
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

  // ── DEVELOPMENT mode: full Next.js-style overlay ───────────────────────────
  const errorList: ErrorItem[] = options.errors && options.errors.length > 0
    ? options.errors
    : [{
        statusCode: options.statusCode,
        title: options.title || 'Runtime Error',
        message: options.message,
        stack: options.stack,
        pathname: options.pathname,
      }];

  const serializedErrors = JSON.stringify(errorList.map(err => {
    const frames = parseStack(err.stack);
    const userFrames = frames.filter(f => !f.isIgnored);
    const ignoredFrames = frames.filter(f => f.isIgnored);
    const leadFrame = userFrames[0] || frames[0];
    const errorFile = leadFrame?.file || '';
    const errorLine = leadFrame?.line || 0;
    const errorCol = leadFrame?.column || 0;
    const snippetObj = errorFile && errorLine > 0 ? getSourceSnippet(errorFile, errorLine) : null;

    return {
      title: err.title || 'Runtime Error',
      message: err.message,
      stack: err.stack || '',
      pathname: err.pathname || options.pathname || '/',
      errorFile,
      errorLine,
      errorCol,
      snippetHtml: snippetObj?.snippet || '',
      userFrames,
      ignoredFrames,
    };
  }));

  const initialErr = JSON.parse(serializedErrors)[0];
  const totalCount = errorList.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error Overlay | Velix v${VERSION}</title>
    <link rel="icon" href="/favicon.webp">
    <style>
      :root {
        --overlay-bg: rgba(0, 0, 0, 0.72);
        --box-bg: #111213;
        --box-border: #27272a;
        --text-primary: #f4f4f5;
        --text-secondary: #a1a1aa;
        --text-muted: #71717a;
        --accent-red: #ef4444;
        --accent-red-bg: rgba(239, 68, 68, 0.12);
        --accent-green: #00e87a;
        --code-bg: #09090b;
        --frame-bg: #18181b;
        --frame-border: #27272a;
        --frame-hover: #27272a;
        --tok-keyword: #c084fc;
        --tok-string: #86efac;
        --tok-comment: #71717a;
        --tok-number: #f59e0b;
      }

      @media (prefers-color-scheme: light) {
        :root {
          --overlay-bg: rgba(255, 255, 255, 0.75);
          --box-bg: #ffffff;
          --box-border: #e4e4e7;
          --text-primary: #09090b;
          --text-secondary: #52525b;
          --text-muted: #a1a1aa;
          --accent-red: #dc2626;
          --accent-red-bg: rgba(220, 38, 38, 0.08);
          --accent-green: #059669;
          --code-bg: #f4f4f5;
          --frame-bg: #fafafa;
          --frame-border: #e4e4e7;
          --frame-hover: #f4f4f5;
          --tok-keyword: #7c3aed;
          --tok-string: #047857;
          --tok-comment: #a1a1aa;
          --tok-number: #d97706;
        }
      }

      *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background: transparent;
        color: var(--text-primary);
        -webkit-font-smoothing: antialiased;
      }

      /* Fixed overlay backdrop: background page remains visible through blur */
      .velix-overlay-backdrop {
        position: fixed;
        inset: 0;
        background: var(--overlay-bg);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        overflow-y: auto;
        padding: 32px 16px;
        z-index: 999999;
      }

      .velix-dialog {
        background: var(--box-bg);
        border: 1px solid var(--box-border);
        border-radius: 14px;
        width: 100%;
        max-width: 860px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Header */
      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--box-border);
        background: var(--box-bg);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .error-badge {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--accent-red);
        background: var(--accent-red-bg);
        padding: 3px 8px;
        border-radius: 6px;
      }

      .version-badge {
        font-size: 12px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        color: var(--text-muted);
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .nav-counter {
        font-size: 13px;
        color: var(--text-secondary);
        font-variant-numeric: tabular-nums;
        margin-right: 4px;
      }

      .btn-icon {
        background: var(--frame-bg);
        border: 1px solid var(--box-border);
        color: var(--text-secondary);
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: background 0.15s, color 0.15s;
      }
      .btn-icon:hover:not(:disabled) {
        background: var(--frame-hover);
        color: var(--text-primary);
      }
      .btn-icon:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }

      /* Body */
      .dialog-body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .message-box {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        font-size: 14px;
        line-height: 1.5;
        color: var(--accent-red);
        font-weight: 600;
        word-break: break-word;
        white-space: pre-wrap;
      }

      .route-info {
        font-size: 13px;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .route-path {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        color: var(--accent-green);
        background: var(--frame-bg);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--box-border);
      }

      /* Source frame viewer */
      .source-box {
        border: 1px solid var(--box-border);
        border-radius: 8px;
        background: var(--code-bg);
        overflow: hidden;
      }

      .source-bar {
        padding: 8px 14px;
        border-bottom: 1px solid var(--box-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        background: var(--frame-bg);
      }

      .source-path {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        color: var(--text-secondary);
      }

      .open-editor-link {
        color: var(--accent-green);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
      }
      .open-editor-link:hover {
        text-decoration: underline;
      }

      .source-code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        font-size: 13px;
        line-height: 1.6;
        padding: 12px 0;
        overflow-x: auto;
      }

      .src-line {
        display: flex;
        padding: 0 16px;
      }
      .src-line.src-err {
        background: var(--accent-red-bg);
      }
      .ln {
        color: var(--text-muted);
        width: 36px;
        text-align: right;
        margin-right: 12px;
        user-select: none;
        flex-shrink: 0;
      }
      .pointer {
        width: 14px;
        color: var(--accent-red);
        font-weight: bold;
        flex-shrink: 0;
        margin-right: 8px;
      }
      .code {
        white-space: pre;
      }

      .tok-keyword { color: var(--tok-keyword); font-weight: 600; }
      .tok-string { color: var(--tok-string); }
      .tok-comment { color: var(--tok-comment); font-style: italic; }
      .tok-number { color: var(--tok-number); }

      /* Stack section */
      .stack-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .stack-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .stack-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .toggle-ignored-btn {
        background: none;
        border: none;
        font-size: 12px;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 2px 4px;
      }
      .toggle-ignored-btn:hover {
        color: var(--text-primary);
        text-decoration: underline;
      }

      .frame-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .frame-item {
        background: var(--frame-bg);
        border: 1px solid var(--frame-border);
        border-radius: 6px;
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 13px;
      }
      .frame-item:hover {
        background: var(--frame-hover);
      }
      .frame-call {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        font-weight: 600;
        color: var(--text-primary);
      }
      .frame-loc {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
        font-size: 12px;
        color: var(--text-muted);
      }

      .frame-item.ignored {
        opacity: 0.65;
      }
      .frame-item.ignored .frame-call {
        font-weight: 400;
        color: var(--text-secondary);
      }

      .ignored-frames-container {
        display: none;
        flex-direction: column;
        gap: 6px;
        margin-top: 4px;
      }
      .ignored-frames-container.open {
        display: flex;
      }

      /* Footer */
      .dialog-footer {
        padding: 12px 20px;
        border-top: 1px solid var(--box-border);
        background: var(--box-bg);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        color: var(--text-muted);
      }

      .footer-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .footer-actions a {
        color: var(--text-secondary);
        text-decoration: none;
      }
      .footer-actions a:hover {
        color: var(--text-primary);
        text-decoration: underline;
      }
    </style>
</head>
<body>
    <div class="velix-overlay-backdrop">
      <div class="velix-dialog" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="dialog-header">
          <div class="header-left">
            <span class="error-badge" id="errorBadge">${escapeHtml(initialErr.title)}</span>
            <span class="version-badge">Velix v${VERSION}</span>
          </div>
          <div class="header-right">
            <span class="nav-counter" id="navCounter">1 of ${totalCount}</span>
            <button class="btn-icon" id="prevBtn" onclick="navigateError(-1)" ${totalCount <= 1 ? 'disabled' : ''}>←</button>
            <button class="btn-icon" id="nextBtn" onclick="navigateError(1)" ${totalCount <= 1 ? 'disabled' : ''}>→</button>
            <button class="btn-icon" id="copyBtn" onclick="copyErrorToClipboard()">Copy Error</button>
          </div>
        </div>

        <!-- Body -->
        <div class="dialog-body">
          <div class="route-info">
            Route: <span class="route-path" id="routeDisplay">${escapeHtml(initialErr.pathname)}</span>
          </div>

          <div class="message-box" id="messageDisplay">${escapeHtml(initialErr.message)}</div>

          <!-- Source Viewer -->
          <div class="source-box" id="sourceBox" style="${initialErr.snippetHtml ? '' : 'display:none;'}">
            <div class="source-bar">
              <span class="source-path" id="sourcePathDisplay">${escapeHtml(initialErr.errorFile)}${initialErr.errorLine ? `:${initialErr.errorLine}` : ''}</span>
              <a href="vscode://file/${escapeHtml(initialErr.errorFile)}:${initialErr.errorLine}" id="editorLink" class="open-editor-link">
                Open in editor ↗
              </a>
            </div>
            <div class="source-code" id="sourceSnippetDisplay">${initialErr.snippetHtml}</div>
          </div>

          <!-- Stack Trace -->
          <div class="stack-section">
            <div class="stack-header">
              <span class="stack-title">Call Stack</span>
              <button class="toggle-ignored-btn" id="toggleIgnoredBtn" onclick="toggleIgnoredFrames()" style="${initialErr.ignoredFrames.length ? '' : 'display:none;'}">
                Show ${initialErr.ignoredFrames.length} ignore-listed frames
              </button>
            </div>

            <div class="frame-list" id="userFramesList">
              ${initialErr.userFrames.map((f: ParsedStackFrame) => `
                <div class="frame-item">
                  <div class="frame-call">${escapeHtml(f.call)}</div>
                  <div class="frame-loc">${escapeHtml(f.file)}${f.line ? `:${f.line}:${f.column || 0}` : ''}</div>
                </div>
              `).join('')}
            </div>

            <div class="ignored-frames-container" id="ignoredFramesList">
              ${initialErr.ignoredFrames.map((f: ParsedStackFrame) => `
                <div class="frame-item ignored">
                  <div class="frame-call">${escapeHtml(f.call)}</div>
                  <div class="frame-loc">${escapeHtml(f.file)}${f.line ? `:${f.line}:${f.column || 0}` : ''}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <span>Velix Development Overlay</span>
          <div class="footer-actions">
            <a href="https://velixcloud.io/docs" target="_blank" rel="noreferrer">Documentation</a>
            <a href="javascript:location.reload()">Reload Page</a>
          </div>
        </div>
      </div>
    </div>

    <script>
      const errorsData = ${serializedErrors};
      let currentIndex = 0;
      let ignoredOpen = false;

      function renderCurrentError() {
        const item = errorsData[currentIndex];
        document.getElementById('navCounter').textContent = (currentIndex + 1) + ' of ' + errorsData.length;
        document.getElementById('errorBadge').textContent = item.title;
        document.getElementById('routeDisplay').textContent = item.pathname;
        document.getElementById('messageDisplay').textContent = item.message;

        const sourceBox = document.getElementById('sourceBox');
        if (item.snippetHtml) {
          sourceBox.style.display = '';
          document.getElementById('sourcePathDisplay').textContent = item.errorFile + (item.errorLine ? ':' + item.errorLine : '');
          document.getElementById('editorLink').href = 'vscode://file/' + encodeURI(item.errorFile) + ':' + item.errorLine;
          document.getElementById('sourceSnippetDisplay').innerHTML = item.snippetHtml;
        } else {
          sourceBox.style.display = 'none';
        }

        // Render user frames
        const userList = document.getElementById('userFramesList');
        userList.innerHTML = item.userFrames.map(function(f) {
          return '<div class="frame-item">' +
            '<div class="frame-call">' + escapeText(f.call) + '</div>' +
            '<div class="frame-loc">' + escapeText(f.file) + (f.line ? ':' + f.line + ':' + (f.column || 0) : '') + '</div>' +
          '</div>';
        }).join('');

        // Render ignored frames
        const ignList = document.getElementById('ignoredFramesList');
        ignList.innerHTML = item.ignoredFrames.map(function(f) {
          return '<div class="frame-item ignored">' +
            '<div class="frame-call">' + escapeText(f.call) + '</div>' +
            '<div class="frame-loc">' + escapeText(f.file) + (f.line ? ':' + f.line + ':' + (f.column || 0) : '') + '</div>' +
          '</div>';
        }).join('');

        const toggleBtn = document.getElementById('toggleIgnoredBtn');
        if (item.ignoredFrames.length > 0) {
          toggleBtn.style.display = '';
          toggleBtn.textContent = ignoredOpen
            ? 'Hide ignore-listed frames'
            : 'Show ' + item.ignoredFrames.length + ' ignore-listed frames';
        } else {
          toggleBtn.style.display = 'none';
        }

        document.getElementById('prevBtn').disabled = currentIndex === 0;
        document.getElementById('nextBtn').disabled = currentIndex === errorsData.length - 1;
      }

      function escapeText(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      function navigateError(delta) {
        const next = currentIndex + delta;
        if (next >= 0 && next < errorsData.length) {
          currentIndex = next;
          renderCurrentError();
        }
      }

      function toggleIgnoredFrames() {
        ignoredOpen = !ignoredOpen;
        const ignList = document.getElementById('ignoredFramesList');
        const toggleBtn = document.getElementById('toggleIgnoredBtn');
        const item = errorsData[currentIndex];
        if (ignoredOpen) {
          ignList.classList.add('open');
          toggleBtn.textContent = 'Hide ignore-listed frames';
        } else {
          ignList.classList.remove('open');
          toggleBtn.textContent = 'Show ' + item.ignoredFrames.length + ' ignore-listed frames';
        }
      }

      function copyErrorToClipboard() {
        const item = errorsData[currentIndex];
        const payload = item.title + ': ' + item.message + '\\n\\n' + (item.stack || '');
        navigator.clipboard.writeText(payload).then(function() {
          const btn = document.getElementById('copyBtn');
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(function() { btn.textContent = original; }, 2000);
        }).catch(function() {
          alert('Failed to copy to clipboard');
        });
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
    errors: options.errors,
  });
}
