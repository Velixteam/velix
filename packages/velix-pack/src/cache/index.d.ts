import { CacheEntry } from '../types.js';
export declare class CacheManager {
    private fsCache;
    private hits;
    private misses;
    constructor(projectRoot: string);
    get(id: string, currentHash: string): CacheEntry | null;
    set(id: string, entry: CacheEntry): void;
    invalidate(id: string): void;
    clear(): void;
    getStats(): {
        hits: number;
        misses: number;
        hitRatio: number;
    };
}
//# sourceMappingURL=index.d.ts.map