export type LoaderContext = {
  params: Record<string, string>;
  searchParams: URLSearchParams;
  req: Request;
};

export type LoaderResult<T> = {
  data: T;
  headers?: Record<string, string>;
  cache?: { maxAge: number } | 'no-store';
};

export function defineLoader<T>(
  fn: (ctx: LoaderContext) => Promise<T>
): (ctx: LoaderContext) => Promise<LoaderResult<T>> {
  return async (ctx) => {
    const data = await fn(ctx);
    return { data };
  };
}
