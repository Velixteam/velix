const fs = require('fs');

let content = fs.readFileSync('packages/velix/server/devtools.ts', 'utf8');

// Update DevTools overlay design to match Velix website brand:
// deep: #0B1120
// dark: #0F172A
// navy: #162032
// accent: #2563EB
// cyan: #22D3EE
// glow: #38BDF8

content = content.replace(/#111827/g, '#0B1120'); // bg deep
content = content.replace(/#1f2937/g, '#0F172A'); // bg dark
content = content.replace(/#374151/g, '#162032'); // border navy
content = content.replace(/#10b981/g, '#2563EB'); // accent text
content = content.replace(/#052e16/g, '#162032'); // dark pill bg
content = content.replace(/#166534/g, '#2563EB'); // accent border
content = content.replace(/#4ade80/g, '#38BDF8'); // cyan text

// Replace the round button CSS with an expanding pill CSS
const oldBtnCSS = '#__vdt-btn{position:fixed;bottom:16px;left:16px;z-index:9999;width:40px;height:40px;border-radius:50%;background:#0B1120;border:2px solid #22D3EE;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:transform .2s,box-shadow .2s;outline:none;}';
const newBtnCSS = '#__vdt-btn{position:fixed;bottom:20px;right:20px;z-index:9999;min-width:40px;height:40px;border-radius:20px;background:#0B1120;border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:all .3s cubic-bezier(0.4, 0, 0.2, 1);outline:none;padding:0 12px;gap:8px;color:#fff;overflow:hidden;}\n#__vdt-btn:hover{transform:scale(1.05);background:#0F172A;border-color:rgba(255,255,255,0.2);}\n#__vdt-status-text{font-size:12px;font-weight:600;white-space:nowrap;opacity:0;max-width:0;transition:all .3s cubic-bezier(0.4, 0, 0.2, 1);font-family:ui-sans-serif,system-ui,sans-serif;letter-spacing:0.3px;}\n#__vdt-btn.vdt-compiling #__vdt-status-text, #__vdt-btn.vdt-navigating #__vdt-status-text{opacity:1;max-width:120px;}';
content = content.replace(oldBtnCSS, newBtnCSS);

// Remove the old dot hover effect and pulse animation
const oldDotHover = '#__vdt-btn:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(34,211,238,.25);}';
content = content.replace(oldDotHover, '');

const oldDot = '#__vdt-dot{position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:#22D3EE;border:2px solid #0B1120;transition:background .3s;}';
const newDot = '#__vdt-dot{display:none;}';
content = content.replace(oldDot, newDot);

const oldPulse = '@keyframes __vdt-pulse{0%,100%{opacity:1;}50%{opacity:.4;}}\n.vdt-compiling #__vdt-dot,.vdt-rendering #__vdt-dot,.vdt-navigating #__vdt-dot{animation:__vdt-pulse .9s ease-in-out infinite;}';
const newPulse = '@keyframes __vdt-pulse{0%,100%{opacity:1;}50%{opacity:.4;}}\n.vdt-compiling svg, .vdt-navigating svg{animation:__vdt-pulse .8s alternate infinite;}';
content = content.replace(oldPulse, newPulse);

// Update HTML of the button
const oldBtnHTML = `<button id="__vdt-btn" class="vdt-idle" onclick="__vdtOpen()" title="Velix DevTools (\${version})">\n  \${ICON_LOGO}\n  <div id="__vdt-dot" class="idle"></div>\n</button>`;
const newBtnHTML = `<button id="__vdt-btn" class="vdt-idle" onclick="__vdtOpen()" title="Velix DevTools (\${version})">\n  \${ICON_LOGO}\n  <span id="__vdt-status-text"></span>\n</button>`;
content = content.replace(oldBtnHTML, newBtnHTML);

// Update JS for setting status
const oldSetStatus = `  function setStatus(s){
    if(btn){ btn.className = 'vdt-' + s; }
    if(dot){ dot.className = s; }
  }`;
const newSetStatus = `  function setStatus(s){
    if(btn){ btn.className = 'vdt-' + s; }
    var text = document.getElementById('__vdt-status-text');
    if(text) {
      if(s === 'compiling') text.textContent = 'Compiling...';
      else if(s === 'navigating') text.textContent = 'Loading...';
      else text.textContent = '';
    }
  }`;
content = content.replace(oldSetStatus, newSetStatus);

fs.writeFileSync('packages/velix/server/devtools.ts', content);
