/**
 * Velix v5.1 DevTools
 * 3-tab panel: Route · Performance · Info
 * Inspired by Next.js DevTools design
 */

export interface DevToolsContext {
  version?: string;
  port?: number;
  host?: string;
  nodeVersion?: string;
  reactVersion?: string;
  tsVersion?: string;
}

export interface DevToolsState {
  status: 'idle' | 'rendering' | 'compiling' | 'navigating' | 'error';
  route?: string;
  timestamp?: number;
  error?: string;
}

// ─── Inline SVG icons ───────────────────────────────────────────────────────

const ICON_ROUTE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const ICON_PERF  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const ICON_INFO  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const ICON_FILE  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
const ICON_GEAR  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`;
const ICON_MON   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
const ICON_TS    = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`;
const ICON_CLOCK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const ICON_TRI   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 19h20L12 2z"/></svg>`;
const ICON_TERM  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`;
const ICON_LOGO  = `<img src="/__velix/logo.webp" alt="Velix Logo" width="14" height="14" style="border-radius:2px; object-fit:cover;" onerror="this.style.display='none'" />`;

/**
 * Generate enhanced DevTools HTML — 3-tab panel.
 * Only injected in development mode.
 */
export function generateDevToolsHtml(isDev: boolean, ctx: DevToolsContext = {}): string {
  if (!isDev) return '';

  const version     = ctx.version    ?? '5.1.0';
  const port        = ctx.port       ?? 3000;
  const host        = ctx.host       ?? 'localhost';
  const nodeVersion = ctx.nodeVersion ?? process.version.replace('v', '');
  const reactVersion = ctx.reactVersion ?? '—';
  const tsVersion   = ctx.tsVersion   ?? '—';

  return `
<style>
/* ── Velix DevTools v5.1 ────────────────────────────────── */
#__vdt-btn{position:fixed;bottom:16px;left:16px;z-index:9999;width:40px;height:40px;border-radius:50%;background:#111827;border:2px solid #22D3EE;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.5);transition:transform .2s,box-shadow .2s;outline:none;}
#__vdt-btn:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(34,211,238,.25);}
#__vdt-dot{position:absolute;top:-3px;right:-3px;width:11px;height:11px;border-radius:50%;background:#22D3EE;border:2px solid #111827;transition:background .3s;}
#__vdt{display:none;position:fixed;bottom:68px;left:16px;width:340px;background:#111827;color:#f3f4f6;border-radius:14px;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;box-shadow:0 24px 60px rgba(0,0,0,.6);z-index:10000;border:1px solid #1f2937;overflow:hidden;}
/* header */
.__vdt-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #1f2937;}
.__vdt-brand{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;color:#f9fafb;}
.__vdt-badge{font-size:11px;font-weight:600;background:#1f2937;color:#9ca3af;border-radius:5px;padding:2px 7px;letter-spacing:.3px;}
.__vdt-close{background:none;border:none;color:#6b7280;cursor:pointer;font-size:20px;line-height:1;padding:0;transition:color .15s;}
.__vdt-close:hover{color:#f9fafb;}
/* tabs */
.__vdt-tabs{display:flex;border-bottom:1px solid #1f2937;}
.__vdt-tab{flex:1;padding:10px 0;background:none;border:none;color:#6b7280;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;border-bottom:2px solid transparent;transition:color .15s,border-color .15s;font-family:inherit;letter-spacing:.1px;}
.__vdt-tab:hover{color:#d1d5db;}
.__vdt-tab.active{color:#10b981;border-bottom-color:#10b981;}
/* body */
.__vdt-body{padding:14px 16px;min-height:200px;}
.__vdt-section{margin-bottom:14px;}
.__vdt-label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px;}
.__vdt-box{background:#1f2937;border-radius:8px;padding:10px 13px;font-size:13px;color:#e5e7eb;font-family:ui-monospace,'Cascadia Code','Fira Code',monospace;border:1px solid #374151;}
.__vdt-row{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;background:#1f2937;border-radius:8px;margin-bottom:6px;border:1px solid #374151;}
.__vdt-row-left{display:flex;align-items:center;gap:8px;color:#d1d5db;}
.__vdt-row-right{font-family:ui-monospace,'Cascadia Code',monospace;color:#10b981;font-size:12px;font-weight:500;}
.__vdt-pill{font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;letter-spacing:.2px;}
.__vdt-pill-green{background:#052e16;color:#4ade80;border:1px solid #166534;}
.__vdt-pill-blue{background:#0c1a3a;color:#60a5fa;border:1px solid #1e3a8a;}
.__vdt-render{display:flex;align-items:center;gap:6px;padding:8px 13px;background:#1f2937;border-radius:8px;border:1px solid #374151;color:#9ca3af;font-size:12px;}
.__vdt-render svg{color:#6b7280;}
/* vitals */
.__vdt-vital{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;background:#1f2937;border-radius:8px;margin-bottom:6px;border:1px solid #374151;}
.__vdt-vital-left{display:flex;align-items:center;gap:8px;}
.__vdt-dot-good{width:8px;height:8px;border-radius:50%;background:#10b981;flex-shrink:0;}
.__vdt-dot-warn{width:8px;height:8px;border-radius:50%;background:#f59e0b;flex-shrink:0;}
.__vdt-dot-bad{width:8px;height:8px;border-radius:50%;background:#ef4444;flex-shrink:0;}
.__vdt-vital-name{color:#d1d5db;font-weight:500;}
.__vdt-vital-val{font-family:ui-monospace,'Cascadia Code',monospace;color:#10b981;font-size:12px;font-weight:600;}
.__vdt-build{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;color:#9ca3af;font-size:12px;border-top:1px solid #374151;margin-top:8px;padding-top:12px;}
/* info rows */
.__vdt-info-row{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;background:#1f2937;border-radius:8px;margin-bottom:6px;border:1px solid #374151;}
.__vdt-info-left{display:flex;align-items:center;gap:8px;color:#d1d5db;}
.__vdt-info-val{font-family:ui-monospace,'Cascadia Code',monospace;color:#9ca3af;font-size:12px;}
.__vdt-dev-badge{display:flex;align-items:center;gap:8px;padding:10px 13px;background:#052e16;border:1px solid #166534;border-radius:8px;color:#4ade80;font-size:12px;font-weight:500;margin-top:10px;}
/* footer */
.__vdt-footer{padding:10px 16px;border-top:1px solid #1f2937;display:flex;align-items:center;justify-content:space-between;}
.__vdt-host{color:#6b7280;font-size:11px;font-family:ui-monospace,'Cascadia Code',monospace;}
.__vdt-conn{display:flex;align-items:center;gap:5px;font-size:11px;color:#10b981;}
.__vdt-conn-dot{width:6px;height:6px;border-radius:50%;background:#10b981;}

/* ── Widget state colors ── */
.vdt-idle{border-color:#22D3EE !important;}
.vdt-compiling{border-color:#4ade80 !important;}
.vdt-rendering{border-color:#fb923c !important;}
.vdt-navigating{border-color:#60a5fa !important;}
.vdt-error{border-color:#f87171 !important;}
#__vdt-dot.idle{background:#22D3EE;}
#__vdt-dot.compiling{background:#4ade80;}
#__vdt-dot.rendering{background:#fb923c;}
#__vdt-dot.navigating{background:#60a5fa;}
#__vdt-dot.error{background:#f87171;}
@keyframes __vdt-pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
.vdt-compiling #__vdt-dot,.vdt-rendering #__vdt-dot,.vdt-navigating #__vdt-dot{animation:__vdt-pulse .9s ease-in-out infinite;}
</style>

<!-- ── Floating button ── -->
<button id="__vdt-btn" class="vdt-idle" onclick="__vdtOpen()" title="Velix DevTools (${version})">
  ${ICON_LOGO}
  <div id="__vdt-dot" class="idle"></div>
</button>

<!-- ── Panel ── -->
<div id="__vdt">
  <!-- Header -->
  <div class="__vdt-header">
    <div class="__vdt-brand">
      ${ICON_LOGO}
      Velix
      <span class="__vdt-badge">${version}</span>
    </div>
    <button class="__vdt-close" onclick="__vdtClose()" title="Close">&times;</button>
  </div>

  <!-- Tabs -->
  <div class="__vdt-tabs">
    <button class="__vdt-tab active" id="__vtab-btn-route" onclick="__vdtTab('route')">${ICON_ROUTE} Route</button>
    <button class="__vdt-tab" id="__vtab-btn-perf"  onclick="__vdtTab('perf')">${ICON_PERF} Performance</button>
    <button class="__vdt-tab" id="__vtab-btn-info"  onclick="__vdtTab('info')">${ICON_INFO} Info</button>
  </div>

  <!-- Tab: Route -->
  <div class="__vdt-body" id="__vtab-route">
    <div class="__vdt-section">
      <div class="__vdt-label">Current Route</div>
      <div class="__vdt-box" id="__vdt-route-path">/</div>
    </div>
    <div class="__vdt-section">
      <div class="__vdt-label">Route Segments</div>
      <div class="__vdt-row">
        <div class="__vdt-row-left">${ICON_FILE} <span>app</span></div>
        <span class="__vdt-pill __vdt-pill-blue">layout</span>
      </div>
      <div class="__vdt-row" id="__vdt-page-row">
        <div class="__vdt-row-left">${ICON_FILE} <span id="__vdt-page-name">page.tsx</span></div>
        <span class="__vdt-pill __vdt-pill-green">page</span>
      </div>
    </div>
    <div class="__vdt-render" id="__vdt-rendering">
      ${ICON_TERM} Rendering: <strong id="__vdt-render-type" style="color:#d1d5db;margin-left:4px;">SSR</strong>
    </div>
  </div>

  <!-- Tab: Performance -->
  <div class="__vdt-body" id="__vtab-perf" style="display:none;">
    <div class="__vdt-section">
      <div class="__vdt-label">Vitals</div>
      <div class="__vdt-vital">
        <div class="__vdt-vital-left"><div class="__vdt-dot-good"></div><span class="__vdt-vital-name">FCP</span></div>
        <span class="__vdt-vital-val" id="__vdt-fcp">—</span>
      </div>
      <div class="__vdt-vital">
        <div class="__vdt-vital-left"><div class="__vdt-dot-good"></div><span class="__vdt-vital-name">LCP</span></div>
        <span class="__vdt-vital-val" id="__vdt-lcp">—</span>
      </div>
      <div class="__vdt-vital">
        <div class="__vdt-vital-left"><div class="__vdt-dot-good"></div><span class="__vdt-vital-name">CLS</span></div>
        <span class="__vdt-vital-val" id="__vdt-cls">—</span>
      </div>
      <div class="__vdt-vital">
        <div class="__vdt-vital-left"><div class="__vdt-dot-good"></div><span class="__vdt-vital-name">TTFB</span></div>
        <span class="__vdt-vital-val" id="__vdt-ttfb">—</span>
      </div>
    </div>
    <div class="__vdt-build">
      <div style="display:flex;align-items:center;gap:6px;">${ICON_CLOCK} Build time:</div>
      <span id="__vdt-build-time" style="color:#d1d5db;font-family:ui-monospace,monospace;font-size:12px;">—</span>
    </div>
  </div>

  <!-- Tab: Info -->
  <div class="__vdt-body" id="__vtab-info" style="display:none;">
    <div class="__vdt-info-row">
      <div class="__vdt-info-left">${ICON_LOGO} <span>Velix</span></div>
      <span class="__vdt-info-val">${version}</span>
    </div>
    <div class="__vdt-info-row">
      <div class="__vdt-info-left">${ICON_GEAR} <span>React</span></div>
      <span class="__vdt-info-val" id="__vdt-react-ver">${reactVersion}</span>
    </div>
    <div class="__vdt-info-row">
      <div class="__vdt-info-left">${ICON_MON} <span>Node.js</span></div>
      <span class="__vdt-info-val">${nodeVersion}</span>
    </div>
    <div class="__vdt-info-row">
      <div class="__vdt-info-left">${ICON_TS} <span>TypeScript</span></div>
      <span class="__vdt-info-val" id="__vdt-ts-ver">${tsVersion}</span>
    </div>
    <div class="__vdt-dev-badge">
      ${ICON_TERM} Development mode active
    </div>
  </div>

  <!-- Footer -->
  <div class="__vdt-footer">
    <span class="__vdt-host">${host}:${port}</span>
    <div class="__vdt-conn">
      <div class="__vdt-conn-dot" id="__vdt-conn-dot"></div>
      <span id="__vdt-conn-text">connected</span>
    </div>
  </div>
</div>

<script>
(function(){
  /* ── Tab switching ── */
  window.__vdtTab = function(name){
    ['route','perf','info'].forEach(function(t){
      var body = document.getElementById('__vtab-' + t);
      var btn  = document.getElementById('__vtab-btn-' + t);
      if(!body || !btn) return;
      var active = t === name;
      body.style.display = active ? 'block' : 'none';
      btn.classList.toggle('active', active);
    });
  };

  window.__vdtOpen  = function(){ document.getElementById('__vdt').style.display = 'block'; };
  window.__vdtClose = function(){ document.getElementById('__vdt').style.display = 'none'; };

  /* ── Route info ── */
  function updateRoute(){
    var p = window.location.pathname;
    var el = document.getElementById('__vdt-route-path');
    if(el) el.textContent = p;
    var seg = p.split('/').filter(Boolean);
    var pageName = seg.length ? seg[seg.length-1] + '.tsx' : 'page.tsx';
    var pn = document.getElementById('__vdt-page-name');
    if(pn) pn.textContent = pageName;
    /* Detect rendering mode from meta generator or search param */
    var rt = document.getElementById('__vdt-render-type');
    if(rt){
      var sp = new URLSearchParams(window.location.search);
      rt.textContent = sp.get('_render') || (document.querySelector('meta[name="generator"]') ? 'SSR' : 'Static');
    }
  }
  updateRoute();
  window.addEventListener('popstate', updateRoute);

  /* ── Web Vitals ── */
  function fmtMs(v){ return v < 1000 ? Math.round(v) + 'ms' : (v/1000).toFixed(2) + 's'; }
  function setVital(id, v, threshGood, threshOk){
    var el = document.getElementById(id);
    if(!el) return;
    el.textContent = typeof v === 'number' ? (id === '__vdt-cls' ? v.toFixed(3) : fmtMs(v)) : v;
    var dot = el.closest('.__vdt-vital')?.querySelector('[class^="__vdt-dot"]');
    if(dot && typeof v === 'number'){
      dot.className = v <= threshGood ? '__vdt-dot-good' : v <= threshOk ? '__vdt-dot-warn' : '__vdt-dot-bad';
    }
    if(el && typeof v === 'number'){
      el.style.color = v <= threshGood ? '#10b981' : v <= threshOk ? '#f59e0b' : '#ef4444';
    }
  }

  try {
    /* FCP */
    new PerformanceObserver(function(l){
      var e = l.getEntries()[0]; if(e) setVital('__vdt-fcp', e.startTime, 1800, 3000);
    }).observe({ type:'paint', buffered:true });

    /* LCP */
    new PerformanceObserver(function(l){
      var entries = l.getEntries();
      var e = entries[entries.length-1]; if(e) setVital('__vdt-lcp', e.startTime, 2500, 4000);
    }).observe({ type:'largest-contentful-paint', buffered:true });

    /* CLS */
    var _cls = 0;
    new PerformanceObserver(function(l){
      l.getEntries().forEach(function(e){ if(!e.hadRecentInput) _cls += e.value; });
      setVital('__vdt-cls', _cls, 0.1, 0.25);
    }).observe({ type:'layout-shift', buffered:true });

    /* TTFB */
    new PerformanceObserver(function(l){
      var e = l.getEntries()[0]; if(e) setVital('__vdt-ttfb', e.responseStart - e.requestStart, 800, 1800);
    }).observe({ type:'navigation', buffered:true });
  } catch(e){}

  /* Build time from server-injected global */
  var bt = window.__VELIX_BUILD_TIME__;
  var btel = document.getElementById('__vdt-build-time');
  if(btel) btel.textContent = bt ? bt + 'ms' : '—';

  /* React version from window.React or server injection */
  var rv = document.getElementById('__vdt-react-ver');
  if(rv && rv.textContent === '—' && window.React) rv.textContent = window.React.version;

  /* TypeScript version (injected by server if available) */
  var tsv = document.getElementById('__vdt-ts-ver');
  if(tsv && tsv.textContent === '—') tsv.textContent = window.__VELIX_TS_VERSION__ || '—';

  /* ── HMR + Status ── */
  var btn = document.getElementById('__vdt-btn');
  var dot = document.getElementById('__vdt-dot');
  var connDot  = document.getElementById('__vdt-conn-dot');
  var connText = document.getElementById('__vdt-conn-text');

  function setStatus(s){
    if(btn){ btn.className = 'vdt-' + s; }
    if(dot){ dot.className = s; }
  }

  function setConn(ok){
    if(connDot)  connDot.style.background  = ok ? '#10b981' : '#ef4444';
    if(connText) connText.textContent = ok ? 'connected' : 'disconnected';
    if(connText) connText.style.color = ok ? '#10b981' : '#ef4444';
  }

  var es = new EventSource('/__velix/hmr');

  es.onopen = function(){ setConn(true); };

  es.onmessage = function(e){
    var data = e.data;
    if(data === 'reload'){
      setStatus('navigating');
      setTimeout(function(){ location.reload(); }, 120);
    } else if(data === 'building'){
      setStatus('compiling');
    } else if(data === 'built'){
      setStatus('idle');
    } else if(data.startsWith('rendering:')){
      setStatus('rendering');
      setTimeout(function(){ setStatus('idle'); }, 900);
    } else if(data.startsWith('error:')){
      setStatus('error');
    }
  };

  es.onerror = function(){
    if(es.readyState === 2){
      setStatus('error');
      setConn(false);
    }
  };

  setStatus('idle');
})();
</script>`;
}
