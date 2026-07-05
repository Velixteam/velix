import { WebSocketServer, WebSocket } from 'ws';
import chokidar from 'chokidar';
import type { Server as HttpServer } from 'http';
import type { HMRPubSubBackplane } from './hmr-pubsub.js';

export type HMREvent =
  | { type: 'file-changed'; file: string; timestamp: number }
  | { type: 'file-added';   file: string; timestamp: number }
  | { type: 'compile-start'; timestamp: number }
  | { type: 'compile-done'; duration: number; timestamp: number }
  | { type: 'compile-error'; message: string; file?: string; line?: number; col?: number; timestamp: number }
  | { type: 'full-reload';  timestamp: number };

export interface HMRServerOptions {
  /**
   * Backplane Redis Pub/Sub pour la synchronisation HMR multi-instances.
   * Optionnel — si absent, le HMR est local à cette instance uniquement.
   */
  pubsub?: HMRPubSubBackplane;
}

export function createHMRServer(
  httpServer: HttpServer,
  projectRoot: string,
  options?: HMRServerOptions
) {
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

  /**
   * Broadcast local : envoie l'event aux clients WebSocket de cette instance.
   */
  function broadcastLocal(event: HMREvent) {
    const msg = JSON.stringify(event);
    clients.forEach(ws => {
      if (ws.readyState === ws.OPEN) ws.send(msg);
    });
  }

  /**
   * Broadcast complet :
   * 1. Notifie les clients locaux (WebSocket de cette instance)
   * 2. Publie sur le backplane Redis si configuré (pour les autres pods)
   */
  function broadcast(event: HMREvent) {
    broadcastLocal(event);
    // Cross-instance via Redis Pub/Sub si configuré
    options?.pubsub?.publish(event);
  }

  // Écouter les events des autres instances via le backplane
  options?.pubsub?.onEvent(event => {
    // Uniquement rebroadcast local — ne pas re-publier sur Redis (évite les boucles)
    broadcastLocal(event);
  });

  watcher.on('change', (file) => {
    broadcast({ type: 'file-changed', file, timestamp: Date.now() });
  });
  watcher.on('add', (file) => {
    broadcast({ type: 'file-added', file, timestamp: Date.now() });
  });

  return { broadcast, broadcastLocal, watcher, wss, clients };
}
