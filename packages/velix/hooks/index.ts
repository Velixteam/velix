/**
 * Velix v5 Hooks
 * React 19 hooks re-exports and Velix-specific hook utilities
 */

// React 19 Core Hooks
export { useActionState, useOptimistic, use } from 'react';
export { useFormStatus } from 'react-dom';

// Velix Context Hooks
export { useParams, useQuery, usePathname, useRequest } from '../context.js';

// ============================================================================
// Velix Enhanced Hooks
// ============================================================================

import { use, useOptimistic as useOptimisticReact } from 'react';

/**
 * Async data fetching hook using React 19's use()
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const user = useAsyncData(fetchUser(userId));
 *   return <div>{user.name}</div>;
 * }
 * ```
 */
export function useAsyncData<T>(promise: Promise<T>): T {
  return use(promise);
}

/**
 * Optimistic mutation helper with typed update function
 *
 * @example
 * ```tsx
 * const [optimisticTodos, addOptimistic] = useOptimisticMutation(
 *   todos,
 *   (state, newTodo: Todo) => [...state, { ...newTodo, pending: true }]
 * );
 * ```
 */
export function useOptimisticMutation<T, M>(
  currentState: T,
  updateFn: (state: T, mutation: M) => T
): [T, (mutation: M) => void] {
  return useOptimisticReact(currentState, updateFn);
}

/**
 * Resource preloading for Suspense optimization
 */
export function preloadResource<T>(fetcher: () => Promise<T>): Promise<T> {
  return fetcher();
}

export default { useAsyncData, useOptimisticMutation, preloadResource };
