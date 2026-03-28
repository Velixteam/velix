/**
 * Velix v5 Enhanced DevTools
 * Visual indicators for rendering, compiling, and navigation states
 * Inspired by Next.js latest DevTools
 */

export interface DevToolsState {
  status: 'idle' | 'rendering' | 'compiling' | 'navigating' | 'error';
  route?: string;
  timestamp?: number;
  error?: string;
}

/**
 * Generate enhanced DevTools HTML with visual state indicators
 */
export function generateDevToolsHtml(isDev: boolean): string {
  if (!isDev) return '';

  return `<style>
@keyframes velix-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }
}

@keyframes velix-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.velix-idle { background: #0f172a !important; border: 2px solid #22D3EE !important; }
.velix-rendering { background: #ea580c !important; border: 2px solid #fb923c !important; animation: velix-pulse 1.5s infinite !important; }
.velix-compiling { background: #16a34a !important; border: 2px solid #4ade80 !important; animation: velix-spin 2s linear infinite !important; }
.velix-navigating { background: #2563eb !important; border: 2px solid #60a5fa !important; animation: velix-pulse 1s infinite !important; }
.velix-error { background: #dc2626 !important; border: 2px solid #f87171 !important; animation: velix-pulse 0.8s infinite !important; }

.velix-status-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #0f172a;
}

.velix-status-idle { background: #22D3EE; }
.velix-status-rendering { background: #fb923c; }
.velix-status-compiling { background: #4ade80; }
.velix-status-navigating { background: #60a5fa; }
.velix-status-error { background: #f87171; }
</style>

<script>
  // DevTools State Management
  window.__VELIX_DEV_TOOLS__ = {
    status: 'idle',
    setStatus: function(newStatus) {
      this.status = newStatus;
      const widget = document.getElementById('__velix-dev-tools');
      const badge = document.getElementById('__velix-status-badge');
      const statusText = document.getElementById('__velix-status-text');
      
      if (widget) {
        widget.className = 'velix-' + newStatus;
      }
      
      if (badge) {
        badge.className = 'velix-status-badge velix-status-' + newStatus;
      }
      
      if (statusText) {
        const statusLabels = {
          idle: 'Ready',
          rendering: 'Rendering',
          compiling: 'Compiling',
          navigating: 'Navigating',
          error: 'Error'
        };
        statusText.textContent = statusLabels[newStatus] || 'Unknown';
        statusText.style.color = {
          idle: '#22D3EE',
          rendering: '#fb923c',
          compiling: '#4ade80',
          navigating: '#60a5fa',
          error: '#f87171'
        }[newStatus] || '#94a3b8';
      }
    }
  };

  // HMR Connection
  const es = new EventSource('/__velix/hmr');
  es.onmessage = (e) => {
    const data = e.data;
    
    if (data === 'reload') {
      window.__VELIX_DEV_TOOLS__.setStatus('idle');
      setTimeout(() => location.reload(), 100);
    }
    
    if (data === 'building') {
      window.__VELIX_DEV_TOOLS__.setStatus('compiling');
    }
    
    if (data === 'built') {
      window.__VELIX_DEV_TOOLS__.setStatus('idle');
    }
    
    if (data.startsWith('rendering:')) {
      window.__VELIX_DEV_TOOLS__.setStatus('rendering');
      setTimeout(() => window.__VELIX_DEV_TOOLS__.setStatus('idle'), 1000);
    }
    
    if (data.startsWith('error:')) {
      window.__VELIX_DEV_TOOLS__.setStatus('error');
    }
  };

  es.onerror = () => {
    window.__VELIX_DEV_TOOLS__.setStatus('error');
  };
</script>

<div id="__velix-dev-tools" class="velix-idle" style="position:fixed;bottom:16px;left:16px;z-index:9999;border-radius:50%;padding:4px;box-shadow:0 4px 12px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;width:40px;height:40px;cursor:pointer;transition:all 0.3s ease;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" onclick="document.getElementById('__velix-dev-panel').style.display='block'" title="Velix DevTools">
  <img src="/__velix/logo.webp" alt="Velix DevTools" style="width:22px;height:22px;" />
  <div id="__velix-status-badge" class="velix-status-badge velix-status-idle"></div>
</div>

<div id="__velix-dev-panel" style="display:none;position:fixed;bottom:70px;left:16px;width:320px;background:#0f172a;color:white;border-radius:16px;padding:20px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,0.4);z-index:10000;border:1px solid #1e293b;">
  <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:16px;margin-bottom:16px;">
    <h3 style="margin:0;font-size:16px;font-weight:700;display:flex;align-items:center;gap:10px;">
      <img src="/__velix/logo.webp" style="width:18px;height:18px;" /> 
      Velix DevTools
    </h3>
    <button onclick="document.getElementById('__velix-dev-panel').style.display='none'" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:22px;line-height:1;padding:0;margin:0;transition:color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#94a3b8'">&times;</button>
  </div>
  
  <div style="margin-bottom:16px;padding:12px;background:#1e293b;border-radius:8px;border:1px solid #334155;">
    <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Status</div>
    <div id="__velix-status-text" style="font-size:16px;font-weight:600;color:#22D3EE;">Ready</div>
  </div>
  
  <div style="font-size:13px;color:#cbd5e1;line-height:2;">
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b;">
      <span style="color:#94a3b8;">Framework</span>
      <strong style="color:white;font-weight:600;">v5.0.0</strong>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b;">
      <span style="color:#94a3b8;">Environment</span>
      <strong style="color:#10b981;font-weight:600;">Development</strong>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b;">
      <span style="color:#94a3b8;">Router</span>
      <strong style="color:white;font-weight:600;">App Directory</strong>
    </div>
    <div style="display:flex;justify-content:space-between;padding:8px 0;">
      <span style="color:#94a3b8;">Rendering</span>
      <strong style="color:#60a5fa;font-weight:600;">Streaming SSR</strong>
    </div>
  </div>
  
  <div style="margin-top:16px;padding-top:16px;border-top:1px solid #334155;">
    <div style="font-size:11px;color:#64748b;text-align:center;">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22D3EE;margin-right:4px;"></span> Idle
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#fb923c;margin:0 4px 0 12px;"></span> Rendering
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4ade80;margin:0 4px 0 12px;"></span> Compiling
    </div>
  </div>
</div>`;
}
