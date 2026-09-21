import type { ICacheAdapter, CacheSetOptions } from './adapter.js';
export type RevalidationType = 'path' | 'tag' | 'layout';
export declare class VelixCache {
    private adapter;
    private deduplicator;
    constructor(adapter?: ICacheAdapter);
    get<T = unknown>(key: string): Promise<T | null>;
    set<T = unknown>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    revalidatePath(path: string): Promise<void>;
    revalidateTag(tag: string): Promise<void>;
    unstable_cache<T>(fn: () => Promise<T>, keys: string[], options?: {
        tags?: string[];
        revalidate?: number;
    }): () => Promise<T>;
}
export declare const cacheManager: VelixCache;
/**
 * Revalidate a specific path
 */
export declare function revalidatePath(path: string, _type?: RevalidationType): Promise<void>;
/**
 * Revalidate all paths with a specific cache tag
 */
export declare function revalidateTag(tag: string): Promise<void>;
/**
 * Unstable cache wrapper (experimental)
 */
export declare function unstable_cache<T>(fn: () => Promise<T>, keys: string[], options?: {
    tags?: string[];
    revalidate?: number;
}): () => Promise<T>;
//# sourceMappingURL=index.d.ts.map