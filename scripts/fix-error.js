const fs = require('fs');
let content = fs.readFileSync('packages/velix/server/error-pages.ts', 'utf8');

// Replace syntax error causing lines
content = content.replace(/\\b\(let\\\|const\\\|function\\\|return\\\|import\\\|export\\\|if\\\|else\\\|for\\\|while\\\|await\\\|async\\\|class\\\|var\)\\b/g, '\\b(let|const|function|return|import|export|if|else|for|while|await|async|class|var)\\b');
content = content.replace(/\(&quot;\\.\*\?&quot;\\\|&#39;\\.\*\?&#39;\\\|`\\.\*\?`\)/g, '(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)');
content = content.replace(/\(\\\&#x2F;\\\&#x2F;\\.\*\)\\\$/g, '(\\/\\/.*)$');
content = content.replace(/\\b\(\\d\+\)\\b/g, '\\b(\\d+)\\b');

// Fix string replacement in formatErrorMessage
const target192 = "formatted = formatted.replace(/(\\\\[?[A-Z]:\\\\\\\\[^ \\\\n]+\\\\]?|\\\\/Users\\\\/[^ \\\\n]+)/g, '<span style=\"color:#2563EB; cursor:pointer;\" onclick=\"console.log(\\\\'open in editor\\\\')\">$1</span>');";
const replacement192 = "formatted = formatted.replace(/(\\[?[A-Z]:\\\\[^ \\n]+\\]?|\\/Users\\/[^ \\n]+)/g, '<span style=\"color:#2563EB; cursor:pointer;\" onclick=\"console.log(\\'open in editor\\')\">$1</span>');";
content = content.replace(target192, replacement192);

// Fix template string escapes (where I mistakenly escaped backticks or template braces)
content = content.replace(/\\\${/g, '${');
content = content.replace(/\\`/g, '`');

fs.writeFileSync('packages/velix/server/error-pages.ts', content);
