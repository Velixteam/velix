# Server / Client Boundary Enforcement

Velix Pack enforces a strict separation between server-only logic and client components.

## Rules

1. Modules inside `server/` or containing `'use server'` are marked as `server`.
2. Modules containing `'use client'` or `'use island'` are marked as `client`.
3. Importing a `server` module directly from a `client` module produces an explicit `VELIX_PACK` error:

```text
ERROR [VELIX_PACK]

Server module imported from client module.

client: app/profile/page.tsx
server: server/db.ts
```
