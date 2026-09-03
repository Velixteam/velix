# Code Splitting

Velix Pack automatically splits your application into distinct chunks:

1. **Server Bundle**: All modules in `server/` or marked with `'use server'`.
2. **Client Main Bundle**: Core client modules shared across routes.
3. **Route Chunks**: Per-route chunks (`route-home`, `route-dashboard`, etc.) loaded on demand when navigating.
