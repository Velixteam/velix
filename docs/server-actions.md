# Server Actions - Velix v5

Server Actions allow you to execute server-side code directly from your React components, without needing to create explicit API routes.

## 📚 Table of Contents

- [Introduction](#introduction)
- [Creating a Server Action](#creating-a-server-action)
- [Using Server Actions](#using-server-actions)
- [Advanced Hooks](#advanced-hooks)
- [Security](#security)
- [Best Practices](#best-practices)

---

## Introduction

Velix Server Actions are inspired by React 19 and Next.js, with security and performance improvements.

**Advantages:**
- ✅ No need to create API routes
- ✅ Type-safe with TypeScript
- ✅ Built-in security (validation, injection protection)
- ✅ Support for FormData, Dates, and complex objects
- ✅ Native redirects and error handling

---

## Creating a Server Action

### Basic Syntax

```typescript
// server/todo/todo.action.ts
import { serverAction } from 'velix';

export const addTodo = serverAction(async (text: string) => {
  // Code executed on server only
  const todo = await db.todos.create({ text });
  return todo;
}, 'addTodo'); // Optional unique ID
```

**Note:** Server actions are placed in the `server/` directory, typically organized by feature (e.g., `server/todo/`, `server/user/`).

### With FormData

```typescript
// server/user/user.action.ts
export const createUser = serverAction(async (formData: FormData) => {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  const user = await db.users.create({ name, email });
  return { success: true, user };
});
```

### With Redirects

```typescript
// server/auth/auth.action.ts
import { serverAction, redirect } from 'velix';

export const loginUser = serverAction(async (email: string, password: string) => {
  const user = await authenticateUser(email, password);
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Automatic redirect
  redirect('/dashboard');
});
```

---

## Using Server Actions

### In a Client Component

```typescript
'use client';
import { addTodo } from '@/server/todo/todo.action';

export default function TodoForm() {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addTodo('New todo');
    
    if (result.success) {
      console.log('Todo created:', result.data);
    } else {
      console.error('Error:', result.error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### With useActionState (React 19)

```typescript
'use client';
import { useActionState } from 'velix';
import { addTodo } from '@/server/todo/todo.action';

export default function TodoForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const text = formData.get('text') as string;
      return await addTodo(text);
    },
    { success: false }
  );

  return (
    <form action={formAction}>
      <input name="text" required />
      <button disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Todo'}
      </button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

### With useFormStatus

```typescript
'use client';
import { useFormStatus } from 'velix';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

---

## Advanced Hooks

### useOptimistic

Optimistic UI updates before server response:

```typescript
'use client';
import { useOptimistic } from 'velix';
import { addTodo } from '@/server/todo/todo.action';

export default function TodoList({ initialTodos }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    initialTodos,
    (state, newTodo) => [...state, newTodo]
  );

  const handleAdd = async (text: string) => {
    // Immediate optimistic update
    addOptimisticTodo({ id: Date.now(), text, completed: false });
    
    // Server call in background
    await addTodo(text);
  };

  return (
    <ul>
      {optimisticTodos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
```

### bindArgs - Partial Application

Bind arguments to an action:

```typescript
import { serverAction, bindArgs } from 'velix';

export const updateTodo = serverAction(async (id: string, updates: any) => {
  return await db.todos.update(id, updates);
});

// In the component
const updateSpecificTodo = bindArgs(updateTodo, 'todo-123');
await updateSpecificTodo({ completed: true });
```

---

## Security

### Automatic Validation

Velix automatically validates:
- ✅ Protection against prototype injections (`__proto__`, `constructor`)
- ✅ Maximum object depth (10 levels)
- ✅ Allowed serialized types (`FormData`, `Date`, `File`)

### Action Context

Access cookies, headers, and helpers from an action:

```typescript
import { serverAction, useActionContext } from 'velix';

export const getUserData = serverAction(async () => {
  const context = useActionContext();
  
  // Access cookies
  const sessionId = context?.cookies.get('session');
  
  // Access headers
  const userAgent = context?.headers.get('user-agent');
  
  // Redirects
  if (!sessionId) {
    context?.redirect('/login');
  }
  
  return { sessionId, userAgent };
});
```

### Error Handling

```typescript
export const riskyAction = serverAction(async (data: any) => {
  try {
    const result = await dangerousOperation(data);
    return { success: true, data: result };
  } catch (error) {
    // Errors are automatically serialized
    throw new Error('Operation failed: ' + error.message);
  }
});
```

---

## Best Practices

### ✅ DO

1. **Always validate inputs**
   ```typescript
   export const createPost = serverAction(async (title: string, content: string) => {
     if (!title || title.length < 3) {
       throw new Error('Title must be at least 3 characters');
     }
     // ...
   });
   ```

2. **Use unique IDs**
   ```typescript
   export const myAction = serverAction(async () => {
     // ...
   }, 'myAction'); // Explicit ID to avoid conflicts
   ```

3. **Return structured objects**
   ```typescript
   export const saveData = serverAction(async (data: any) => {
     try {
       const result = await db.save(data);
       return { success: true, data: result };
     } catch (error) {
       return { success: false, error: error.message };
     }
   });
   ```

4. **Use revalidation after mutations**
   ```typescript
   import { serverAction, revalidatePath } from 'velix';
   
   export const addPost = serverAction(async (post: Post) => {
     await db.posts.create(post);
     revalidatePath('/blog'); // Invalidate cache
     return { success: true };
   });
   ```

### ❌ DON'T

1. **Don't expose sensitive data**
   ```typescript
   // ❌ BAD
   export const getUser = serverAction(async (id: string) => {
     return await db.users.findById(id); // Exposes hashed password
   });
   
   // ✅ GOOD
   export const getUser = serverAction(async (id: string) => {
     const user = await db.users.findById(id);
     return { id: user.id, name: user.name, email: user.email };
   });
   ```

2. **Don't perform heavy operations without feedback**
   ```typescript
   // ❌ BAD
   export const processLargeFile = serverAction(async (file: File) => {
     // Long operation without progress indication
   });
   
   // ✅ GOOD - Use useFormStatus or isPending
   ```

3. **Don't ignore errors**
   ```typescript
   // ❌ BAD
   export const deleteItem = serverAction(async (id: string) => {
     await db.items.delete(id); // No error handling
   });
   
   // ✅ GOOD
   export const deleteItem = serverAction(async (id: string) => {
     try {
       await db.items.delete(id);
       return { success: true };
     } catch (error) {
       return { success: false, error: 'Failed to delete item' };
     }
   });
   ```

---

## Complete Examples

### CRUD Todo App

```typescript
// server/todo/todo.action.ts
import { serverAction, revalidatePath } from 'velix';

let todos = [
  { id: '1', text: 'Learn Velix', completed: false },
];

export const getTodos = serverAction(async () => {
  return todos;
}, 'getTodos');

export const addTodo = serverAction(async (text: string) => {
  const newTodo = { id: Date.now().toString(), text, completed: false };
  todos.push(newTodo);
  revalidatePath('/todos');
  return newTodo;
}, 'addTodo');

export const toggleTodo = serverAction(async (id: string) => {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    revalidatePath('/todos');
  }
  return todo;
}, 'toggleTodo');

export const deleteTodo = serverAction(async (id: string) => {
  todos = todos.filter(t => t.id !== id);
  revalidatePath('/todos');
  return { success: true };
}, 'deleteTodo');
```

```typescript
// app/todos/page.tsx
import { getTodos } from '@/server/todo/todo.action';
import TodoList from './TodoList';

export default async function TodosPage() {
  const todos = await getTodos();
  
  return (
    <main>
      <h1>My Todos</h1>
      <TodoList initialTodos={todos} />
    </main>
  );
}
```

```typescript
// app/todos/TodoList.tsx
'use client';
import { useState } from 'react';
import { addTodo, toggleTodo, deleteTodo } from '@/server/todo/todo.action';

export default function TodoList({ initialTodos }) {
  const [todos, setTodos] = useState(initialTodos);
  const [text, setText] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addTodo(text);
    if (result.success) {
      setTodos([...todos, result.data]);
      setText('');
    }
  };

  return (
    <div>
      <form onSubmit={handleAdd}>
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="New todo..."
        />
        <button type="submit">Add</button>
      </form>
      
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input 
              type="checkbox" 
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Ressources

- [API Routes](./api-routes.md)
- [Revalidation](./revalidation.md)
- [Best Practices](./best-practices.md)
