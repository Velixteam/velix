import { WebSocket } from 'ws';
import chokidar from 'chokidar';
import type { Server as HttpServer } from 'http';
import type { HMRPubSubBackplane } from './hmr-pubsub.js';
export type HMREvent = {
    type: 'file-changed';
    file: string;
    timestamp: number;
} | {
    type: 'file-added';
    file: string;
    timestamp: number;
} | {
    type: 'compile-start';
    timestamp: number;
} | {
    type: 'compile-done';
    duration: number;
    timestamp: number;
} | {
    type: 'compile-error';
    message: string;
    file?: string;
    line?: number;
    col?: number;
    timestamp: number;
} | {
    type: 'full-reload';
    timestamp: number;
};
export interface HMRServerOptions {
    /**
     * Backplane Redis Pub/Sub pour la synchronisation HMR multi-instances.
     * Optionnel — si absent, le HMR est local à cette instance uniquement.
     */
    pubsub?: HMRPubSubBackplane;
}
export declare function createHMRServer(httpServer: HttpServer, projectRoot: string, options?: HMRServerOptions): {
    broadcast: (event: HMREvent) => void;
    broadcastLocal: (event: HMREvent) => void;
    watcher: chokidar.FSWatcher;
    wss: import("ws").Server<typeof WebSocket, typeof import("http").IncomingMessage>;
    clients: Set<WebSocket>;
};
//# sourceMappingURL=hmr-server.d.ts.map