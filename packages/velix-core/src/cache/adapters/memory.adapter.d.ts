import type { ICacheAdapter, CacheSetOptions } from '../adapter.js';
export declare class MemoryCacheAdapter implements ICacheAdapter {
    private lru;
    private tagIndex;
    constructor(options?: {
        maxSize?: number;
    });
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
    delete(key: string): Promise<void>;
    deleteByTag(tag: string): Promise<void>;
    deleteByPrefix(prefix: string): Promise<void>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
}
//# sourceMappingURL=memory.adapter.d.ts.map