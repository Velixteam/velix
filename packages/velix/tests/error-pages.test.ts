import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  isIgnoredPath,
  parseStack,
  syntaxHighlight,
  getSourceSnippet,
  generate404Page,
  generate500Page,
  generateErrorPage
} from '../server/error-pages.js';
import path from 'path';

describe('Error Pages & Dev Overlay (Section 2)', () => {
  it('escapes HTML to prevent reflected XSS via pathname', () => {
    const malicious = '<script>alert("xss")</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');

    const html404 = generate404Page(malicious);
    expect(html404).not.toContain('<script>alert("xss")</script>');
    expect(html404).toContain('&lt;script&gt;');

    const html500 = generate500Page({
      statusCode: 500,
      title: 'XSS Test',
      message: 'Boom',
      pathname: malicious,
      isDev: true,
    });
    expect(html500).not.toContain('<script>alert("xss")</script>');
    expect(html500).toContain('&lt;script&gt;');
  });

  it('correctly classifies internal node and velix frames as ignored', () => {
    expect(isIgnoredPath('node:internal/process/task_queues:83:21')).toBe(true);
    expect(isIgnoredPath('/home/user/project/node_modules/react/index.js')).toBe(true);
    expect(isIgnoredPath('/home/user/project/packages/velix/server/index.ts')).toBe(true);
    expect(isIgnoredPath('/home/user/project/@teamvelix/velix-core/dist/index.js')).toBe(true);

    expect(isIgnoredPath('/home/user/project/app/page.tsx')).toBe(false);
    expect(isIgnoredPath('/home/user/project/components/Header.tsx')).toBe(false);
  });

  it('parses stack traces and puts user frames first', () => {
    const fakeStack = `Error: Something failed
    at runInternal (node:internal/modules/esm:10:5)
    at Object.renderPage (/app/page.tsx:25:12)
    at Module.call (/node_modules/somelib/index.js:55:8)`;

    const frames = parseStack(fakeStack);
    expect(frames).toHaveLength(3);
    expect(frames[0].isIgnored).toBe(true);
    expect(frames[1].isIgnored).toBe(false);
    expect(frames[1].call).toBe('Object.renderPage');
    expect(frames[1].file).toBe('/app/page.tsx');
    expect(frames[1].line).toBe(25);
    expect(frames[2].isIgnored).toBe(true);
  });

  it('syntax highlights JS/TS keywords correctly with proper regex', () => {
    const code = 'const x = function() { return 42; }; // answer';
    const highlighted = syntaxHighlight(code);
    expect(highlighted).toContain('<span class="tok-keyword">const</span>');
    expect(highlighted).toContain('<span class="tok-keyword">return</span>');
    expect(highlighted).toContain('<span class="tok-number">42</span>');
    expect(highlighted).toContain('<span class="tok-comment">// answer</span>');
  });

  it('loads source snippet without ESM ReferenceError on fs', () => {
    const currentFile = path.resolve(__dirname, 'error-pages.test.ts');
    const snippet = getSourceSnippet(currentFile, 10, 2);
    expect(snippet).not.toBeNull();
    expect(snippet?.snippet).toContain('src-err');
    expect(snippet?.snippet).toContain('ln');
  });

  it('generates dev overlay containing Next.js style layout, copy button and ignore-listed frames toggle', () => {
    const fakeStack = `Error: Cannot load layout
    at Object.default (/home/asuno/Projects/velix/website/app/layout.tsx:15:3)
    at node:internal/modules/esm:4:10`;

    const html = generate500Page({
      statusCode: 500,
      title: 'Layout Error',
      message: 'Failed to render layout',
      stack: fakeStack,
      pathname: '/docs',
      isDev: true,
    });

    expect(html).toContain('velix-overlay-backdrop');
    expect(html).toContain('Copy Error');
    expect(html).toContain('Show 1 ignore-listed frames');
    expect(html).toContain('Open in editor');
    expect(html).toContain('vscode://file/');
    expect(html).toContain('/docs');
  });

  it('generates clean production 500 page when isDev is false', () => {
    const html = generateErrorPage(500, {
      title: 'Server Error',
      message: 'Sensitive database connection string leaked here',
      isDev: false,
    });

    expect(html).toContain('Internal Server Error');
    expect(html).not.toContain('Sensitive database connection string');
    expect(html).not.toContain('velix-overlay-backdrop');
  });
});
