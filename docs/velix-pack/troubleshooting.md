# Troubleshooting Velix Pack

## Server module imported from client module error

```text
ERROR [VELIX_PACK]

Server module imported from client module.

client: app/profile/page.tsx
server: server/db.ts
```

**Fix**: Do not import `server/` code directly into client components. Use Server Actions or API routes (`/api/*`) instead.

## Clearing Cache

To clear Velix Pack build cache:

```bash
rm -rf .velix/cache/pack
```
