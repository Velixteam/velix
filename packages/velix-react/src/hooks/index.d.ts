/**
 * Velix v5 Hooks
 * React 19 hooks re-exports and Velix-specific hook utilities
 */
export { useActionState, useOptimistic, use } from 'react';
export { useFormStatus } from 'react-dom';
export { useParams, useQuery, usePathname, useRequest } from '../context.js';
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
export declare function useAsyncData<T>(promise: Promise<T>): T;
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
export declare function useOptimisticMutation<T, M>(currentState: T, updateFn: (state: T, mutation: M) => T): [T, (mutation: M) => void];
/**
 * Resource preloading for Suspense optimization
 */
export declare function preloadResource<T>(fetcher: () => Promise<T>): Promise<T>;
export * from './use-action.js';
declare const _default: {
    useAsyncData: typeof useAsyncData;
    useOptimisticMutation: typeof useOptimisticMutation;
    preloadResource: typeof preloadResource;
};
export default _default;
//# sourceMappingURL=index.d.ts.map