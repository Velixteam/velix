# Velix v5 Documentation

Welcome to the official Velix v5 documentation! 🚀

## 📚 Guides

### Fundamentals
- **[Server Actions](./server-actions.md)** - Execute server code from your components
- **[API Routes](./api-routes.md)** - Create custom HTTP endpoints
- **[Best Practices](./best-practices.md)** - Development best practices

### Advanced Features
- **[Revalidation](./revalidation.md)** - Cache management and invalidation
- **[Metadata](./metadata.md)** - SEO and metadata
- **[Islands Architecture](./islands.md)** - Partial hydration
- **[Middleware](./middleware.md)** - Intercept and modify requests

### Roadmap
- **[Roadmap](./roadmap.md)** - Upcoming features and official plugins

## 🚀 Quick Start

### Installation

```bash
npm create velix@latest my-app
cd my-app
npm install
npm run dev
```

### Basic Structure

```
my-velix-app/
├── app/
│   ├── page.tsx          # Home page
│   ├── layout.tsx        # Root layout
├── server/
│   ├── api/
│   │   └── hello.ts      # API route
│   └── todo/
│       └── todo.action.ts # Server action
├── public/
├── velix.config.ts
└── package.json
```

## 🎯 Key Concepts

### Server Actions vs API Routes

**Server Actions** - For mutations and component-related actions:
```typescript
import { serverAction } from 'velix';

export const addTodo = serverAction(async (text: string) => {
  const todo = await db.todos.create({ text });
  return todo;
});
```

**API Routes** - For public HTTP endpoints:
```typescript
import { json } from 'velix';

export function GET(request: Request) {
  return json({ message: 'Hello API' });
}
```

### Server vs Client Components

**Server (default)** - Server-side rendering, no client JavaScript:
```typescript
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

**Client** - Interactivity, React hooks:
```typescript
'use client';
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

## 📖 Examples

### Complete Todo App

```typescript
// server/todo/todo.action.ts
import { serverAction, revalidatePath } from 'velix';

export const addTodo = serverAction(async (text: string) => {
  const todo = await db.todos.create({ text });
  revalidatePath('/todos');
  return todo;
});

// app/todos/page.tsx
import { getTodos } from '@/server/todo/todo.action';
import TodoList from './TodoList';

export default async function TodosPage() {
  const todos = await getTodos();
  return <TodoList initialTodos={todos} />;
}

// app/todos/TodoList.tsx
'use client';
import { addTodo } from '@/server/todo/todo.action';

export default function TodoList({ initialTodos }) {
  const [todos, setTodos] = useState(initialTodos);
  
  const handleAdd = async (text: string) => {
    const result = await addTodo(text);
    if (result.success) {
      setTodos([...todos, result.data]);
    }
  };
  
  return <div>{/* UI */}</div>;
}
```

### API CRUD

```typescript
// app/api/posts/route.ts
import { json } from 'velix';

export function GET(request: Request) {
  const posts = db.posts.findAll();
  return json(posts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const post = await db.posts.create(body);
  return json(post, { status: 201 });
}

// app/api/posts/[id]/route.ts
export function GET(request: Request, { params }) {
  const post = db.posts.findById(params.id);
  return json(post);
}

export async function DELETE(request: Request, { params }) {
  await db.posts.delete(params.id);
  return json({ success: true });
}
```

## 🔧 Configuration

### velix.config.ts

```typescript
import { defineConfig } from 'velix';

export default defineConfig({
  port: 3000,
  appDir: './app',
  publicDir: './public',
  styles: ['/styles/globals.css'],
  favicon: '/favicon.webp',
  plugins: [
    // Your plugins here
  ]
});
```

## 🎨 Styling

Velix supporte Tailwind CSS par défaut :

```typescript
export default function Button() {
  return (
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Click me
    </button>
  );
}
```

## 🌐 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

```env
# .env.local
DATABASE_URL=postgresql://...
API_KEY=your-secret-key
```

## 📦 Official Plugins

- **velix-ai** - Native AI integration (In Development)
- **velix-auth** - Zero-config authentication (Planned)
- **velix-analytics** - Privacy-first analytics (Planned)
- **velix-db** - Type-safe mini-ORM (Planned)

## 🤝 Contributing

Velix is open-source! Check our [GitHub](https://github.com/velix/velix) to contribute.

## 📞 Support

- **Documentation** : [velix.vercel.app](https://velix.vercel.app)
- **Discord** : [discord.gg/velix](https://discord.gg/velix)
- **GitHub Issues** : [github.com/velix/velix/issues](https://github.com/velix/velix/issues)

---

**Velix v5.0.0** - Built with ❤️ by the Velix Team
