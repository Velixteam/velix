import { VelixDevOverlay } from './dev-overlay.js';

export type HMREvent =
  | { type: 'file-changed'; file: string; timestamp: number }
  | { type: 'file-added';   file: string; timestamp: number }
  | { type: 'compile-start'; timestamp: number }
  | { type: 'compile-done'; duration: number; timestamp: number }
  | { type: 'compile-error'; message: string; file?: string; line?: number; col?: number; timestamp: number }
  | { type: 'full-reload';  timestamp: number };

export function initHMRClient() {
  const ws = new WebSocket(`ws://${location.host}/__velix_hmr`);

  ws.onopen = () => console.log('[Velix HMR] Connected');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data) as HMREvent;
    switch (data.type) {
      case 'compile-start':
        VelixDevOverlay.showCompiling();
        break;
      case 'compile-done':
        VelixDevOverlay.showSuccess(data.duration);
        setTimeout(() => VelixDevOverlay.hide(), 2000);
        break;
      case 'compile-error':
        VelixDevOverlay.showError(data);
        break;
      case 'full-reload':
        window.location.reload();
        break;
      case 'file-changed':
        if (!tryHotUpdate(data.file)) window.location.reload();
        break;
    }
  };

  ws.onclose = () => {
    console.log('[Velix HMR] Disconnected — retrying in 2s...');
    setTimeout(initHMRClient, 2000);
  };
}

function tryHotUpdate(file: string): boolean {
  // Hot update CSS sans reload
  if (file.endsWith('.css')) {
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach(link => {
      link.href = link.href.split('?')[0] + '?t=' + Date.now();
    });
    return true;
  }
  return false;
}
