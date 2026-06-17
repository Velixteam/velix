import type { HMREvent } from './hmr-client.js';

export const VelixDevOverlay = {
  container: null as HTMLDivElement | null,
  timeoutId: null as any,

  getContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = '__velix-overlay';
      document.body.appendChild(this.container);
    }
    return this.container;
  },

  showCompiling() {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      const el = this.getContainer();
      el.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; z-index: 99999; background: #0a0a0a; border: 1px solid #1e201e; border-radius: 8px; padding: 10px 16px; display: flex; align-items: center; gap: 10px; font-family: system-ui; font-size: 13px;">
          <style>
            @keyframes velix-spin { 100% { transform: rotate(360deg); } }
          </style>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="animation: velix-spin 0.8s linear infinite;">
            <circle cx="8" cy="8" r="7" stroke="#1e201e" stroke-width="2" />
            <path d="M15 8a7 7 0 0 0-7-7" stroke="#00e87a" stroke-width="2" stroke-linecap="round" />
          </svg>
          <div><span style="color: #00e87a; font-weight: bold;">Compiling</span><span style="color: #6b7068;">...</span></div>
        </div>
      `;
    }, 200);
  },

  showSuccess(duration: number) {
    clearTimeout(this.timeoutId);
    const el = this.getContainer();
    el.innerHTML = `
      <div style="position: fixed; bottom: 20px; right: 20px; z-index: 99999; background: #0a0a0a; border: 1px solid rgba(0,232,122,0.15); border-radius: 8px; padding: 10px 16px; display: flex; align-items: center; gap: 10px; font-family: system-ui; font-size: 13px;">
        <span style="color: #00e87a;">✓</span>
        <span style="color: #e8ebe5;">Compiled in <span style="color: #00e87a; font-weight: bold;">${duration}ms</span></span>
      </div>
    `;
  },

  showError(err: Extract<HMREvent, { type: 'compile-error' }>) {
    clearTimeout(this.timeoutId);
    const el = this.getContainer();
    const loc = err.line ? `Line ${err.line}, Col ${err.col}` : '';
    const openInEditor = err.file ? `<a href="vscode://file/${err.file}:${err.line || 1}:${err.col || 1}" style="background: #1e201e; color: #e8ebe5; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 13px;">Open in Editor</a>` : '';

    el.innerHTML = `
      <div style="position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.88); display: flex; align-items: center; justify-content: center; font-family: system-ui;">
        <div style="width: 100%; max-width: 640px; background: #0a0a0a; border: 1px solid rgba(255,68,68,0.3); border-radius: 12px; overflow: hidden; margin: 20px;">
          <div style="padding: 16px 20px; border-bottom: 1px solid #1e201e; display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #ff6b6b; font-weight: bold; font-size: 15px;">⚠ Velix Build Error</div>
            <button onclick="document.getElementById('__velix-overlay').innerHTML = ''" style="background: transparent; border: none; color: #6b7068; cursor: pointer; font-size: 18px;">×</button>
          </div>
          <div style="padding: 20px;">
            ${err.file ? `<div style="color: #00e87a; font-family: monospace; font-size: 13px; margin-bottom: 4px;">${err.file}</div>` : ''}
            ${loc ? `<div style="color: #6b7068; font-size: 12px; margin-bottom: 16px;">${loc}</div>` : ''}
            <pre style="background: #111; color: #e8ebe5; padding: 16px; border-radius: 8px; overflow-y: auto; max-height: 200px; font-size: 13px; margin: 0 0 20px 0; border: 1px solid #1e201e; white-space: pre-wrap;">${err.message}</pre>
            <div style="display: flex; gap: 10px;">
              ${openInEditor}
              <button onclick="document.getElementById('__velix-overlay').innerHTML = ''" style="background: transparent; color: #6b7068; padding: 6px 12px; border: 1px solid #1e201e; border-radius: 6px; cursor: pointer; font-size: 13px;">Dismiss</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  hide() {
    clearTimeout(this.timeoutId);
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
};
