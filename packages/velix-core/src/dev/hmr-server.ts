import { WebSocketServer, WebSocket } from 'ws';
import chokidar from 'chokidar';
import type { Server as HttpServer } from 'http';

export type HMREvent =
  | { type: 'file-changed'; file: string; timestamp: number }
  | { type: 'file-added';   file: string; timestamp: number }
  | { type: 'compile-start'; timestamp: number }
  | { type: 'compile-done'; duration: number; timestamp: number }
  | { type: 'compile-error'; message: string; file?: string; line?: number; col?: number; timestamp: number }
  | { type: 'full-reload';  timestamp: number };

export function createHMRServer(httpServer: HttpServer, projectRoot: string) {
  const wss = new WebSocketServer({ server: httpServer, path: '/__velix_hmr' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: 'connected' }));
    ws.on('close', () => clients.delete(ws));
  });

  const watcher = chokidar.watch(projectRoot, {
    ignored: /node_modules|\.velix|dist|\.git/,
    persistent: true,
    ignoreInitial: true,
  });

  function broadcast(event: HMREvent) {
    const msg = JSON.stringify(event);
    clients.forEach(ws => {
      if (ws.readyState === ws.OPEN) ws.send(msg);
    });
  }

  watcher.on('change', (file) => {
    broadcast({ type: 'file-changed', file, timestamp: Date.now() });
  });
  watcher.on('add', (file) => {
    broadcast({ type: 'file-added', file, timestamp: Date.now() });
  });

  return { broadcast, watcher, wss, clients };
}
