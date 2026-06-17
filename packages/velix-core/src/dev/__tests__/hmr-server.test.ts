import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mutable state to capture handlers across module boundary
const state = {
  wssHandlers: {} as Record<string, any>,
  chokidarHandlers: {} as Record<string, any>,
};

vi.mock('ws', () => {
  return {
    WebSocket: class { static OPEN = 1; },
    WebSocketServer: vi.fn().mockImplementation(() => ({
      on(event: string, handler: any) {
        state.wssHandlers[event] = handler;
      },
    })),
  };
});

vi.mock('chokidar', () => {
  return {
    default: {
      watch: vi.fn().mockReturnValue({
        on(event: string, handler: any) {
          state.chokidarHandlers[event] = handler;
        },
      }),
    },
  };
});

import { createHMRServer } from '../hmr-server.js';

describe('HMR Server', () => {
  beforeEach(() => {
    state.wssHandlers = {};
    state.chokidarHandlers = {};
    vi.clearAllMocks();
  });

  it('broadcasts messages to all connected open clients', () => {
    const { broadcast, clients } = createHMRServer({} as any, '/root');

    const client1 = { readyState: 1 /* OPEN */, OPEN: 1, send: vi.fn(), on: vi.fn() };
    const client2 = { readyState: 1 /* OPEN */, OPEN: 1, send: vi.fn(), on: vi.fn() };
    const client3 = { readyState: 3 /* CLOSED */, OPEN: 1, send: vi.fn(), on: vi.fn() };

    state.wssHandlers['connection']?.(client1);
    state.wssHandlers['connection']?.(client2);
    state.wssHandlers['connection']?.(client3);

    // Clear "connected" message sent on connection
    client1.send.mockClear();
    client2.send.mockClear();
    client3.send.mockClear();

    broadcast({ type: 'full-reload', timestamp: 123 });

    expect(client1.send).toHaveBeenCalledWith(JSON.stringify({ type: 'full-reload', timestamp: 123 }));
    expect(client2.send).toHaveBeenCalledWith(JSON.stringify({ type: 'full-reload', timestamp: 123 }));
    expect(client3.send).not.toHaveBeenCalled();
  });

  it('removes disconnected clients from the Set', () => {
    const { clients } = createHMRServer({} as any, '/root');

    let closeHandler: (() => void) | null = null;
    const client = {
      readyState: 1,
      send: vi.fn(),
      on(event: string, handler: any) {
        if (event === 'close') closeHandler = handler;
      },
    };

    state.wssHandlers['connection']?.(client);
    expect(clients.has(client as any)).toBe(true);

    closeHandler!();
    expect(clients.has(client as any)).toBe(false);
  });

  it('broadcasts file-changed when chokidar emits change', () => {
    const { clients } = createHMRServer({} as any, '/root');

    const client = { readyState: 1, OPEN: 1, send: vi.fn(), on: vi.fn() };
    clients.add(client as any);

    state.chokidarHandlers['change']?.('/root/file.ts');

    expect(client.send).toHaveBeenCalled();
    const data = JSON.parse(client.send.mock.calls[0][0]);
    expect(data.type).toBe('file-changed');
    expect(data.file).toBe('/root/file.ts');
  });
});
