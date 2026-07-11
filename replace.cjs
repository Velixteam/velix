const fs = require('fs');
const file = 'packages/create-velix-app/src/index.ts';
let content = fs.readFileSync(file, 'utf8');

// The places to KEEP green:
// 1. <span className="text-[#00e87a] font-mono text-sm font-bold">✅ Velix
// 2. <span className="text-[#00e87a]">← UI only ✓
// 3. <span className="text-[#00e87a]">← clean ✓
// 4. <span className="text-[#00e87a]">✓ Ready! cd my-app && npm run dev
// 5. In the next.js vs velix section, the ✅ Velix header has border-[rgba(0,232,122,0.15)] and bg-[rgba(0,232,122,0.05)]

content = content.replace(/className="text-\\[#00e87a\\] font-mono text-sm font-bold">✅/g, 'className="text-[###GREEN###] font-mono text-sm font-bold">✅');
content = content.replace(/className="text-\\[#00e87a\\]">←/g, 'className="text-[###GREEN###]">←');
content = content.replace(/className="text-\\[#00e87a\\]">✓ Ready/g, 'className="text-[###GREEN###]">✓ Ready');
content = content.replace(/border-\\[rgba\\(0,232,122,0\.15\\)\\]/g, 'border-[rgba(###GREEN-RGB###,0.15)]');
content = content.replace(/bg-\\[rgba\\(0,232,122,0\.05\\)\\]/g, 'bg-[rgba(###GREEN-RGB###,0.05)]');

// Replace remaining #00e87a with #2563EB
content = content.split('#00e87a').join('#2563EB');
content = content.split('rgba(0,232,122,0.2)').join('rgba(37,99,235,0.2)');
content = content.split('rgba(0,232,122,0.3)').join('rgba(37,99,235,0.3)');
content = content.split('rgba(0,232,122,0.03)').join('rgba(37,99,235,0.03)');
content = content.split('rgba(0,232,122,0.05)').join('rgba(37,99,235,0.05)');
content = content.split('rgba(0,232,122,0.1)').join('rgba(37,99,235,0.1)');
content = content.split('hover:bg-[#00d66f]').join('hover:bg-[#1D4ED8]');
content = content.split('pulse-green').join('pulse-blue');

// Unmask green
content = content.split('###GREEN###').join('#00e87a');
content = content.split('###GREEN-RGB###').join('0,232,122');

fs.writeFileSync(file, content);
console.log('Replacements done in index.ts');
