import { z } from 'zod';
export type ActionContext = {
    req: Request;
    headers: Headers;
};
export type ActionOptions<TInput extends z.ZodTypeAny, TOutput> = {
    input: TInput;
    handler: (ctx: {
        input: z.infer<TInput>;
        ctx: ActionContext;
    }) => Promise<TOutput>;
};
export type ActionResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
    fieldErrors?: Record<string, string[]>;
};
export declare function serverAction<TInput extends z.ZodTypeAny, TOutput>(options: ActionOptions<TInput, TOutput>): (rawInput: unknown, ctx: ActionContext) => Promise<ActionResult<TOutput>>;
//# sourceMappingURL=server-action.d.ts.map