# Data Loaders (v5.2)

Velix provides a fully typed `defineLoader` utility for fetching server-side data before rendering a page or an island. 

Loaders run **exclusively on the server**. They are the perfect place to safely connect to your database, read files, or call external APIs without leaking secrets to the client.

## Defining a Loader

Create a loader in `server/loaders/` using `defineLoader`.

```ts
// server/loaders/user.loader.ts
import { defineLoader } from '@teamvelix/velix/server';
import { db } from '../db';

export const userProfileLoader = defineLoader(async (ctx) => {
  const userId = ctx.params.id; // Type-safe params!
  
  const user = await db.users.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
});
```

### The `LoaderContext`

The `ctx` object passed to your loader contains:
- `params`: Record of URL parameters (e.g., `params.id`).
- `searchParams`: The `URLSearchParams` from the incoming request.
- `req`: The raw `Request` object.

## Using Loaders in Components

You can consume loaders directly in your Server Components. Thanks to React 19's `use` hook and Velix's `useAsyncData` wrapper, the data is strongly typed out of the box.

```tsx
// app/users/[id].tsx
import { useAsyncData } from '@teamvelix/velix';
import { userProfileLoader } from '../../server/loaders/user.loader';

export default function UserProfile({ params }) {
  // `data` is fully inferred based on the loader's return type!
  const { data: user } = useAsyncData(
    userProfileLoader({ params, searchParams: new URLSearchParams(), req: new Request('') })
  );

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

*Note: A more integrated routing-loader architecture is planned for future versions to automatically pass the context.*

## Caching

You can use Velix's `unstable_cache` to memoize the results of expensive loader operations:

```ts
import { defineLoader } from '@teamvelix/velix/server';
import { unstable_cache } from '@teamvelix/velix';

export const expensiveLoader = defineLoader(async (ctx) => {
  return unstable_cache(
    async () => {
      // Expensive DB query
      return await getStats();
    },
    ['stats-key'],
    { revalidate: 60 } // Cache for 60 seconds
  )();
});
```
