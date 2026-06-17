# HMR & Dev Overlay (v5.2)

Velix v5.2 introduces a powerful Hot Module Replacement (HMR) system and a unified Dev Overlay to make the developer experience seamless.

## How it works

When you run `velix dev`, the framework spins up an integrated WebSocket server (`/__velix_hmr`). This server watches your `app/`, `components/`, and `server/` directories using `chokidar`.

Whenever a file changes:
1. **Server-side**: Velix recompiles the affected modules via `esbuild`.
2. **Client-side**: A lightweight HMR client (`hmr-client.ts`) listens to WebSocket events (`file-changed`, `compile-start`, `compile-done`, `compile-error`).
3. **Overlay**: The Dev Overlay (`dev-overlay.ts`) catches compilation events and displays real-time feedback.

## Dev Overlay Features

- **Compiling State**: A non-intrusive bottom-right spinner (`Compiling...`) appears when a build starts.
- **Success State**: Displays a temporary `✓ Compiled in Xms` toast when compilation finishes successfully.
- **Error State**: A full-screen modal overlays your app if there's a syntax or build error, showing:
  - The exact file and line number.
  - The raw error message and stack trace.
  - An `Open in Editor` button that instantly opens the problematic file in your code editor (via `vscode://` protocol).

## Configuration

HMR is enabled by default in development mode. You don't need to configure anything. 
If you need to customize the HMR port or behavior, you can do so in `velix.config.ts`:

```ts
// velix.config.ts
import { defineConfig } from "@teamvelix/velix";

export default defineConfig({
  // Custom dev server settings
  server: {
    port: 3000,
  }
});
```

*Note: The Dev Overlay is automatically stripped out in production builds.*
