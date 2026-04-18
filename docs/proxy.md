# Proxy Engine - Velix v5

In Velix, the **Proxy Engine** allows you to run code before a request is completed. Based on the incoming request, you can modify the response by rewriting, redirecting, modifying the request or response headers, or responding directly. 

This is incredibly useful for implementing cross-cutting concerns like Authentication, CORS, Rate Limiting, Logging, and A/B Testing.

## 📚 Table of Contents

- [Creating a Proxy](#creating-a-proxy)
- [How it works](#how-it-works)
- [MiddlewareRequest & MiddlewareResponse](#middlewarerequest--middlewareresponse)
- [Examples](#examples)

---

## Creating a Proxy

To use the Proxy Engine, simply create a `proxy.ts` (or `proxy.js`) file at the **root** of your Velix project (next to `package.json` or `velix.config.ts`).

```typescript
// proxy.ts

import { NextFunction, MiddlewareRequest, MiddlewareResponse } from 'velix/types';

export default async function proxy(
  req: MiddlewareRequest,
  res: MiddlewareResponse,
  next: NextFunction
) {
  // 1. Intercept the request
  console.log(`[PROXY] ${req.method} ${req.url}`);

  // 2. Pass control to the next handler
  await next();

  // 3. (Optional) Run logic after handling
}
```

Velix will automatically detect `proxy.ts` on startup and route every incoming request through it.

---

## How it works

The Proxy acts as a pipeline intercepting **every** request hitting the Velix server, including:
- Static assets (`/public/*`)
- Server-Side Rendered pages (SSR)
- API Routes (`/api/*`)
- Implicit internal handlers (e.g., server actions, islands)

It exposes an Express-like structure using `(req, res, next)`.

> [!IMPORTANT]
> Always make sure you selectively apply intensive logic by checking `req.url` to avoid impacting static files and assets performance.

---

## MiddlewareRequest & MiddlewareResponse

The Proxy does not use the standard fetch `Request`/`Response` API, but rather purpose-built objects designed for deep HTTP interception:

### `MiddlewareRequest`

The incoming request is parsed cleanly into a `MiddlewareRequest` object:
- `req.url` (string) - Path of the URL
- `req.method` (string)
- `req.headers` (Object) - All request headers normalized.
- `req.cookies` (Object) - Automatically parsed cookies mapping.
- `req.query` (Object) - URL Search parameters.
- `req.raw` - Escape hatch: original Node.js `IncomingMessage`.

### `MiddlewareResponse`

The response object intercepts the outgoing response headers and data. 
- `res.status(code)` - Chainable status setter.
- `res.header(name, value)` - Chainable header appender.
- `res.json(data)` - Send a direct JSON response and stop execution.
- `res.redirect(url, status = 307)` - Send a temporary/permanent redirect.
- `res.rewrite(url)` - Transparently mutate the requested URL.
- `res.next()` - Continues the pipeline.

---

## Examples

### 1. Basic Authentication

```typescript
// proxy.ts
import { MiddlewareRequest, MiddlewareResponse, NextFunction } from 'velix/types';

export default async function proxy(req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) {
  if (req.url.startsWith('/dashboard')) {
    const sessionCookie = req.cookies['session_token'];
    
    if (!sessionCookie) {
      // User is not authenticated, redirect to login
      res.redirect('/login');
      return; 
    }
  }

  await next();
}
```

### 2. Global CORS Injection

This allows cross-origin requests for API routes. 

```typescript
// proxy.ts
import { MiddlewareRequest, MiddlewareResponse, NextFunction } from 'velix/types';

export default async function proxy(req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) {
  if (req.url.startsWith('/api/')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight directly
    if (req.method === 'OPTIONS') {
      res.status(204).json({});
      return;
    }
  }

  await next();
}
```

### 3. URL Rewrites (A/B Testing)

```typescript
// proxy.ts
import { MiddlewareRequest, MiddlewareResponse, NextFunction } from 'velix/types';

export default async function proxy(req: MiddlewareRequest, res: MiddlewareResponse, next: NextFunction) {
  if (req.url === '/home') {
    // 50% chance to serve the experimental homepage 
    // seamlessly without changing the URL bar
    if (Math.random() > 0.5) {
      res.rewrite('/home-beta');
    }
  }
  
  await next();
}
```
