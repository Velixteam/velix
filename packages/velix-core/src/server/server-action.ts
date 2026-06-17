import { z } from 'zod';

export type ActionContext = {
  req: Request;
  headers: Headers;
};

export type ActionOptions<TInput extends z.ZodTypeAny, TOutput> = {
  input: TInput;
  handler: (ctx: { input: z.infer<TInput>; ctx: ActionContext }) => Promise<TOutput>;
};

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export function serverAction<TInput extends z.ZodTypeAny, TOutput>(
  options: ActionOptions<TInput, TOutput>
) {
  return async (rawInput: unknown, ctx: ActionContext): Promise<ActionResult<TOutput>> => {
    const parsed = options.input.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }
    try {
      const data = await options.handler({ input: parsed.data, ctx });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };
}
