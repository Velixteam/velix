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
    cache?: {
        maxAge?: number;
        tags?: string[];
    } | 'no-store';
};
export declare function defineLoader<T>(fn: (ctx: LoaderContext) => Promise<T | LoaderResult<T>>, options?: LoaderOptions): (ctx: LoaderContext) => Promise<LoaderResult<T>>;
//# sourceMappingURL=define-loader.d.ts.map