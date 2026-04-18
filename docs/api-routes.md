# API Routes - Velix v5

API Routes allow you to create custom HTTP endpoints in your Velix application.

## 📚 Table of Contents

- [Introduction](#introduction)
- [Creating an API Route](#creating-an-api-route)
- [HTTP Methods](#http-methods)
- [Request & Response](#request--response)
- [Dynamic Parameters](#dynamic-parameters)
- [Proxy Interceptor](#proxy-interceptor)
- [Best Practices](#best-practices)

---

## Introduction

API Routes in Velix are files placed in the `server/api/` directory that export handlers for different HTTP methods.

**Structure:**
```
server/
├── api/
│   ├── hello.ts           → /api/hello
│   ├── users.ts           → /api/users
│   └── users/
│       └── [id].ts        → /api/users/:id
```

**Note:** Unlike Next.js which uses `app/api/route.ts`, Velix uses the `server/` directory for backend logic.

---

## Creating an API Route

### Simple Route

```typescript
// server/api/hello.ts
export function GET(request: Request) {
  return new Response(JSON.stringify({ message: 'Hello from Velix!' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Using `json()` Helper

```typescript
// server/api/hello.ts
import { json } from 'velix';

export function GET(request: Request) {
  return json({ message: 'Hello from Velix!' });
}
```

### Using `text()` Helper

```typescript
// server/api/status.ts
import { text } from 'velix';

export function GET(request: Request) {
  return text('Server is running!');
}
```

---

## HTTP Methods

Velix supports all standard HTTP methods:

```typescript
// server/api/users.ts
import { json } from 'velix';

// GET - Retrieve data
export function GET(request: Request) {
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];
  return json(users);
}

// POST - Create a resource
export async function POST(request: Request) {
  const body = await request.json();
  const newUser = { id: Date.now(), ...body };
  return json(newUser, { status: 201 });
}

// PUT - Update a resource
export async function PUT(request: Request) {
  const body = await request.json();
  // Update logic
  return json({ success: true });
}

// PATCH - Partial update
export async function PATCH(request: Request) {
  const body = await request.json();
  // Partial update logic
  return json({ success: true });
}

// DELETE - Delete a resource
export function DELETE(request: Request) {
  // Delete logic
  return json({ success: true });
}
```

---

## Request & Response

### Reading the Body

```typescript
// JSON
export async function POST(request: Request) {
  const data = await request.json();
  return json({ received: data });
}

// FormData
export async function POST(request: Request) {
  const formData = await request.formData();
  const name = formData.get('name');
  return json({ name });
}

// Text
export async function POST(request: Request) {
  const text = await request.text();
  return json({ text });
}
```

### Reading Headers

```typescript
import { headers } from 'velix';

export function GET(request: Request) {
  const userAgent = headers().get('user-agent');
  const authorization = headers().get('authorization');
  
  return json({ userAgent, authorization });
}
```

### Reading Cookies

```typescript
import { cookies } from 'velix';

export function GET(request: Request) {
  const sessionId = cookies().get('session');
  
  return json({ sessionId });
}

export function POST(request: Request) {
  // Définir un cookie
  cookies().set('session', 'abc123', {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7 // 7 jours
  });
  
  return json({ success: true });
}
```

### Query Parameters

```typescript
export function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  const page = url.searchParams.get('page') || '1';
  
  return json({ search, page: parseInt(page) });
}
```

---

## Dynamic Parameters

### Route with Parameter

```typescript
// server/api/users/[id].ts
import { json } from 'velix';

export function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  
  // Fetch user from database
  const user = { id: userId, name: 'Alice' };
  
  return json(user);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  
  // Delete user from database
  return json({ success: true, deletedId: userId });
}
```

### Nested Routes

```typescript
// server/api/posts/[postId]/comments/[commentId].ts
export function GET(
  request: Request, 
  { params }: { params: { postId: string; commentId: string } }
) {
  const { postId, commentId } = params;
  
  return json({ postId, commentId });
}
```

---

## Proxy Interceptor

### Proxy Global

```typescript
// proxy.ts (à la racine du projet)
import { NextFunction, MiddlewareRequest, MiddlewareResponse } from 'velix/types';

export default async function proxy(
  req: MiddlewareRequest,
  res: MiddlewareResponse,
  next: NextFunction
) {
  // Logging
  console.log(`${req.method} ${req.url}`);
  
  // CORS
  res.header('Access-Control-Allow-Origin', '*');
  
  // Authentication
  const token = req.headers.authorization;
  if (!token && req.url.includes('/api/protected')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  // Continue
  return next();
}
```

### Specific Middleware

```typescript
// server/api/protected.ts
import { json } from 'velix';

function authenticate(request: Request) {
  const token = request.headers.get('authorization');
  if (!token) {
    throw new Error('Unauthorized');
  }
  return token;
}

export function GET(request: Request) {
  try {
    const token = authenticate(request);
    return json({ message: 'Protected data', token });
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
}
```

---

## Best Practices

### ✅ DO

1. **Use Velix helpers**
   ```typescript
   import { json, text, redirect } from 'velix';
   
   export function GET() {
     return json({ data: 'value' }); // ✅
   }
   ```

2. **Validate inputs**
   ```typescript
   export async function POST(request: Request) {
     const body = await request.json();
     
     if (!body.email || !body.password) {
       return json({ error: 'Missing fields' }, { status: 400 });
     }
     
     // Continue...
   }
   ```

3. **Handle errors properly**
   ```typescript
   export async function GET(request: Request) {
     try {
       const data = await fetchData();
       return json(data);
     } catch (error) {
       console.error('API Error:', error);
       return json({ error: 'Internal Server Error' }, { status: 500 });
     }
   }
   ```

4. **Use appropriate status codes**
   ```typescript
   // 200 - OK
   return json({ data });
   
   // 201 - Created
   return json({ user }, { status: 201 });
   
   // 400 - Bad Request
   return json({ error: 'Invalid input' }, { status: 400 });
   
   // 401 - Unauthorized
   return json({ error: 'Unauthorized' }, { status: 401 });
   
   // 404 - Not Found
   return json({ error: 'Not found' }, { status: 404 });
   
   // 500 - Internal Server Error
   return json({ error: 'Server error' }, { status: 500 });
   ```

5. **Document your APIs**
   ```typescript
   /**
    * GET /api/users
    * 
    * Retrieves the list of all users
    * 
    * Query params:
    * - page: number (default: 1)
    * - limit: number (default: 10)
    * 
    * Returns: User[]
    */
   export function GET(request: Request) {
     // ...
   }
   ```

### ❌ DON'T

1. **Don't expose sensitive data**
   ```typescript
   // ❌ BAD
   export function GET() {
     return json({ 
       users: allUsersWithPasswords // Exposes passwords
     });
   }
   
   // ✅ GOOD
   export function GET() {
     return json({ 
       users: users.map(u => ({ id: u.id, name: u.name }))
     });
   }
   ```

2. **Don't ignore validation**
   ```typescript
   // ❌ BAD
   export async function POST(request: Request) {
     const body = await request.json();
     await db.users.create(body); // No validation
   }
   
   // ✅ GOOD
   export async function POST(request: Request) {
     const body = await request.json();
     
     if (!isValidEmail(body.email)) {
       return json({ error: 'Invalid email' }, { status: 400 });
     }
     
     await db.users.create(body);
   }
   ```

3. **Don't put heavy business logic in routes**
   ```typescript
   // ❌ BAD
   export async function POST(request: Request) {
     // 100 lines of business logic here
   }
   
   // ✅ GOOD
   export async function POST(request: Request) {
     const body = await request.json();
     const result = await userService.createUser(body);
     return json(result);
   }
   ```

---

## Complete Examples

### Full CRUD API

```typescript
// server/api/posts.ts
import { json } from 'velix';

let posts = [
  { id: 1, title: 'First Post', content: 'Hello World' },
];

// GET /api/posts
export function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  
  let filteredPosts = posts;
  if (search) {
    filteredPosts = posts.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  return json(filteredPosts);
}

// POST /api/posts
export async function POST(request: Request) {
  const body = await request.json();
  
  if (!body.title || !body.content) {
    return json({ error: 'Missing title or content' }, { status: 400 });
  }
  
  const newPost = {
    id: posts.length + 1,
    title: body.title,
    content: body.content
  };
  
  posts.push(newPost);
  return json(newPost, { status: 201 });
}
```

```typescript
// server/api/posts/[id].ts
import { json } from 'velix';

// GET /api/posts/:id
export function GET(request: Request, { params }: { params: { id: string } }) {
  const post = posts.find(p => p.id === parseInt(params.id));
  
  if (!post) {
    return json({ error: 'Post not found' }, { status: 404 });
  }
  
  return json(post);
}

// PUT /api/posts/:id
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const postIndex = posts.findIndex(p => p.id === parseInt(params.id));
  
  if (postIndex === -1) {
    return json({ error: 'Post not found' }, { status: 404 });
  }
  
  posts[postIndex] = { ...posts[postIndex], ...body };
  return json(posts[postIndex]);
}

// DELETE /api/posts/:id
export function DELETE(request: Request, { params }: { params: { id: string } }) {
  const postIndex = posts.findIndex(p => p.id === parseInt(params.id));
  
  if (postIndex === -1) {
    return json({ error: 'Post not found' }, { status: 404 });
  }
  
  posts.splice(postIndex, 1);
  return json({ success: true });
}
```

---

## Ressources

- [Server Actions](./server-actions.md)
- [Proxy Engine](./proxy.md)
- [Best Practices](./best-practices.md)
