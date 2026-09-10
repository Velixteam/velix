import type { ActionResult } from '@teamvelix/velix-core';
export declare function useAction<TInput, TOutput>(action: (input: TInput) => Promise<ActionResult<TOutput>>): {
    mutate: (input: TInput) => Promise<ActionResult<TOutput>>;
    reset: () => void;
    data: TOutput | null;
    error: string | null;
    fieldErrors: Record<string, string[]> | null;
    isPending: boolean;
};
//# sourceMappingURL=use-action.d.ts.map