import type { HMREvent } from './hmr-server.js';
/**
 * Backplane Redis Pub/Sub pour la synchronisation HMR multi-instances.
 *
 * Problème sans backplane :
 *   Pod A déclenche un HMR → notifie uniquement ses clients WebSocket.
 *   Les clients connectés sur les pods B et C ne reçoivent rien.
 *
 * Solution :
 *   Chaque pod publie ses events HMR sur le channel Redis 'velix:hmr'.
 *   Chaque pod écoute ce channel et rebroadcast aux clients WebSocket locaux.
 *
 * @example
 * ```ts
 * import { HMRPubSubBackplane } from 'velix-core/dev/hmr-pubsub';
 * import { createHMRServer } from 'velix-core/dev/hmr-server';
 *
 * const pubsub = new HMRPubSubBackplane(process.env.REDIS_URL);
 * const hmr = createHMRServer(httpServer, projectRoot, { pubsub });
 * ```
 */
export declare class HMRPubSubBackplane {
    private pub;
    private sub;
    private handlers;
    constructor(redisUrl: string);
    /**
     * Publie un event HMR sur le channel Redis.
     * Tous les pods abonnés le recevront et le rebroadcastent à leurs clients.
     */
    publish(event: HMREvent): Promise<void>;
    /**
     * S'abonne aux events HMR reçus depuis les autres instances.
     * Retourne une fonction de désinscription.
     */
    onEvent(handler: (event: HMREvent) => void): () => void;
    /**
     * Ferme proprement les connexions pub et sub.
     * À appeler au shutdown du serveur de dev.
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=hmr-pubsub.d.ts.map