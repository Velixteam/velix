export interface ICacheAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>
  delete(key: string): Promise<void>
  deleteByTag(tag: string): Promise<void>
  deleteByPrefix(prefix: string): Promise<void>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
}

export type CacheSetOptions = {
  ttl?: number           // millisecondes
  tags?: string[]        // pour invalidation par tag
}
