# HMR Integration

Velix Pack integrates directly with `velix-core` HMR WebSocket server.

When a client component is modified:
- Module graph calculates affected client chunks.
- Incremental rebuild generates the updated module JS.
- HMR server broadcasts `file-changed` event.
- Client runtime updates component without full page reload.
