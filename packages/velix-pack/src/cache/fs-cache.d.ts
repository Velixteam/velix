import { CacheEntry } from '../types.js';
export declare class FSCache {
    private cacheDir;
    private memoryCache;
    constructor(projectRoot: string);
    private ensureCacheDir;
    get(id: string, currentHash: string): CacheEntry | null;
    set(id: string, entry: CacheEntry): void;
    invalidate(id: string): void;
    clear(): void;
}
//# sourceMappingURL=fs-cache.d.ts.map