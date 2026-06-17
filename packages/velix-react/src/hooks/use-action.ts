import { useState, useCallback } from 'react';
import type { ActionResult } from '@teamvelix/velix-core';

type UseActionState<TOutput> = {
  data: TOutput | null;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  isPending: boolean;
};

export function useAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>
) {
  const [state, setState] = useState<UseActionState<TOutput>>({
    data: null, error: null, fieldErrors: null, isPending: false,
  });

  const mutate = useCallback(async (input: TInput) => {
    setState(s => ({ ...s, isPending: true, error: null, fieldErrors: null }));
    const result = await action(input);
    if (result.success) {
      setState({ data: result.data, error: null, fieldErrors: null, isPending: false });
    } else {
      setState({ data: null, error: result.error, fieldErrors: result.fieldErrors ?? null, isPending: false });
    }
    return result;
  }, [action]);

  const reset = useCallback(() => {
    setState({ data: null, error: null, fieldErrors: null, isPending: false });
  }, []);

  return { ...state, mutate, reset };
}
