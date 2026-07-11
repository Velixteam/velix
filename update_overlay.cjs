const fs = require('fs');
let content = fs.readFileSync('packages/velix-react/src/hmr/dev-overlay.ts', 'utf8');
content = content.replace(/stroke="#00e87a"/g, 'stroke="#38BDF8"');
content = content.replace(/color: #00e87a; font-weight: bold;">Compiling/g, 'color: #38BDF8; font-weight: bold;">Compiling');
content = content.replace(/color: #00e87a; font-family: monospace;/g, 'color: #38BDF8; font-family: monospace;');
fs.writeFileSync('packages/velix-react/src/hmr/dev-overlay.ts', content);
