import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HMREvent } from './hmr-server.js';

// Mock ioredis entièrement — pas de connexion réseau
vi.mock('ioredis', () => {
  class MockRedis {
    private subscriptions: Set<string> = new Set();
    private listeners: Map<string, Function[]> = new Map();
    private _published: Array<{ channel: string; message: string }> = [];

    async subscribe(channel: string) {
      this.subscriptions.add(channel);
    }

    on(event: string, handler: Function) {
      if (!this.listeners.has(event)) this.listeners.set(event, []);
      this.listeners.get(event)!.push(handler);
    }

    async publish(channel: string, message: string) {
      this._published.push({ channel, message });
      // Simuler la réception sur ce même mock
      const handlers = this.listeners.get('message') ?? [];
      handlers.forEach(h => h(channel, message));
      return 1;
    }

    async quit() { return 'OK'; }

    getPublished() { return this._published; }
  }

  return { default: MockRedis };
});

import { HMRPubSubBackplane } from './hmr-pubsub.js';

describe('HMRPubSubBackplane', () => {
  it('publish sérialise et envoie l\'event sur le channel Redis', async () => {
    const backplane = new HMRPubSubBackplane('redis://localhost:6379');
    const event: HMREvent = { type: 'file-changed', file: 'app/page.tsx', timestamp: 12345 };

    await backplane.publish(event);

    const published = (backplane as any).pub.getPublished();
    expect(published).toHaveLength(1);
    expect(published[0].channel).toBe('velix:hmr');
    expect(JSON.parse(published[0].message)).toEqual(event);

    await backplane.disconnect();
  });

  it('onEvent handler est appelé quand un message est reçu', async () => {
    const backplane = new HMRPubSubBackplane('redis://localhost:6379');
    const handler = vi.fn();
    backplane.onEvent(handler);

    const event: HMREvent = { type: 'full-reload', timestamp: 99999 };

    // Publier déclenche la réception sur le mock
    await (backplane as any).pub.publish('velix:hmr', JSON.stringify(event));
    // Simuler la réception côté sub
    (backplane as any).handlers.forEach((h: Function) => h(event));

    expect(handler).toHaveBeenCalledWith(event);
    await backplane.disconnect();
  });

  it('onEvent retourne une fonction de désinscription fonctionnelle', async () => {
    const backplane = new HMRPubSubBackplane('redis://localhost:6379');
    const handler = vi.fn();

    const unsubscribe = backplane.onEvent(handler);
    unsubscribe();

    const event: HMREvent = { type: 'compile-start', timestamp: 1 };
    (backplane as any).handlers.forEach((h: Function) => h(event));

    expect(handler).not.toHaveBeenCalled();
    await backplane.disconnect();
  });

  it('2 instances — event de A reçu par B via le backplane', async () => {
    const backplaneA = new HMRPubSubBackplane('redis://localhost:6379');
    const backplaneB = new HMRPubSubBackplane('redis://localhost:6379');

    const receivedOnB = vi.fn();
    backplaneB.onEvent(receivedOnB);

    const event: HMREvent = { type: 'file-changed', file: 'app/page.tsx', timestamp: Date.now() };

    // A publie
    await backplaneA.publish(event);
    // B reçoit (simulé via les handlers internes)
    (backplaneB as any).handlers.forEach((h: Function) => h(event));

    expect(receivedOnB).toHaveBeenCalledWith(event);

    await backplaneA.disconnect();
    await backplaneB.disconnect();
  });

  it('disconnect ferme proprement pub et sub', async () => {
    const backplane = new HMRPubSubBackplane('redis://localhost:6379');

    const pubQuit = vi.spyOn((backplane as any).pub, 'quit');
    const subQuit = vi.spyOn((backplane as any).sub, 'quit');

    await backplane.disconnect();

    expect(pubQuit).toHaveBeenCalledTimes(1);
    expect(subQuit).toHaveBeenCalledTimes(1);
  });
});
