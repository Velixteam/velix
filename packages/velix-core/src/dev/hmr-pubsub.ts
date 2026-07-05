import Redis from 'ioredis';
import type { HMREvent } from './hmr-server.js';

const CHANNEL = 'velix:hmr';

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
export class HMRPubSubBackplane {
  private pub: Redis;
  private sub: Redis;
  private handlers: Set<(event: HMREvent) => void> = new Set();

  constructor(redisUrl: string) {
    this.pub = new Redis(redisUrl);
    this.sub = new Redis(redisUrl);

    this.sub.subscribe(CHANNEL);
    this.sub.on('message', (_channel, message) => {
      try {
        const event = JSON.parse(message) as HMREvent;
        this.handlers.forEach(h => h(event));
      } catch {
        // Message malformé — ignorer silencieusement
      }
    });
  }

  /**
   * Publie un event HMR sur le channel Redis.
   * Tous les pods abonnés le recevront et le rebroadcastent à leurs clients.
   */
  async publish(event: HMREvent): Promise<void> {
    await this.pub.publish(CHANNEL, JSON.stringify(event));
  }

  /**
   * S'abonne aux events HMR reçus depuis les autres instances.
   * Retourne une fonction de désinscription.
   */
  onEvent(handler: (event: HMREvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Ferme proprement les connexions pub et sub.
   * À appeler au shutdown du serveur de dev.
   */
  async disconnect(): Promise<void> {
    await this.pub.quit();
    await this.sub.quit();
  }
}
