const fs = require('fs');

let content = fs.readFileSync('packages/velix/server/error-pages.ts', 'utf8');

// Replace syntax error causing lines
content = content.replace(/\\b\(let\|const\|function\|return\|import\|export\|if\|else\|for\|while\|await\|async\|class\|var\)\\b/g, '\\b(let|const|function|return|import|export|if|else|for|while|await|async|class|var)\\b');
content = content.replace(/\(&quot;\.\*\?&quot;\|&#39;\.\*\?&#39;\|`\.\*\?`\)/g, '(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)');
content = content.replace(/\(\\\&#x2F;\\\&#x2F;\.\*\)\\\$/g, '(\\/\\/.*)$');
content = content.replace(/\\b\(\\d\+\)\\b/g, '\\b(\\d+)\\b');

// Fix string replacement in formatErrorMessage
// The current content might have single quotes escaped incorrectly
content = content.replace(/onclick="console\.log\(\\'open in editor\\'\)"/g, 'onclick="console.log(\'open in editor\')"');

// The regex might have double escaped backslashes
content = content.replace(/\(\\\\\\[\?\[A-Z\]:\\\\\\\\\[\^ \\\\n\]\+\\\\\\]\?\|\\\\\/Users\\\\\/\[\^ \\\\n\]\+\)/g, '(\\[?[A-Z]:\\\\[^ \\n]+\\]?|\\/Users\\/[^ \\n]+)');

// Fix template string escapes (where I mistakenly escaped backticks or template braces)
content = content.replace(/\\\${/g, '${');
content = content.replace(/\\`/g, '`');

fs.writeFileSync('packages/velix/server/error-pages.ts', content);

// Now fix the imports in docs pages
const docsPages = [
  'website/app/docs/actions/page.tsx',
  'website/app/docs/api-routes/page.tsx',
  'website/app/docs/deployment/page.tsx',
  'website/app/docs/error-handling/page.tsx',
  'website/app/docs/loaders/page.tsx',
  'website/app/docs/routing/page.tsx',
];

for (const page of docsPages) {
  if (fs.existsSync(page)) {
    let pageContent = fs.readFileSync(page, 'utf8');
    pageContent = pageContent.replace(/from "\.\.\/\.\.\/components\/DocsComponents"/g, 'from "../../../components/DocsComponents"');
    fs.writeFileSync(page, pageContent);
  }
}
