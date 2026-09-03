import { FSCache } from './fs-cache.js';
import { CacheEntry } from '../types.js';

export class CacheManager {
  private fsCache: FSCache;
  private hits: number = 0;
  private misses: number = 0;

  constructor(projectRoot: string) {
    this.fsCache = new FSCache(projectRoot);
  }

  public get(id: string, currentHash: string): CacheEntry | null {
    const entry = this.fsCache.get(id, currentHash);
    if (entry) {
      this.hits++;
      return entry;
    }
    this.misses++;
    return null;
  }

  public set(id: string, entry: CacheEntry): void {
    this.fsCache.set(id, entry);
  }

  public invalidate(id: string): void {
    this.fsCache.invalidate(id);
  }

  public clear(): void {
    this.fsCache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)) * 100 : 0,
    };
  }
}
