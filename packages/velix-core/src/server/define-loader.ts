import { cacheManager } from '../cache/index.js';

export type LoaderContext = {
  params: Record<string, string>;
  searchParams: URLSearchParams;
  req: Request;
};

export type LoaderOptions = {
  tags?: string[];
  maxAge?: number;
  revalidate?: number;
  noStore?: boolean;
};

export type LoaderResult<T> = {
  data: T;
  headers?: Record<string, string>;
  cache?: { maxAge?: number; tags?: string[] } | 'no-store';
};

export function defineLoader<T>(
  fn: (ctx: LoaderContext) => Promise<T | LoaderResult<T>>,
  options?: LoaderOptions
): (ctx: LoaderContext) => Promise<LoaderResult<T>> {
  return async (ctx) => {
    const url = new URL(ctx.req.url || 'http://localhost');
    const cacheKey = `loader:${url.pathname}:${url.searchParams.toString()}`;

    const maxAge = options?.maxAge ?? options?.revalidate;
    const isNoStore = options?.noStore === true;

    if (!isNoStore && maxAge && maxAge > 0) {
      const cached = await cacheManager.get<LoaderResult<T>>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const rawResult = await fn(ctx);
    const result: LoaderResult<T> = (
      rawResult && typeof rawResult === 'object' && 'data' in rawResult
        ? (rawResult as LoaderResult<T>)
        : { data: rawResult as T }
    );

    const effectiveMaxAge = maxAge ?? (typeof result.cache === 'object' ? result.cache.maxAge : undefined);
    const tags = options?.tags ?? (typeof result.cache === 'object' ? result.cache.tags : undefined);

    if (!isNoStore && result.cache !== 'no-store' && effectiveMaxAge && effectiveMaxAge > 0) {
      await cacheManager.set(cacheKey, result, {
        ttl: effectiveMaxAge * 1000,
        tags,
      });
    }

    return result;
  };
}
